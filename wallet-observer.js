import { getObservedWalletBalances } from './market-mining-telemetry.js';

const DEFAULT_INTERVAL_MS = 60_000;
let timer = null;
let inFlight = null;
let lastSnapshot = {
  ok: true,
  identity: 'NEON_ORB',
  balances: [],
  observedAt: null,
  observer: { active: false, intervalMs: DEFAULT_INTERVAL_MS, state: 'WAITING_FOR_START', lastError: null }
};

const enabled = () => String(process.env.NEON_WALLET_AUTO_OBSERVE || 'true').trim().toLowerCase() !== 'false';
const intervalMs = () => {
  const value = Number.parseInt(process.env.NEON_WALLET_OBSERVE_INTERVAL_MS || String(DEFAULT_INTERVAL_MS), 10);
  return Number.isFinite(value) ? Math.min(300_000, Math.max(15_000, value)) : DEFAULT_INTERVAL_MS;
};

export async function refreshWalletObservation() {
  if (!enabled()) {
    lastSnapshot = { ...lastSnapshot, observer: { active: false, intervalMs: intervalMs(), state: 'DISABLED_BY_CONFIGURATION', lastError: null } };
    return snapshotWalletObservation();
  }
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const attemptedAt = new Date().toISOString();
    try {
      const result = await getObservedWalletBalances();
      lastSnapshot = { ...result, observer: { active: true, intervalMs: intervalMs(), state: 'RUNNING', lastAttemptAt: attemptedAt, lastError: null } };
    } catch (error) {
      lastSnapshot = { ...lastSnapshot, observer: { active: true, intervalMs: intervalMs(), state: 'DEGRADED', lastAttemptAt: attemptedAt, lastError: String(error?.message || 'wallet_observation_failed').slice(0, 160) } };
    }
    return snapshotWalletObservation();
  })();
  try { return await inFlight; } finally { inFlight = null; }
}

export function snapshotWalletObservation() {
  if (!enabled()) return { ...lastSnapshot, observer: { ...lastSnapshot.observer, active: false, state: 'DISABLED_BY_CONFIGURATION' } };
  return { ...lastSnapshot, balances: [...(lastSnapshot.balances || [])], observer: { ...lastSnapshot.observer, active: Boolean(timer) } };
}

export function startWalletObserver() {
  if (!enabled()) {
    lastSnapshot = { ...lastSnapshot, observer: { active: false, intervalMs: intervalMs(), state: 'DISABLED_BY_CONFIGURATION', lastError: null } };
    return snapshotWalletObservation();
  }
  if (timer) return snapshotWalletObservation();
  lastSnapshot = { ...lastSnapshot, observer: { active: true, intervalMs: intervalMs(), state: 'STARTING', lastError: null } };
  void refreshWalletObservation();
  timer = setInterval(() => { void refreshWalletObservation(); }, intervalMs());
  timer.unref?.();
  return snapshotWalletObservation();
}

export function stopWalletObserver() {
  if (timer) clearInterval(timer);
  timer = null;
  lastSnapshot = { ...lastSnapshot, observer: { ...lastSnapshot.observer, active: false, state: 'STOPPED' } };
  return snapshotWalletObservation();
}
