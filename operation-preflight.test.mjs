import test from 'node:test';
import assert from 'node:assert/strict';
import { operationPolicy, preflightEvmTransaction } from '../server/operation-preflight.js';

test('operation policy is read-only by default and never claims to sign or broadcast', () => {
  const old = process.env.NEON_CHAIN_WRITES_ENABLED;
  delete process.env.NEON_CHAIN_WRITES_ENABLED;
  const policy = operationPolicy();
  assert.equal(policy.mode, 'READ_ONLY');
  assert.equal(policy.actualSigning, false);
  assert.equal(policy.actualBroadcast, false);
  if (old !== undefined) process.env.NEON_CHAIN_WRITES_ENABLED = old;
});

test('preflight rejects malformed addresses before RPC access', async () => {
  await assert.rejects(() => preflightEvmTransaction({ from: 'bad', to: 'bad' }), /INVALID_EVM_ADDRESS/);
});

test('preflight rejects malformed calldata before RPC access', async () => {
  await assert.rejects(() => preflightEvmTransaction({
    from: '0x1111111111111111111111111111111111111111',
    to: '0x2222222222222222222222222222222222222222',
    data: '0xabc'
  }), /INVALID_CALLDATA/);
});

test('preflight rejects non-decimal wei values before RPC access', async () => {
  await assert.rejects(() => preflightEvmTransaction({
    from: '0x1111111111111111111111111111111111111111',
    to: '0x2222222222222222222222222222222222222222',
    valueWei: '-1'
  }), /INVALID_VALUE_WEI/);
});
