/** Read-only multi-chain wallet observation. Uses public RPC defaults and never handles secrets. */
import { getMarketQuotes } from './market-mining-telemetry.js';

const timeoutFetch = async (url, init = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, headers: { accept: 'application/json', ...(init.headers || {}) }, redirect: 'error' });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
};
const configuredRpc = (name, fallback) => {
  const raw = String(process.env[name] || fallback || '').trim();
  if (!raw) return null;
  const url = new URL(raw);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname))) throw new Error(`${name}_MUST_USE_HTTPS`);
  return url.toString();
};
const validEvm = value => /^0x[a-fA-F0-9]{40}$/.test(String(value || '').trim());
const validSolana = value => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(value || '').trim());
const validBitcoin = value => /^(bc1[ac-hj-np-z02-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(String(value || '').trim());
const asNative = hex => {
  if (typeof hex !== 'string' || !/^0x[0-9a-f]+$/i.test(hex)) throw new Error('RPC_BALANCE_SCHEMA_INVALID');
  return Number(BigInt(hex)) / 1e18;
};

function configuredEvmTokens() {
  const raw = String(process.env.EVM_TOKEN_LIST || '').trim();
  if (!raw) return [];
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(token => token && ['ethereum', 'base'].includes(token.chain) && /^0x[a-fA-F0-9]{40}$/.test(String(token.address || '')) && /^[A-Z0-9._-]{2,16}$/.test(String(token.symbol || '')) && Number.isInteger(Number(token.decimals)) && Number(token.decimals) >= 0 && Number(token.decimals) <= 36).slice(0, 40);
}
async function getEvmTokenBalances({ chain, rpcEnv, fallback, address }) {
  const tokens = configuredEvmTokens().filter(token => token.chain === chain);
  if (!tokens.length) return [];
  let rpc;
  try { rpc = configuredRpc(rpcEnv, fallback); } catch (error) { return tokens.map(token => ({ chain, asset: token.symbol, symbol: token.symbol, tokenAddress: token.address, address, verified: false, error: String(error.message) })); }
  return Promise.all(tokens.map(async token => {
    try {
      const paddedAddress = address.slice(2).toLowerCase().padStart(64, '0');
      const data = await timeoutFetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'eth_call', params: [{ to: token.address, data: `0x70a08231${paddedAddress}` }, 'latest'] }) });
      if (data.error || !/^0x[0-9a-f]+$/i.test(String(data.result || ''))) throw new Error('ERC20_BALANCE_RESPONSE_INVALID');
      const raw = BigInt(data.result);
      return { chain, asset: token.symbol, symbol: token.symbol, tokenAddress: token.address, amountRaw: raw.toString(), amount: Number(raw) / (10 ** Number(token.decimals)), decimals: Number(token.decimals), address, source: 'EVM_ERC20_RPC', verified: true, observedAt: new Date().toISOString() };
    } catch (error) { return { chain, asset: token.symbol, symbol: token.symbol, tokenAddress: token.address, address, verified: false, error: String(error?.message || 'ERC20_BALANCE_UNAVAILABLE').slice(0, 100) }; }
  }));
}
async function getEvmNativeBalance({ chain, rpcEnv, fallback, address }) {
  let rpc;
  try { rpc = configuredRpc(rpcEnv, fallback); } catch (error) { return { chain, asset: 'ETH', amount: null, address, verified: false, error: String(error.message) }; }
  try {
    const [balance, chainId] = await Promise.all([
      timeoutFetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }) }),
      timeoutFetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_chainId', params: [] }) })
    ]);
    if (balance.error || chainId.error || !balance.result || !chainId.result) throw new Error('RPC_RESPONSE_INVALID');
    return { chain, chainId: Number(BigInt(chainId.result)), asset: 'ETH', amount: asNative(balance.result), address, source: 'EVM_JSON_RPC', verified: true, observedAt: new Date().toISOString() };
  } catch (error) { return { chain, asset: 'ETH', amount: null, address, verified: false, error: String(error?.message || 'RPC_UNAVAILABLE').slice(0, 100) }; }
}

