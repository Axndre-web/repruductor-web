import test from 'node:test';
import assert from 'node:assert/strict';

const { startConfiguredMiner, minerSupervisorStatus } = await import('../server/miner-supervisor.js');

test('miner does not start without explicit local binary and validated args', async () => {
  const keys = ['ENABLE_REAL_MINING','NEON_MINING_AUTOSTART','NEON_MINER_EXECUTABLE','NEON_MINER_ARGS_JSON','NEON_MINING_WALLET_ADDRESS','NEON_MINING_POOL'];
  const before = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  try {
    for (const key of keys) delete process.env[key];
    const result = await startConfiguredMiner();
    assert.equal(result.running, false);
    assert.equal(result.status, 'BLOCKED_CONFIGURATION');
    assert.match(result.lastError, /MINER_EXECUTABLE_NOT_CONFIGURED/);
    assert.equal(result.permissions.signsTransactions, false);
    assert.equal(result.permissions.withdrawsFunds, false);
  } finally {
    for (const key of keys) {
      if (before[key] === undefined) delete process.env[key];
      else process.env[key] = before[key];
    }
  }
});

test('miner status does not expose wallet address or credential values', () => {
  const oldWallet = process.env.NEON_MINING_WALLET_ADDRESS;
  process.env.NEON_MINING_WALLET_ADDRESS = 'PUBLIC_WALLET_TEST_ADDRESS_123456';
  try {
    const status = minerSupervisorStatus();
    assert.equal(JSON.stringify(status).includes('PUBLIC_WALLET_TEST_ADDRESS_123456'), false);
    assert.equal(status.permissions.automaticSigning, undefined);
    assert.equal(status.permissions.signsTransactions, false);
  } finally {
    if (oldWallet === undefined) delete process.env.NEON_MINING_WALLET_ADDRESS;
    else process.env.NEON_MINING_WALLET_ADDRESS = oldWallet;
  }
});
