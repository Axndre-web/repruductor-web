import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neonOrbRuntime } from './neon-orb-runtime.js';
import { neonOrbGovernor } from '../server/economic-governor.js';
import { discoverConfigured, rankPositiveOpportunities } from '../server/opportunity-engine.js';
import { calculateEconomicAccounting } from '../server/economic-accounting.js';
import { discoverPublicWork } from '../server/public-work-sources.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATE_FILE = process.env.NEON_ORB_DAEMON_STATE_FILE || path.join(ROOT, 'data', 'neon-orb-daemon.json');
const now = () => new Date().toISOString();
const boundedError = error => String(error?.message || error || 'unknown_error').slice(0, 240);

const freshState = () => ({
  schemaVersion: 1,
  identity: 'NEON_ORB',
  service: 'RESIDENT_WORK_DAEMON',
  status: 'STOPPED',
  startedAt: null,
  lastTickAt: null,
  nextTickAt: null,
  tickCount: 0,
  discovery: { enabled: false, lastAt: null, discovered: 0, leads: [], errors: [] },
  lastError: null,
  lastAccounting: null
});

/**
 * Resident, supervised background loop for Neon Orb.
 * It observes, reconciles and discovers work; it NEVER spends or transfers funds
 * automatically. External execution remains a separately authorized operation.
 */
export class NeonOrbDaemon {
  constructor({ intervalMs = Number(process.env.NEON_DAEMON_INTERVAL_MS || 3600000), discover = process.env.NEON_DAEMON_DISCOVERY_ENABLED !== 'false' } = {}) {
    this.intervalMs = Math.max(15000, Number(intervalMs) || 60000);
    this.discoveryEnabled = Boolean(discover);
    this.timer = null;
    this.runningTick = null;
    this.state = freshState();
    this.ready = this.load();
  }

  async load() {
    try {
      const saved = JSON.parse(await fs.readFile(STATE_FILE, 'utf8'));
      this.state = { ...freshState(), ...saved, discovery: { ...freshState().discovery, ...(saved.discovery || {}) } };
      this.state.status = 'STOPPED'; // a process restart must not claim the old loop is alive
    } catch (error) {
      if (error?.code !== 'ENOENT') this.state.lastError = `state_load:${boundedError(error)}`;
    }
    return this.snapshot();
  }

  async persist() {
    await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
    const tmp = `${STATE_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(this.state, null, 2), { mode: 0o600 });
    await fs.rename(tmp, STATE_FILE);
  }

  snapshot() {
    return structuredClone({ ...this.state, intervalMs: this.intervalMs, discoveryEnabled: this.discoveryEnabled });
  }

  start() {
    if (this.timer) return this.snapshot();
    this.state.status = 'RUNNING';
    this.state.startedAt = now();
    this.state.discovery.enabled = this.discoveryEnabled;
    this.state.nextTickAt = new Date(Date.now() + 1000).toISOString();
    void this.tick().catch(() => {});
    this.timer = setInterval(() => {
      this.state.nextTickAt = new Date(Date.now() + this.intervalMs).toISOString();
      void this.tick().catch(() => {});
    }, this.intervalMs);
    this.timer.unref?.();
    void this.persist().catch(error => { this.state.lastError = `persist:${boundedError(error)}`; });
    return this.snapshot();
  }

  async tick() {
    if (this.runningTick) return this.runningTick;
    this.runningTick = (async () => {
      await this.ready;
      await neonOrbRuntime.ready;
      const at = now();
      try {
        let discovery = { discovered: [], errors: [] };
        let publicLeads = { jobs: [], errors: [] };
        if (this.discoveryEnabled) {
          // Public listings are leads only; they are never marked as verified revenue or executable contracts.
          publicLeads = await discoverPublicWork({ limit: 60 });
          if (String(process.env.NEON_OPPORTUNITY_FEEDS || '').trim()) discovery = await discoverConfigured();
          const leadRecords = (publicLeads.jobs || []).map(job => ({
            id: job.id, source: job.source, sourceName: job.sourceName, title: job.title,
            company: job.company, listingUrl: job.listingUrl, publishedAt: job.publishedAt || null,
            payDisclosure: job.payDisclosure || 'PAY_NOT_VERIFIED', status: 'LEAD_ONLY_REQUIRES_HUMAN_REVIEW',
            discoveredAt: at
          }));
          const previous = Array.isArray(this.state.discovery.leads) ? this.state.discovery.leads : [];
          const byId = new Map([...previous, ...leadRecords].map(item => [item.id, item]));
          this.state.discovery = {
            enabled: true, lastAt: at,
            discovered: leadRecords.length,
            leads: [...byId.values()].slice(-500),
            errors: [...(publicLeads.errors || []), ...(discovery.errors || [])].slice(0, 20).map(item => ({ source: item.source || null, code: item.code || 'DISCOVERY_ERROR', opportunityId: item.opportunityId || null, url: item.url || null, error: item.error || null }))
          };
        } else {
          this.state.discovery.enabled = false;
          this.state.discovery.lastAt = at;
          this.state.discovery.discovered = 0;
          this.state.discovery.errors = [];
        }
        const accounting = calculateEconomicAccounting();
        const candidates = rankPositiveOpportunities();
        this.state.lastAccounting = accounting;
        if (this.state.lastTickAt !== at) { this.state.lastTickAt = at; this.state.tickCount += 1; }
        this.state.lastError = null;
        this.state.status = this.timer ? 'RUNNING' : 'MANUAL_TICK';
        neonOrbRuntime.addMemory({
          type: 'DAEMON_TICK',
          message: `Ciclo residente ${this.state.tickCount}: ${this.state.discovery.discovered || 0} ofertas públicas detectadas, ${candidates.length} oportunidades económicas verificadas; ${accounting.verifiedRevenueEUR} EUR de ingresos verificados.`,
          reflection: 'El ciclo descubre ofertas como pistas no verificadas y reconcilia evidencia económica; no presenta ofertas como contratos ni registra ingresos pendientes como cobrados.',
          intent: 'RECONCILE_AND_DISCOVER',
          outcome: 'TICK_COMPLETED'
        });
        await Promise.all([this.persist(), neonOrbRuntime.persist()]);
        neonOrbGovernor.audit('RESIDENT_DAEMON_TICK', { tickCount: this.state.tickCount, candidates: candidates.length, verifiedRevenueEUR: accounting.verifiedRevenueEUR, realizedNetEUR: accounting.realizedNetEUR });
        return { ok: true, daemon: this.snapshot(), accounting, positiveVerifiedOpportunities: candidates.length };
      } catch (error) {
        if (this.state.lastTickAt !== at) { this.state.lastTickAt = at; this.state.tickCount += 1; }
        this.state.lastError = boundedError(error);
        this.state.status = this.timer ? 'DEGRADED' : 'MANUAL_TICK_FAILED';
        await this.persist().catch(() => {});
        return { ok: false, code: 'DAEMON_TICK_FAILED', error: this.state.lastError, daemon: this.snapshot() };
      }
    })();
    try { return await this.runningTick; }
    finally { this.runningTick = null; }
  }

  async stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.state.status = 'STOPPED';
    this.state.nextTickAt = null;
    await this.persist();
    return this.snapshot();
  }
}

export const neonOrbDaemon = new NeonOrbDaemon();