async function getBitcoinBalance(address) {
  if (!address) return { chain: 'bitcoin', asset: 'BTC', amount: null, address: null, verified: false, error: 'BITCOIN_PUBLIC_ADDRESS_NOT_CONFIGURED' };
  if (!validBitcoin(address)) return { chain: 'bitcoin', asset: 'BTC', amount: null, address: null, verified: false, error: 'BITCOIN_ADDRESS_INVALID' };
  try {
    const data = await timeoutFetch(`https://mempool.space/api/address/${encodeURIComponent(address)}`);
    const funded = Number(data?.chain_stats?.funded_txo_sum || 0) + Number(data?.mempool_stats?.funded_txo_sum || 0);
    const spent = Number(data?.chain_stats?.spent_txo_sum || 0) + Number(data?.mempool_stats?.spent_txo_sum || 0);
    if (!Number.isFinite(funded) || !Number.isFinite(spent)) throw new Error('BITCOIN_BALANCE_SCHEMA_INVALID');
    return { chain: 'bitcoin', asset: 'BTC', amount: (funded - spent) / 1e8, address, source: 'MEMPOOL_SPACE_PUBLIC_API', verified: true, observedAt: new Date().toISOString() };
  } catch (error) { return { chain: 'bitcoin', asset: 'BTC', amount: null, address, verified: false, error: String(error?.message || 'BITCOIN_RPC_UNAVAILABLE').slice(0, 100) }; }
}
async function getSolanaBalances(address) {
  if (!address) return [{ chain: 'solana', asset: 'SOL', amount: null, address: null, verified: false, error: 'SOLANA_PUBLIC_ADDRESS_NOT_CONFIGURED' }];
  if (!validSolana(address)) return [{ chain: 'solana', asset: 'SOL', amount: null, address: null, verified: false, error: 'SOLANA_ADDRESS_INVALID' }];
  let rpc;
  try { rpc = configuredRpc('SOLANA_RPC_ENDPOINT', 'https://api.mainnet-beta.solana.com'); }
  catch (error) { return [{ chain: 'solana', asset: 'SOL', amount: null, address, verified: false, error: String(error.message) }]; }
  const call = async (method, params) => {
    const body = await timeoutFetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }) });
    if (body.error || body.result == null) throw new Error(`SOLANA_${method.toUpperCase()}_FAILED`);
    return body.result;
  };
  try {
    const [balance, classic, token2022] = await Promise.all([
      call('getBalance', [address, { commitment: 'confirmed' }]),
      call('getTokenAccountsByOwner', [address, { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, { encoding: 'jsonParsed', commitment: 'confirmed' }]).catch(() => ({ value: [] })),
      call('getTokenAccountsByOwner', [address, { programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb' }, { encoding: 'jsonParsed', commitment: 'confirmed' }]).catch(() => ({ value: [] }))
    ]);
    const rows = [{ chain: 'solana', asset: 'SOL', amount: Number(balance.value) / 1e9, amountRaw: String(balance.value), address, source: 'SOLANA_PUBLIC_RPC', verified: true, observedAt: new Date().toISOString() }];
    for (const account of [...(classic.value || []), ...(token2022.value || [])]) {
      const info = account?.account?.data?.parsed?.info; const token = info?.tokenAmount;
      if (!info?.mint || !token) continue;
      rows.push({ chain: 'solana', asset: info.mint, symbol: null, mint: info.mint, amount: token.uiAmountString == null ? (token.uiAmount == null ? null : Number(token.uiAmount)) : Number(token.uiAmountString), amountRaw: token.amount, decimals: token.decimals, address, tokenAccount: account.pubkey, source: 'SOLANA_SPL_RPC', verified: true, observedAt: new Date().toISOString(), note: 'Token SPL identificado por mint; sin valoración automática salvo cotización configurada.' });
    }
    return rows;
  } catch (error) { return [{ chain: 'solana', asset: 'SOL', amount: null, address, verified: false, error: String(error?.message || 'SOLANA_RPC_UNAVAILABLE').slice(0, 100) }]; }
}

export async function getMultichainWalletSnapshot({ evmAddress = '', solanaAddress = '', bitcoinAddress = '' } = {}) {
  const address = String(evmAddress || '').trim();
  const sol = String(solanaAddress || process.env.SOLANA_WALLET_ADDRESS || process.env.NEON_SOLANA_ADDRESS || process.env.NEON_SOLANA_PUBLIC_KEY || '').trim();
  const btc = String(bitcoinAddress || process.env.NEON_BITCOIN_ADDRESS || process.env.BITCOIN_ADDRESS || '').trim();
  if (address && !validEvm(address)) throw new Error('EVM_ADDRESS_INVALID');
  if (sol && !validSolana(sol)) throw new Error('SOLANA_ADDRESS_INVALID');
  if (btc && !validBitcoin(btc)) throw new Error('BITCOIN_ADDRESS_INVALID');

  // BTC/SOL are queried directly below so address overrides are honored and duplicate RPC calls are avoided.
  const balances = [];
  const [btcBalance, solBalances] = await Promise.all([getBitcoinBalance(btc), getSolanaBalances(sol)]);
  balances.push(btcBalance, ...solBalances);
  if (address) {
    const evm = await Promise.all([
      getEvmNativeBalance({ chain: 'ethereum', rpcEnv: 'ETHEREUM_RPC_ENDPOINT', fallback: 'https://ethereum-rpc.publicnode.com', address }),
      getEvmNativeBalance({ chain: 'base', rpcEnv: 'BASE_RPC_ENDPOINT', fallback: 'https://mainnet.base.org', address })
    ]);
    balances.push(...evm);
    const evmTokens = await Promise.all([
      getEvmTokenBalances({ chain: 'ethereum', rpcEnv: 'ETHEREUM_RPC_ENDPOINT', fallback: 'https://ethereum-rpc.publicnode.com', address }),
      getEvmTokenBalances({ chain: 'base', rpcEnv: 'BASE_RPC_ENDPOINT', fallback: 'https://mainnet.base.org', address })
    ]);
    balances.push(...evmTokens.flat());
  } else {
    balances.push({ chain: 'ethereum', asset: 'ETH', amount: null, verified: false, error: 'COINBASE_WALLET_NOT_CONNECTED' }, { chain: 'base', asset: 'ETH', amount: null, verified: false, error: 'COINBASE_WALLET_NOT_CONNECTED' });
  }
  let quotes = { ok: false, quotes: [] };
  try { quotes = await getMarketQuotes({ assets: ['BTC', 'ETH', 'SOL', 'USDC', 'USDT'], fiats: ['USD', 'EUR'] }); } catch {}
  const priceMap = new Map((quotes.quotes || []).filter(q => q.verified && Number.isFinite(Number(q.price))).map(q => [`${q.asset}:${q.fiat}`, Number(q.price)]));
  for (const item of balances) {
    item.valuation = { USD: null, EUR: null };
    const asset = String(item.asset || '').toUpperCase();
    if (!item.verified || !Number.isFinite(Number(item.amount)) || !['BTC', 'ETH', 'SOL', 'USDC', 'USDT'].includes(asset)) continue;
    for (const fiat of ['USD', 'EUR']) { const price = priceMap.get(`${asset}:${fiat}`); if (price !== undefined) item.valuation[fiat] = Number(item.amount) * price; }
  }
  const totals = { USD: 0, EUR: 0, includedBalances: { USD: 0, EUR: 0 }, complete: true };
  for (const item of balances) {
    const asset = String(item.asset || '').toUpperCase();
    if (!item.verified || !['BTC', 'ETH', 'SOL', 'USDC', 'USDT'].includes(asset)) { totals.complete = false; continue; }
    for (const fiat of ['USD', 'EUR']) { if (Number.isFinite(item.valuation?.[fiat])) { totals[fiat] += item.valuation[fiat]; totals.includedBalances[fiat]++; } else totals.complete = false; }
  }
  return { ok: true, identity: 'NEON_ORB', mode: 'READ_ONLY', observedAt: new Date().toISOString(), connectedEvmAddress: address || null, connectedSolanaAddress: sol || null, observedBitcoinAddress: btc || null, balances, totals, quotesObservedAt: quotes.queriedAt || null,
    positions: { status: 'NOT_CONNECTED', source: null, items: [], note: 'Las posiciones Perps/derivados de TSLA requieren una API autenticada del proveedor; no se deducen de saldos on-chain.' },
    discovery: { defaults: ['Solana mainnet public RPC', 'Ethereum public RPC', 'Base public RPC', 'mempool.space Bitcoin API'], addresses: { evm: address ? 'wallet-session' : 'awaiting-wallet-session', solana: sol ? (solanaAddress ? 'wallet-session' : 'server-config') : 'not-configured', bitcoin: btc ? (bitcoinAddress ? 'wallet-session' : 'server-config') : 'not-configured' } },
    safety: { signsTransactions: false, submitsTransactions: false, privateKeysRead: false } };
}
