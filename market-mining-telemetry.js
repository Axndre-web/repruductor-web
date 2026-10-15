/**
 * Read-only market, public-chain balance and mining-pool telemetry.
 * This module never starts a miner, signs a transaction or moves funds.
 */
const timeoutFetch = async (url, { timeoutMs = 6500, headers = {} } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json', 'user-agent': 'NeonPlayerX-NeonOrb/1.0', ...headers },
      redirect: 'error'
    });
    if (!response.ok) throw new Error(`UPSTREAM_HTTP_${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
};

const POOLS = Object.freeze({
  etc: { name: '2Miners ETC', base: 'https://etc.2miners.com/api', coin: 'ETC', algorithm: 'Etchash' },
  rvn: { name: '2Miners RVN', base: 'https://rvn.2miners.com/api', coin: 'RVN', algorithm: 'KawPoW' },
  kas: { name: '2Miners KAS', base: 'https://kas.2miners.com/api', coin: 'KAS', algorithm: 'kHeavyHash' },
  zec: { name: '2Miners ZEC', base: 'https://zec.2miners.com/api', coin: 'ZEC', algorithm: 'Equihash' },
  ethw: { name: '2Miners ETHW', base: 'https://ethw.2miners.com/api', coin: 'ETHW', algorithm: 'Ethash' },
  erg: { name: '2Miners ERG', base: 'https://erg.2miners.com/api', coin: 'ERG', algorithm: 'Autolykos' },
  nexa: { name: '2Miners NEXA', base: 'https://nexa.2miners.com/api', coin: 'NEXA', algorithm: 'NexaPow' }
});
const numOrNull = value => value !== undefined && value !== null && Number.isFinite(Number(value)) ? Number(value) : null;
const unwrap = data => data?.data ?? data;
const safeError = e => e?.name === 'AbortError' ? 'UPSTREAM_TIMEOUT' : String(e?.message || 'UPSTREAM_UNAVAILABLE').slice(0, 120);

export function listMiningPools() {
  return Object.entries(POOLS).map(([id, p]) => ({ id, name: p.name, coin: p.coin, algorithm: p.algorithm, api: p.base, mode: 'READ_ONLY_POOL_TELEMETRY', miningClientRequired: true }));
}

export async function getMiningPoolStatus({ poolId = process.env.NEON_MINING_POOL || 'etc', wallet = process.env.NEON_MINING_WALLET_ADDRESS || '' } = {}) {
  const pool = POOLS[String(poolId).toLowerCase()];
  if (!pool) return { ok: false, identity: 'NEON_ORB', code: 'MINING_POOL_NOT_SUPPORTED', supportedPools: listMiningPools() };
  const enabled = String(process.env.ENABLE_REAL_MINING || 'false').toLowerCase() === 'true';
  const result = {
    ok: true, identity: 'NEON_ORB', source: '2MINERS_PUBLIC_API', pool: pool.name, poolId: String(poolId).toLowerCase(),
    coin: pool.coin, algorithm: pool.algorithm, api: pool.base, observedAt: new Date().toISOString(),
    miningEnabledByConfig: enabled, workerConfigured: false, worker: null, poolStats: null, account: null,
    acceptedShares: null, rejectedShares: null, rewards: { pending: null, paid: null, currency: pool.coin, unitSemantics: 'POOL_API_RETURNED_UNITS' },
    status: 'POOL_STATS_ONLY', note: 'El panel solo observa el pool. Para enviar shares se necesita un minero compatible ejecutándose con hardware y una dirección válida.'
  };
  try {
    const poolData = unwrap(await timeoutFetch(`${pool.base}/stats`));
    result.poolStats = {
      hashrate: numOrNull(poolData.hashrate),
      miners: numOrNull(poolData.minersTotal),
      workers: numOrNull(poolData.workersTotal),
      blocksFound: numOrNull(poolData.maturedTotal),
      observedAt: poolData.now ? new Date(Number(poolData.now) > 1e12 ? Number(poolData.now) : Number(poolData.now) * 1000).toISOString() : result.observedAt
    };
  } catch (e) {
    result.poolStatsError = safeError(e);
  }

  const workerAddress = String(wallet || '').trim();
  if (!workerAddress) {
    result.status = result.poolStats ? 'POOL_ONLINE_WALLET_NOT_CONFIGURED' : 'POOL_UNAVAILABLE';
    result.note = 'Configura NEON_MINING_WALLET_ADDRESS con la dirección pública específica de la moneda del pool. La dirección SOL no es una dirección de minería ETC/RVN/KAS.';
    return result;
  }
  if (!/^[A-Za-z0-9:_-]{10,180}$/.test(workerAddress)) {
    result.status = 'INVALID_WALLET_FORMAT';
    result.code = 'MINING_WALLET_ADDRESS_INVALID';
    return result;
  }
  result.workerConfigured = true;
  result.payoutAsset = (/^bc1/i.test(workerAddress) || /^[13]/.test(workerAddress)) ? 'BTC' : pool.coin;
  result.rewards.currency = result.payoutAsset;
  result.worker = `${workerAddress.slice(0, 7)}…${workerAddress.slice(-5)}`;
  try {
    const account = unwrap(await timeoutFetch(`${pool.base}/accounts/${encodeURIComponent(workerAddress)}`));
    const stats = account.stats || {};
    const workers = account.workers || {};
    result.account = {
      hashrateCurrent: numOrNull(account.currentHashrate),
      hashrateAverage: numOrNull(account.hashrate),
      workersOnline: numOrNull(account.workersOnline),
      workersTotal: numOrNull(account.workersTotal),
      lastShareAt: numOrNull(stats.lastShare) ? new Date(Number(stats.lastShare) * 1000).toISOString() : null,
      paymentsTotal: numOrNull(account.paymentsTotal),
      blocksFound: numOrNull(stats.blocksFound),
      recentPayments: Array.isArray(account.payments) ? account.payments.slice(-10).reverse().map(payment => ({
        txid: /^[a-fA-F0-9]{64}$/.test(String(payment.tx || '')) ? String(payment.tx) : null,
        timestamp: numOrNull(payment.timestamp) ? new Date(Number(payment.timestamp) * 1000).toISOString() : null,
        amountRaw: payment.amount == null ? null : String(payment.amount),
        source: '2MINERS_ACCOUNT_API',
        settlementStatus: 'NOT_YET_CHAIN_VERIFIED'
      })) : []
    };
    result.rewards.pending = numOrNull(stats.balance);
    result.rewards.paid = numOrNull(stats.paid);
    result.rewards.unitSemantics = 'POOL_API_RETURNED_UNITS';
    // The 2Miners account API exposes a 30-minute share series with valid/stale/invalid counts.
    try {
      const shareData = unwrap(await timeoutFetch(`${pool.base}/accounts/${encodeURIComponent(workerAddress)}/shares/30m`));
      const series = Array.isArray(shareData?.shares) ? shareData.shares : [];
      result.acceptedShares = series.length ? series.reduce((sum, row) => sum + (numOrNull(row.valid) || 0), 0) : null;
      result.staleShares = series.length ? series.reduce((sum, row) => sum + (numOrNull(row.stale) || 0), 0) : null;
      result.rejectedShares = series.length ? series.reduce((sum, row) => sum + (numOrNull(row.invalid) || 0), 0) : null;
      result.shareWindow = series.length ? '30m' : null;
    } catch (shareError) {
      result.shareTelemetryError = safeError(shareError);
      result.acceptedShares = numOrNull(account.acceptedShares ?? stats.acceptedShares ?? account.sharesAccepted);
      result.rejectedShares = numOrNull(account.rejectedShares ?? stats.rejectedShares ?? account.sharesRejected);
    }
    result.status = 'ACCOUNT_OBSERVED';
    result.note = 'Las cifras son telemetría devuelta por el pool; solo sus pagos on-chain o su liquidación acreditada cuentan como ingreso realizado.';
  } catch (e) {
    const errorCode = safeError(e);
    if (errorCode === 'UPSTREAM_HTTP_404') {
      result.status = 'ACCOUNT_NOT_FOUND_YET';
      result.accountError = 'POOL_ACCOUNT_NOT_FOUND';
      result.note = 'El pool no publica todavía una cuenta/actividad para esta dirección. Las shares aparecerán cuando un minero compatible se conecte y envíe trabajo válido.';
    } else {
      result.status = 'POOL_ACCOUNT_UNAVAILABLE';
      result.accountError = errorCode;
    }
  }
  return result;
}

const ALLOWED_ASSETS = new Set(['BTC', 'ETH', 'SOL', 'LTC', 'DOGE', 'USDC', 'USDT', 'ETC', 'RVN', 'KAS', 'ZEC', 'EUR']);
const ALLOWED_FIATS = new Set(['USD', 'EUR', 'GBP']);
const marketCache = new Map();
const swapQuoteCache = new Map();
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const TOKEN_DECIMALS = new Map([[SOL_MINT, 9], [USDC_MINT, 6]]);

export async function getJupiterSwapQuote({ inputMint, outputMint, amount, slippageBps = 50 } = {}) {
  const input = String(inputMint || '').trim();
  const output = String(outputMint || '').trim();
  const rawAmount = String(amount || '').trim();
  const slippage = Number(slippageBps);
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input) || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(output) || input === output) {
    return { ok: false, identity: 'NEON_ORB', code: 'SWAP_MINT_INVALID' };
  }
  if (!/^[1-9]\d{0,29}$/.test(rawAmount)) return { ok: false, identity: 'NEON_ORB', code: 'SWAP_AMOUNT_INVALID' };
  if (!Number.isInteger(slippage) || slippage < 1 || slippage > 3000) return { ok: false, identity: 'NEON_ORB', code: 'SWAP_SLIPPAGE_INVALID' };
  const cacheKey = `${input}|${output}|${rawAmount}|${slippage}`;
  const cached = swapQuoteCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 10000) return { ...cached.value, cached: true };
  const url = new URL('https://lite-api.jup.ag/swap/v1/quote');
  url.searchParams.set('inputMint', input);
  url.searchParams.set('outputMint', output);
  url.searchParams.set('amount', rawAmount);
  url.searchParams.set('slippageBps', String(slippage));
  try {
    const data = await timeoutFetch(url.toString(), { timeoutMs: 7000 });
    if (String(data?.inAmount) !== rawAmount || String(data?.inputMint) !== input || String(data?.outputMint) !== output || !/^[1-9]\d*$/.test(String(data?.outAmount || ''))) {
      throw new Error('JUPITER_QUOTE_SCHEMA_INVALID');
    }
    const value = {
      ok: true, identity: 'NEON_ORB', source: 'JUPITER_SWAP_API_V1', quotedAt: new Date().toISOString(),
      executable: false, signingRequired: true, settlementStatus: 'NOT_EXECUTED',
      quote: {
        inputMint: input, outputMint: output, inAmount: String(data.inAmount), outAmount: String(data.outAmount),
        otherAmountThreshold: String(data.otherAmountThreshold || ''), slippageBps: Number(data.slippageBps ?? slippage),
        priceImpactPct: numOrNull(data.priceImpactPct), routePlanCount: Array.isArray(data.routePlan) ? data.routePlan.length : null,
        contextSlot: numOrNull(data.contextSlot), timeTaken: numOrNull(data.timeTaken),
        inputDecimals: TOKEN_DECIMALS.get(input) ?? null, outputDecimals: TOKEN_DECIMALS.get(output) ?? null
      },
      note: 'Cotización de ruta real y temporal. No se ha firmado ni enviado una transacción; el precio puede cambiar y no representa una liquidación.'
    };
    swapQuoteCache.set(cacheKey, { at: Date.now(), value });
    return value;
  } catch (e) {
    return { ok: false, identity: 'NEON_ORB', source: 'JUPITER_SWAP_API_V1', code: safeError(e), executable: false };
  }
}

export async function getMarketQuotes({ assets = ['BTC', 'ETH', 'SOL', 'USDC'], fiats = ['USD', 'EUR'] } = {}) {
  const cleanAssets = [...new Set(assets.map(x => String(x).toUpperCase()).filter(x => ALLOWED_ASSETS.has(x)))].slice(0, 8);
  const cleanFiats = [...new Set(fiats.map(x => String(x).toUpperCase()).filter(x => ALLOWED_FIATS.has(x)))].slice(0, 3);
  if (String(process.env.NEON_MARKET_QUOTES_ENABLED || 'true').toLowerCase() === 'false') {
    return { ok: false, identity: 'NEON_ORB', source: 'COINBASE_SPOT_PUBLIC_API', disabled: true, quotes: [], queriedAt: new Date().toISOString() };
  }
  const cacheKey = `${cleanAssets.join(',')}|${cleanFiats.join(',')}`;
  const cacheTtl = Math.max(5000, Number(process.env.NEON_MARKET_DATA_CACHE_MS || 30000));
  const cached = marketCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < cacheTtl) return { ...cached.value, cached: true };
  const queriedAt = new Date().toISOString();
  const quotes = await Promise.all(cleanAssets.flatMap(asset => cleanFiats.map(async fiat => {
    if (asset === fiat) return { asset, fiat, price: 1, source: 'IDENTITY_RATE', observedAt: queriedAt, verified: true, executable: false };
    try {
      const url = `https://api.coinbase.com/v2/prices/${encodeURIComponent(asset)}-${encodeURIComponent(fiat)}/spot`;
      const data = await timeoutFetch(url, { timeoutMs: 5000 });
      const price = Number(data?.data?.amount);
      const currency = String(data?.data?.currency || '');
      if (!(price > 0) || currency !== fiat) throw new Error('QUOTE_SCHEMA_INVALID');
      return { asset, fiat, price, source: 'COINBASE_SPOT', observedAt: queriedAt, verified: true, executable: false, note: 'Precio indicativo de mercado; no es una orden ni una cotización ejecutable.' };
    } catch (e) {
      return { asset, fiat, price: null, source: 'COINBASE_SPOT', observedAt: queriedAt, verified: false, executable: false, error: safeError(e) };
    }
  })));
  const value = { ok: true, identity: 'NEON_ORB', source: 'COINBASE_SPOT_PUBLIC_API', queriedAt, quotes, cached: false };
  marketCache.set(cacheKey, { cachedAt: Date.now(), value });
  return value;
}

