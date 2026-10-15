import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'neon-arcade-test-'));
process.env.NEON_ARCADE_DEMO_STORE = path.join(dir, 'arcade-demo.json');
const ledger = await import(`../server/arcade-demo-ledger.js?test=${Date.now()}`);

test('arcade ledger starts at 100 demo credits and persists independently', async () => {
  const id = 'test_device_123456789';
  const initial = await ledger.getArcadeState(id);
  assert.equal(initial.balance, 100);
  const event = { betAmount: 1, winAmount: 0, balance: 99, reels: ['🍒','🍊','🍋','🍇','⭐'] };
  const saved = await ledger.recordArcadeSpin(id, { balance: 99, event });
  assert.equal(saved.persisted, true);
  const reloaded = await ledger.getArcadeState(id);
  assert.equal(reloaded.balance, 99);
  assert.equal(reloaded.events.length, 1);
  assert.equal(reloaded.events[0].currency, 'DEMO_CREDITS');
});

test('arcade zero balance resets to courtesy credits on next load', async () => {
  const id = 'test_device_zero_123456';
  await ledger.getArcadeState(id);
  await ledger.saveArcadeSnapshot(id, 0);
  const reloaded = await ledger.getArcadeState(id);
  assert.equal(reloaded.balance, 100);
});

test('arcade ledger rejects invalid device ids and amounts', async () => {
  await assert.rejects(ledger.getArcadeState('../bad'), /deviceId/i);
  await assert.rejects(ledger.saveArcadeSnapshot('valid_device_123', -1), /saldo/i);
});
