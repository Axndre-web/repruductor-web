/** Background coordination for NEON ORB. Reads only public telemetry and keeps bounded status. */
import { getMarketQuotes, getMiningPoolStatus } from './market-mining-telemetry.js';
import { refreshWalletObservation, snapshotWalletObservation } from './wallet-observer.js';
import { neonOrbDaemon } from '../core/neon-orb-daemon.js';
import { neonOrbRuntime } from '../core/neon-orb-runtime.js';
import { minerSupervisorStatus, startConfiguredMiner, stopConfiguredMiner } from './miner-supervisor.js';
import { getBitcoinNetworkStatus } from './bitcoin-network.js';

let timer = null;
let inFlight = null;
const state = { active: false, startedAt: null, lastTickAt: null, tickCount: 0, market: { status: 'WAITING' }, mining: { status: 'WAITING' }, bitcoin: { status: 'WAITING' }, wallet: { status: 'WAITING' }, lastError: null };
const intervalMs = () => Math.max(60_000, Math.min(900_000, Number(process.env.NEON_AUTONOMY_TICK_MS || 300_000)));

export function autonomySupervisorStatus() {
  return {
    identity: 'NEON_ORB', mode: 'RESIDENT_AUTONOMY', ...structuredClone(state), intervalMs: intervalMs(),
    daemon: neonOrbDaemon.snapshot(), walletObserver: snapshotWalletObservation().observer,
    miner: minerSupervisorStatus(),
    permissions: {
      localCodeReadAuditAndFixedTests: true, guardedCodeEditsWithBackup: true,
      publicWebAndJobDiscovery: true, publicWalletBalanceObservation: true,
      useServerSideConfiguredProviderCredentials: true,
      privateKeyOrSeedPhraseAccess: false, automaticSigning: false, automaticWithdrawals: false,
      unboundedSpending: false, claimsOfProfitWithoutSettlement: false
    },
    credentials: {
      adminTokenConfigured: Boolean(process.env.NEON_ADMIN_TOKEN && process.env.NEON_ADMIN_TOKEN.length >= 32),
      llmProviderConfigured: Boolean(process.env.NEON_LLM_API_KEY || process.env.NEON_AGENT_API_KEY || process.env.NEON_AGENT_BASE_URL),
      paymentProviderConfigured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) || Boolean(process.env.STRIPE_SECRET_KEY),
      secretValuesExposed: false
    }
  };
}

export async function runAutonomyTick() {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const at = new Date().toISOString();
    const [wallet, market, mining, bitcoin] = await Promise.allSettled([
      refreshWalletObservation(),
      getMarketQuotes({ assets: ['BTC','ETH','SOL','USDC'], fiats: ['EUR','USD'] }),
      getMiningPoolStatus(),
      getBitcoinNetworkStatus()
    ]);
    state.wallet = wallet.status === 'fulfilled' ? { status: wallet.value?.observer?.state || 'OBSERVED', observedAt: wallet.value?.observedAt || at, balances: Array.isArray(wallet.value?.balances) ? wallet.value.balances.length : 0 } : { status: 'DEGRADED', error: String(wallet.reason?.message || 'WALLET_OBSERVATION_FAILED').slice(0,120) };
    state.market = market.status === 'fulfilled' ? { status: market.value?.ok ? 'UPDATED' : 'DEGRADED', queriedAt: market.value?.queriedAt || at, quotes: Array.isArray(market.value?.quotes) ? market.value.quotes.filter(q => q.verified).length : 0 } : { status: 'DEGRADED', error: String(market.reason?.message || 'MARKET_QUOTES_FAILED').slice(0,120) };
    state.mining = mining.status === 'fulfilled' ? { status: mining.value?.status || 'OBSERVED', observedAt: mining.value?.observedAt || at, poolStatsAvailable: Boolean(mining.value?.poolStats), workerConfigured: Boolean(mining.value?.workerConfigured), rewardsAreVerifiedIncome: false } : { status: 'DEGRADED', error: String(mining.reason?.message || 'MINING_TELEMETRY_FAILED').slice(0,120) };
    state.bitcoin = bitcoin.status === 'fulfilled' ? { status: bitcoin.value?.publicNetwork?.status || 'OBSERVED', observedAt: bitcoin.value?.observedAt || at, tipHeight: bitcoin.value?.publicNetwork?.tipHeight ?? null, localNodeStatus: bitcoin.value?.localNode?.status || 'NODE_NOT_CONFIGURED', poolId: bitcoin.value?.mining?.configuredPool || null } : { status: 'DEGRADED', error: String(bitcoin.reason?.message || 'BITCOIN_TELEMETRY_FAILED').slice(0,120) };
    state.lastTickAt = at; state.tickCount += 1;
    state.lastError = [wallet, market, mining, bitcoin].some(x => x.status === 'rejected') ? 'ONE_OR_MORE_READ_ONLY_TASKS_DEGRADED' : null;
    neonOrbRuntime.addMemory({ type: 'AUTONOMY_SUPERVISOR_TICK', message: `Supervisión residente: wallets=${state.wallet.status}, mercado=${state.market.status}, minería=${state.mining.status}, Bitcoin=${state.bitcoin.status}.`, reflection: 'Solo se registran observaciones. No se atribuyen ingresos a ofertas, cotizaciones ni recompensas no liquidadas.', intent: 'OBSERVE_AND_DISCOVER', outcome: state.lastError ? 'PARTIAL' : 'COMPLETED' });
    return autonomySupervisorStatus();
  })();
  try { return await inFlight; } finally { inFlight = null; }
}

export async function startAutonomySupervisor() {
  if (timer) return autonomySupervisorStatus();
  state.active = true; state.startedAt = new Date().toISOString();
  const autoMiner = String(process.env.NEON_MINING_AUTOSTART || (process.env.NEON_MINER_EXECUTABLE ? 'true' : 'false')).toLowerCase() !== 'false';
  if (autoMiner) await startConfiguredMiner().catch(error => { state.lastError = String(error?.message || 'MINER_START_FAILED').slice(0,120); });
  void runAutonomyTick().catch(error => { state.lastError = String(error?.message || 'AUTONOMY_TICK_FAILED').slice(0,120); });
  timer = setInterval(() => { void runAutonomyTick().catch(error => { state.lastError = String(error?.message || 'AUTONOMY_TICK_FAILED').slice(0,120); }); }, intervalMs());
  timer.unref?.();
  return autonomySupervisorStatus();
}

export async function stopAutonomySupervisor() {
  if (timer) clearInterval(timer);
  timer = null; state.active = false;
  await stopConfiguredMiner().catch(() => {});
  return autonomySupervisorStatus();
}
