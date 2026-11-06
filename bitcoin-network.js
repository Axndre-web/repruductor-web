/** Read-only Bitcoin network and optional local Bitcoin Core node telemetry.
 * Never calls wallet RPC methods, signs, sends, or moves funds.
 */
import fs from 'node:fs/promises';

const NETWORK_BASE = 'https://mempool.space/api';
const timeoutFetch = async (url, { timeoutMs = 6000, headers = {} } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json', 'user-agent': 'NeonPlayerX-NeonOrb/1.0', ...headers }, redirect: 'error' });
    if (!response.ok) throw new Error(`UPSTREAM_HTTP_${response.status}`);
    return response;
  } finally { clearTimeout(timer); }
};
const safeError = error => error?.name === 'AbortError' ? 'UPSTREAM_TIMEOUT' : String(error?.message || 'UPSTREAM_UNAVAILABLE').slice(0, 100);
const asNumber = value => Number.isFinite(Number(value)) ? Number(value) : null;
const isLoopback = hostname => ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(String(hostname).toLowerCase());

async function readNodeAuth() {
  const user = String(process.env.BITCOIN_RPC_USER || '');
  const password = String(process.env.BITCOIN_RPC_PASSWORD || '');
  if (user && password) return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
  const cookieFile = String(process.env.BITCOIN_RPC_COOKIE_FILE || '').trim();
  if (cookieFile) {
    const cookie = (await fs.readFile(cookieFile, 'utf8')).trim();
    if (!cookie || cookie.length > 512 || !/^__cookie__:[^\r\n]+$/.test(cookie)) throw new Error('BITCOIN_RPC_COOKIE_INVALID');
    return `Basic ${Buffer.from(cookie).toString('base64')}`;
  }
  return null;
}

async function getLocalBitcoinCoreStatus() {
  const rpcRaw = String(process.env.BITCOIN_RPC_URL || '').trim();
  const hasAuth = Boolean((process.env.BITCOIN_RPC_USER && process.env.BITCOIN_RPC_PASSWORD) || process.env.BITCOIN_RPC_COOKIE_FILE);
  if (!rpcRaw && !hasAuth) return { configured: false, status: 'NODE_NOT_CONFIGURED', note: 'No se ha configurado RPC local de Bitcoin Core; la telemetría pública sigue disponible.' };
  let url;
  try { url = new URL(rpcRaw || 'http://127.0.0.1:8332/'); }
  catch { return { configured: true, status: 'NODE_CONFIG_INVALID', error: 'BITCOIN_RPC_URL_INVALID' }; }
  if (!['http:', 'https:'].includes(url.protocol) || !isLoopback(url.hostname) || url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) {
    return { configured: true, status: 'NODE_CONFIG_REJECTED', error: 'BITCOIN_RPC_MUST_BE_LOOPBACK_ONLY' };
  }
  let authorization;
  try { authorization = await readNodeAuth(); }
  catch (error) { return { configured: true, status: 'NODE_AUTH_ERROR', error: safeError(error) }; }
  if (!authorization) return { configured: true, status: 'NODE_AUTH_MISSING', error: 'BITCOIN_RPC_AUTH_NOT_CONFIGURED' };
  const headers = { authorization, 'content-type': 'application/json' };
  try {
    const methods = ['getblockchaininfo', 'getnetworkinfo', 'getmempoolinfo'];
    const results = await Promise.all(methods.map(async (method, index) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      try {
        const response = await fetch(url.toString(), {
          method: 'POST', signal: controller.signal, redirect: 'error',
          headers: { accept: 'application/json', 'content-type': 'application/json', authorization, 'user-agent': 'NeonPlayerX-NeonOrb/1.0' },
          body: JSON.stringify({ jsonrpc: '1.0', id: `neon-${index}`, method, params: [] })
        });
        if (!response.ok) throw new Error(`BITCOIN_RPC_HTTP_${response.status}`);
        const body = await response.json();
        if (body?.error) throw new Error('BITCOIN_RPC_METHOD_ERROR');
        return body?.result ?? null;
      } finally { clearTimeout(timer); }
    }));
    const [chain, network, mempool] = results;
    if (!chain || !network || !mempool) throw new Error('BITCOIN_RPC_RESPONSE_INVALID');
    return {
      configured: true, status: 'NODE_CONNECTED', source: 'BITCOIN_CORE_RPC_READ_ONLY', observedAt: new Date().toISOString(),
      chain: String(chain.chain || 'unknown'), blocks: asNumber(chain.blocks), headers: asNumber(chain.headers),
      verificationProgress: asNumber(chain.verificationprogress), initialBlockDownload: Boolean(chain.initialblockdownload),
      connections: asNumber(network.connections), version: asNumber(network.version), subversion: String(network.subversion || '').slice(0, 80),
      mempoolTransactions: asNumber(mempool.size), mempoolBytes: asNumber(mempool.bytes),
      permissions: { readChainInfo: true, readNetworkInfo: true, readMempoolInfo: true, walletRpc: false, signing: false, broadcasting: false }
    };
  } catch (error) {
    return { configured: true, status: 'NODE_UNAVAILABLE', error: safeError(error), observedAt: new Date().toISOString(), permissions: { walletRpc: false, signing: false, broadcasting: false } };
  }
}

