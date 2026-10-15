import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'neon-orb-daemon-'));
process.env.NEON_ORB_DAEMON_STATE_FILE = path.join(dir, 'daemon.json');
process.env.NEON_ORB_STATE_FILE = path.join(dir, 'runtime.json');
process.env.NEON_ECONOMIC_STATE_FILE = path.join(dir, 'economy.json');
process.env.NEON_REAL_ECONOMIC_REGISTRY_FILE = path.join(dir, 'registry.json');
process.env.NEON_LLM_API_KEY = '';
const { calculateEconomicAccounting } = await import('../server/economic-accounting.js');
const { NeonOrbDaemon } = await import('../core/neon-orb-daemon.js');

test('accounting counts only verified EUR assets and confirmed execution costs', () => {
  const result = calculateEconomicAccounting({
    governor: { execution: 'READ_VERIFY_ONLY', paused: false, opportunities: [{ realityVerified: true, netProfitEUR: 5 }], executions: [
      { status: 'EXECUTED_PENDING_SETTLEMENT', spendEUR: 2 },
      { status: 'FAILED', spendEUR: 50 },
      { status: 'SETTLED_VERIFIED', spendEUR: 1 }
    ] },
    registry: { assets: [
      { amountEUR: 10, currency: 'EUR', verification: { verified: true } },
      { amountEUR: 100, currency: 'EUR', verification: { verified: false } },
      { amountEUR: 3, currency: 'BTC', verification: { verified: true } }
    ] }
  });
  assert.equal(result.verifiedRevenueEUR, 10);
  assert.equal(result.confirmedSpendEUR, 3);
  assert.equal(result.realizedNetEUR, 7);
  assert.equal(result.pendingSettlementCount, 1);
});

test('resident daemon tick persists state and does not execute economic actions', async () => {
  const daemon = new NeonOrbDaemon({ intervalMs: 15000, discover: false });
  const result = await daemon.tick();
  assert.equal(result.ok, true);
  assert.equal(result.daemon.identity, 'NEON_ORB');
  assert.equal(result.daemon.tickCount, 1);
  const saved = JSON.parse(await fs.readFile(process.env.NEON_ORB_DAEMON_STATE_FILE, 'utf8'));
  assert.equal(saved.tickCount, 1);
  assert.equal(saved.discovery.enabled, false);
});

test('cleanup temporary daemon state', async () => { await fs.rm(dir, { recursive: true, force: true }); });