export async function verifyBitcoinPayout({ txid, address = process.env.NEON_BITCOIN_ADDRESS || process.env.BITCOIN_ADDRESS || '' } = {}) {
  const hash = String(txid || '').trim().toLowerCase();
  const wallet = String(address || '').trim();
  if (!/^[a-f0-9]{64}$/.test(hash)) return { ok: false, verified: false, code: 'BITCOIN_TXID_INVALID' };
  if (!(/^bc1[a-z0-9]{20,90}$/.test(wallet) || /^[13][a-km-zA-HJ-NP-Z1-9]{25,35}$/.test(wallet))) {
    return { ok: false, verified: false, code: 'BITCOIN_ADDRESS_INVALID' };
  }
  try {
    const tx = await timeoutFetch(`https://mempool.space/api/tx/${hash}`, { timeoutMs: 7000 });
    const matchingOutputs = Array.isArray(tx.vout) ? tx.vout.filter(output => output.scriptpubkey_address === wallet) : [];
    const sats = matchingOutputs.reduce((sum, output) => sum + (Number.isSafeInteger(Number(output.value)) ? Number(output.value) : 0), 0);
    const confirmed = tx.status?.confirmed === true;
    const verified = confirmed && sats > 0 && String(tx.txid || '').toLowerCase() === hash;
    return {
      ok: true, identity: 'NEON_ORB', source: 'MEMPOOL_SPACE_TX_API', txid: hash, address: wallet,
      verified, status: confirmed ? 'CONFIRMED' : 'UNCONFIRMED', blockHeight: tx.status?.block_height ?? null,
      blockTime: tx.status?.block_time ? new Date(Number(tx.status.block_time) * 1000).toISOString() : null,
      amountBTCToAddress: sats / 1e8, matchingOutputs: matchingOutputs.length,
      code: verified ? 'BITCOIN_PAYOUT_CONFIRMED_TO_CONFIGURED_ADDRESS' : 'BITCOIN_PAYOUT_NOT_CONFIRMED_OR_NO_MATCHING_OUTPUT'
    };
  } catch (e) {
    return { ok: false, identity: 'NEON_ORB', verified: false, code: safeError(e), source: 'MEMPOOL_SPACE_TX_API' };
  }
}

