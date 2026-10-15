import test from 'node:test';
import assert from 'node:assert/strict';
import { getJupiterSwapQuote, getMarketQuotes, getMiningPoolStatus, getObservedWalletBalances, listMiningPools, verifyBitcoinPayout } from '../server/market-mining-telemetry.js';

test('pool catalog only exposes known 2Miners API hosts', () => {
  const pools = listMiningPools();
  assert.ok(pools.length >= 5);
  assert.ok(pools.every(p => new URL(p.api).hostname.endsWith('2miners.com')));
});

test('pool telemetry reads public stats and does not invent shares or a worker', async t => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    assert.equal(String(url), 'https://etc.2miners.com/api/stats');
    return new Response(JSON.stringify({ data: { hashrate: 12345, minersTotal: 42, workersTotal: 44, maturedTotal: 99 } }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const result = await getMiningPoolStatus({ poolId: 'etc', wallet: '' });
  assert.equal(result.status, 'POOL_ONLINE_WALLET_NOT_CONFIGURED');
  assert.equal(result.poolStats.hashrate, 12345);
  assert.equal(result.acceptedShares, null);
  assert.equal(result.workerConfigured, false);
});

test('pool telemetry reads account metrics only when a coin-specific wallet is supplied', async t => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    const u = String(url);
    if (u.endsWith('/stats')) return new Response(JSON.stringify({ data: { hashrate: 200, minersTotal: 5, workersTotal: 7 } }), { status: 200 });
    if (u.includes('/accounts/0x1111111111111111111111111111111111111111/shares/30m')) {
      return new Response(JSON.stringify({ data: { shares: [{ valid: 7, stale: 2, invalid: 1 }, { valid: 3, stale: 0, invalid: 0 }] } }), { status: 200 });
    }
    if (u.includes('/accounts/0x1111111111111111111111111111111111111111')) {
      return new Response(JSON.stringify({ data: { currentHashrate: 100, hashrate: 90, workersOnline: 1, workersTotal: 1, stats: { balance: 0.12, paid: 0.5, lastShare: 1700000000, blocksFound: 2 } } }), { status: 200 });
    }
    throw new Error('unexpected_url');
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const result = await getMiningPoolStatus({ poolId: 'etc', wallet: '0x1111111111111111111111111111111111111111' });
  assert.equal(result.status, 'ACCOUNT_OBSERVED');
  assert.equal(result.account.hashrateCurrent, 100);
  assert.equal(result.rewards.pending, 0.12);
  assert.equal(result.acceptedShares, 10);
  assert.equal(result.rejectedShares, 1);
  assert.equal(result.staleShares, 2);
});

test('market quotes distinguish real quote responses from unavailable pairs', async t => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    if (String(url).includes('/BTC-USD/spot')) return new Response(JSON.stringify({ data: { amount: '60000.00', currency: 'USD' } }), { status: 200 });
    return new Response('not found', { status: 404 });
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const result = await getMarketQuotes({ assets: ['BTC'], fiats: ['USD', 'EUR'] });
  assert.equal(result.quotes.find(q => q.fiat === 'USD').verified, true);
  assert.equal(result.quotes.find(q => q.fiat === 'USD').price, 60000);
  assert.equal(result.quotes.find(q => q.fiat === 'EUR').verified, false);
  assert.equal(result.quotes.find(q => q.fiat === 'USD').executable, false);
});

test('observed wallet balances use JSON-RPC and never return key material', async t => {
  const old = { fetch: globalThis.fetch, address: process.env.SOLANA_WALLET_ADDRESS, btc: process.env.NEON_BITCOIN_ADDRESS };
  process.env.SOLANA_WALLET_ADDRESS = 'PublicSolanaAddress111111111111111111111111111';
  delete process.env.NEON_BITCOIN_ADDRESS;
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes('api.mainnet-beta.solana.com')) {
      assert.equal(options.method, 'POST');
      const body = JSON.parse(options.body);
      assert.equal(body.method, 'getBalance');
      return new Response(JSON.stringify({ result: { value: 2000000000, context: { slot: 123 } } }), { status: 200 });
    }
    throw new Error('unexpected_url');
  };
  t.after(() => {
    globalThis.fetch = old.fetch;
    if (old.address === undefined) delete process.env.SOLANA_WALLET_ADDRESS; else process.env.SOLANA_WALLET_ADDRESS = old.address;
    if (old.btc === undefined) delete process.env.NEON_BITCOIN_ADDRESS; else process.env.NEON_BITCOIN_ADDRESS = old.btc;
  });
  const result = await getObservedWalletBalances();
  assert.equal(result.balances.find(x => x.asset === 'SOL').amount, 2);
  assert.equal(JSON.stringify(result).includes('privateKey'), false);
});

test('Jupiter quote is real-route data but never marks a swap as executed', async t => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    assert.match(String(url), /^https:\/\/lite-api\.jup\.ag\/swap\/v1\/quote\?/);
    const u = new URL(String(url));
    return new Response(JSON.stringify({
      inputMint: u.searchParams.get('inputMint'),
      outputMint: u.searchParams.get('outputMint'),
      inAmount: u.searchParams.get('amount'),
      outAmount: '2500000',
      otherAmountThreshold: '2475000',
      slippageBps: 50,
      priceImpactPct: '0.001',
      routePlan: [{}],
      contextSlot: 123,
      timeTaken: 0.2
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const result = await getJupiterSwapQuote({
    inputMint: 'So11111111111111111111111111111111111111112',
    outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amount: '100000000',
    slippageBps: 50
  });
  assert.equal(result.ok, true);
  assert.equal(result.executable, false);
  assert.equal(result.settlementStatus, 'NOT_EXECUTED');
  assert.equal(result.quote.outAmount, '2500000');
});

test('Jupiter quote rejects invalid mint or amount before network access', async () => {
  const result = await getJupiterSwapQuote({ inputMint: 'not-a-mint', outputMint: 'also-invalid', amount: '0' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'SWAP_MINT_INVALID');
});

test('Bitcoin payout verification requires a confirmed transaction output to the configured address', async t => {
  const originalFetch = globalThis.fetch;
  const address = 'bc1qs9dvc02xl8ury20xlsya8xda4cpygzhs0ll9ym';
  const txid = 'a'.repeat(64);
  globalThis.fetch = async url => {
    assert.equal(String(url), `https://mempool.space/api/tx/${txid}`);
    return new Response(JSON.stringify({
      txid,
      status: { confirmed: true, block_height: 900000, block_time: 1790000000 },
      vout: [
        { scriptpubkey_address: address, value: 12345 },
        { scriptpubkey_address: 'bc1qanotheraddress000000000000000000000000', value: 999 }
      ]
    }), { status: 200 });
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const result = await verifyBitcoinPayout({ txid, address });
  assert.equal(result.verified, true);
  assert.equal(result.amountBTCToAddress, 0.00012345);
  assert.equal(result.status, 'CONFIRMED');
});

test('Bitcoin payout verification rejects malformed transaction ids before network access', async () => {
  const result = await verifyBitcoinPayout({ txid: 'bad' });
  assert.equal(result.verified, false);
  assert.equal(result.code, 'BITCOIN_TXID_INVALID');
});