export async function getBitcoinNetworkStatus() {
  const observedAt = new Date().toISOString();
  const [height, mempool, fees, node] = await Promise.allSettled([
    (async () => { const response = await timeoutFetch(`${NETWORK_BASE}/blocks/tip/height`, { timeoutMs: 6000, headers: { accept: 'text/plain' } }); return asNumber(await response.text()); })(),
    (async () => { const response = await timeoutFetch(`${NETWORK_BASE}/mempool`, { timeoutMs: 6000 }); const data = await response.json(); return { count: asNumber(data.count), vsize: asNumber(data.vsize), totalFeeBTC: asNumber(data.total_fee) }; })(),
    (async () => { const response = await timeoutFetch(`${NETWORK_BASE}/v1/fees/recommended`, { timeoutMs: 6000 }); const data = await response.json(); return { fastestFee: asNumber(data.fastestFee), halfHourFee: asNumber(data.halfHourFee), hourFee: asNumber(data.hourFee), economyFee: asNumber(data.economyFee), minimumFee: asNumber(data.minimumFee) }; })(),
    getLocalBitcoinCoreStatus()
  ]);
  const publicNetwork = {
    source: 'MEMPOOL_SPACE_PUBLIC_API', observedAt,
    tipHeight: height.status === 'fulfilled' ? height.value : null,
    mempool: mempool.status === 'fulfilled' ? mempool.value : null,
    feesSatVByte: fees.status === 'fulfilled' ? fees.value : null,
    status: height.status === 'fulfilled' && mempool.status === 'fulfilled' ? 'PUBLIC_NETWORK_OBSERVED' : 'PUBLIC_NETWORK_DEGRADED',
    errors: [height, mempool, fees].map((r, i) => r.status === 'rejected' ? ['TIP_HEIGHT_UNAVAILABLE','MEMPOOL_UNAVAILABLE','FEE_ESTIMATES_UNAVAILABLE'][i] : null).filter(Boolean)
  };
  const localNode = node.status === 'fulfilled' ? node.value : { configured: false, status: 'NODE_STATUS_FAILED', error: 'NODE_STATUS_FAILED' };
  return {
    ok: publicNetwork.status === 'PUBLIC_NETWORK_OBSERVED', identity: 'NEON_ORB', asset: 'BTC', observedAt,
    publicNetwork, localNode,
    mining: { configuredPool: String(process.env.NEON_MINING_POOL || 'etc').toLowerCase(), payoutAddressConfigured: Boolean(String(process.env.NEON_MINING_WALLET_ADDRESS || process.env.NEON_BITCOIN_ADDRESS || '').trim()), bitcoinPayoutAddressConfigured: Boolean(String(process.env.NEON_BITCOIN_ADDRESS || '').trim()), note: 'El pool ETC configurado puede publicar pagos en BTC si el proveedor y la dirección de pago lo admiten; esto no equivale a minar Bitcoin nativo.' },
    safety: { readOnly: true, remoteRpcForbidden: true, walletRpc: false, signs: false, broadcasts: false, transfersFunds: false }
  };
}
