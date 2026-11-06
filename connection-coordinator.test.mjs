import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'neon-connections-'));
process.env.NEON_CONNECTION_STATE_FILE = path.join(dir, 'connections.json');
const { connectionCoordinator } = await import('../server/connection-coordinator.js');

test('connection coordinator requests missing permissions without exposing secrets', async () => {
  const snapshot = await connectionCoordinator.sync();
  assert.equal(snapshot.ok, true);
  assert.ok(snapshot.requests.some(r => r.providerId === 'solana-wallet' && r.status === 'PENDING'));
  assert.equal(snapshot.policy.secretsExposed, false);
  assert.equal(snapshot.policy.automaticFinancialSigning, false);
  assert.ok(!JSON.stringify(snapshot).includes(process.env.JWT_SECRET || '__never_secret__'));
});

test('local approval is not reported as provider authentication', async () => {
  const snapshot = connectionCoordinator.snapshot();
  const pending = snapshot.requests.find(r => r.status === 'PENDING');
  assert.ok(pending);
  const result = await connectionCoordinator.decide(pending.id, 'approve', 'test');
  assert.equal(result.status, 'APPROVED_LOCAL');
  assert.equal(result.providerVerified, false);
  assert.match(result.note, /wallet|proveedor/i);
  await assert.rejects(() => connectionCoordinator.decide(pending.id, 'approve', 'test'), /request_not_pending/);
});

test.after(async () => { await fs.rm(dir, { recursive: true, force: true }); });
