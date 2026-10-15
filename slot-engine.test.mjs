import test from 'node:test';
import assert from 'node:assert/strict';
import { SlotEngine } from '../core/slot-engine.js';

test('slot engine uses virtual credits and returns a bounded five-reel result', async () => {
  const engine = new SlotEngine(() => 0);
  const result = await engine.processSpin(2, 10);
  assert.equal(result.success, true);
  assert.equal(result.currency, 'DEMO_CREDITS');
  assert.equal(result.reels.length, 5);
  assert.equal(result.betAmount, 2);
  assert.equal(result.newBalance, 32); // five identical symbols: 12x payout, net +22
});

test('slot engine refuses invalid bets and insufficient demo balance', async () => {
  const engine = new SlotEngine(() => 0.2);
  await assert.rejects(engine.processSpin(0, 10), /insuficiente/i);
  await assert.rejects(engine.processSpin(3, 2), /insuficiente/i);
  await assert.rejects(engine.processSpin(Number.NaN, 10), /insuficiente/i);
});