export async function getObservedWalletBalances() {
  const result = { ok: true, identity: 'NEON_ORB', observedAt: new Date().toISOString(), balances: [] };
  const solAddress = String(process.env.SOLANA_WALLET_ADDRESS || process.env.NEON_SOLANA_ADDRESS || process.env.NEON_SOLANA_PUBLIC_KEY || '').trim();
  const solRpc = String(process.env.SOLANA_RPC_ENDPOINT || process.env.NEON_SOLANA_RPC || 'https://api.mainnet-beta.solana.com').trim();
  if (solAddress && /^https:\/\//i.test(solRpc)) {
    try {
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 6500);
      try {
        const response = await fetch(solRpc, { method: 'POST', signal: controller.signal, headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [solAddress, { commitment: process.env.SOLANA_COMMITMENT || 'confirmed' }] }) });
        if (!response.ok) throw new Error(`SOLANA_RPC_HTTP_${response.status}`);
        const data = await response.json();
        if (data.error || !Number.isFinite(Number(data?.result?.value))) throw new Error('SOLANA_RPC_RESPONSE_INVALID');
        result.balances.push({ asset: 'SOL', address: solAddress, amount: Number(data.result.value) / 1e9, unit: 'SOL', source: 'SOLANA_JSON_RPC', slot: data.result.context?.slot ?? null, verified: true });
      } finally { clearTimeout(timer); }
    } catch (e) { result.balances.push({ asset: 'SOL', address: solAddress, verified: false, error: safeError(e) }); }
  } else result.balances.push({ asset: 'SOL', verified: false, error: 'SOLANA_PUBLIC_ADDRESS_NOT_CONFIGURED' });

  const btcAddress = String(process.env.NEON_BITCOIN_ADDRESS || process.env.BITCOIN_ADDRESS || '').trim();
  if (btcAddress && /^bc1[a-z0-9]{20,90}$|^[13][a-km-zA-HJ-NP-Z1-9]{25,35}$/.test(btcAddress)) {
    try {
      const data = await timeoutFetch(`https://mempool.space/api/address/${encodeURIComponent(btcAddress)}`);
      const funded = Number(data?.chain_stats?.funded_txo_sum || 0) + Number(data?.mempool_stats?.funded_txo_sum || 0);
      const spent = Number(data?.chain_stats?.spent_txo_sum || 0) + Number(data?.mempool_stats?.spent_txo_sum || 0);
      result.balances.push({ asset: 'BTC', address: btcAddress, amount: (funded - spent) / 1e8, unit: 'BTC', source: 'MEMPOOL_SPACE_ADDRESS_API', verified: true });
    } catch (e) { result.balances.push({ asset: 'BTC', address: btcAddress, verified: false, error: safeError(e) }); }
  } else result.balances.push({ asset: 'BTC', verified: false, error: 'BITCOIN_PUBLIC_ADDRESS_NOT_CONFIGURED' });
  return result;
}
