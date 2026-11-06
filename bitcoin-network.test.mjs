import test from 'node:test';
import assert from 'node:assert/strict';
import { getBitcoinNetworkStatus } from '../server/bitcoin-network.js';

const keys = ['BITCOIN_RPC_URL','BITCOIN_RPC_USER','BITCOIN_RPC_PASSWORD','BITCOIN_RPC_COOKIE_FILE','NEON_MINING_POOL','NEON_MINING_WALLET_ADDRESS','NEON_BITCOIN_ADDRESS'];
const snapshot = () => Object.fromEntries(keys.map(key => [key, process.env[key]]));
const restore = before => { for (const key of keys) { if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key]; } };

test('Bitcoin telemetry synchronizes public network and safely reports no local node configured', async t => {
  const before = snapshot();
  for (const key of keys) delete process.env[key];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const u = String(url);
    if (u.endsWith('/blocks/tip/height')) return new Response('900123', { status: 200 });
    if (u.endsWith('/mempool')) return new Response(JSON.stringify({ count: 1200, vsize: 250000, total_fee: 0.03 }), { status: 200 });
    if (u.endsWith('/v1/fees/recommended')) return new Response(JSON.stringify({ fastestFee: 18, halfHourFee: 12, hourFee: 8, economyFee: 4, minimumFee: 2 }), { status: 200 });
    throw new Error(`unexpected request ${u} ${options.method || 'GET'}`);
  };
  t.after(() => { globalThis.fetch = originalFetch; restore(before); });
  const result = await getBitcoinNetworkStatus();
  assert.equal(result.asset, 'BTC');
  assert.equal(result.publicNetwork.tipHeight, 900123);
  assert.equal(result.publicNetwork.mempool.count, 1200);
  assert.equal(result.publicNetwork.feesSatVByte.fastestFee, 18);
  assert.equal(result.localNode.status, 'NODE_NOT_CONFIGURED');
  assert.equal(result.safety.signs, false);
});

test('Bitcoin Core RPC rejects remote hosts before network access', async t => {
  const before = snapshot();
  process.env.BITCOIN_RPC_URL = 'http://example.com:8332/';
  process.env.BITCOIN_RPC_USER = 'test-user';
  process.env.BITCOIN_RPC_PASSWORD = 'test-password';
  delete process.env.BITCOIN_RPC_COOKIE_FILE;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('network must not be called for remote RPC'); };
  t.after(() => { globalThis.fetch = originalFetch; restore(before); });
  const result = await getBitcoinNetworkStatus();
  assert.equal(result.localNode.status, 'NODE_CONFIG_REJECTED');
  assert.equal(result.localNode.error, 'BITCOIN_RPC_MUST_BE_LOOPBACK_ONLY');
  assert.equal(JSON.stringify(result).includes('test-password'), false);
});

test('Bitcoin Core RPC is read-only and reports selected chain metadata', async t => {
  const before = snapshot();
  process.env.BITCOIN_RPC_URL = 'http://127.0.0.1:8332/';
  process.env.BITCOIN_RPC_USER = 'rpc-user';
  process.env.BITCOIN_RPC_PASSWORD = 'rpc-password';
  delete process.env.BITCOIN_RPC_COOKIE_FILE;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const u = String(url);
    if (u.endsWith('/blocks/tip/height')) return new Response('900123', { status: 200 });
    if (u.endsWith('/mempool')) return new Response(JSON.stringify({ count: 5, vsize: 500, total_fee: 0.0001 }), { status: 200 });
    if (u.endsWith('/v1/fees/recommended')) return new Response(JSON.stringify({ fastestFee: 15, halfHourFee: 10, hourFee: 6, economyFee: 3, minimumFee: 1 }), { status: 200 });
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    assert.ok(['getblockchaininfo','getnetworkinfo','getmempoolinfo'].includes(body.method));
    assert.equal(options.redirect, 'error');
    const results = {
      getblockchaininfo: { chain: 'main', blocks: 900123, headers: 900123, verificationprogress: 0.999, initialblockdownload: false },
      getnetworkinfo: { connections: 8, version: 280000, subversion: '/Satoshi:28.0.0/' },
      getmempoolinfo: { size: 120, bytes: 15000 }
    };
    return new Response(JSON.stringify({ result: results[body.method], error: null, id: body.id }), { status: 200 });
  };
  t.after(() => { globalThis.fetch = originalFetch; restore(before); });
  const result = await getBitcoinNetworkStatus();
  assert.equal(result.localNode.status, 'NODE_CONNECTED');
  assert.equal(result.localNode.chain, 'main');
  assert.equal(result.localNode.connections, 8);
  assert.equal(result.localNode.mempoolTransactions, 120);
  assert.equal(result.localNode.permissions.walletRpc, false);
  assert.equal(result.localNode.permissions.signing, false);
});
