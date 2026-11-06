import test from 'node:test';
import assert from 'node:assert/strict';
import { getEcosystemSnapshot, createEcosystemBackup, listEcosystemBackups, rollbackEcosystemFiles } from '../server/eco-coordinator.js';

test('central ecosystem snapshot inventories modules and never equates configuration with verified connectivity', async () => {
  const s = await getEcosystemSnapshot();
  assert.equal(s.identity, 'NEON_ORB');
  assert.equal(s.ecosystem, 'NEON_PLAYER_X');
  assert.ok(s.modules.length >= 15);
  assert.ok(s.modules.every(m => ['AVAILABLE','MISSING'].includes(m.status)));
  assert.ok(s.connections.every(p => ['NOT_CONFIGURED','CONFIGURED_UNVERIFIED'].includes(p.status)));
  assert.equal(s.diagnostics.verifiedProviders, 0);
});

test('backup excludes secret-bearing environment and keypair files', async () => {
  const b = await createEcosystemBackup();
  assert.equal(b.ok, true);
  assert.equal(b.includesSecrets, false);
  assert.ok(b.fileCount > 20);
  const list = await listEcosystemBackups();
  assert.ok(list.some(x => x.id === b.id));
});

test('rollback rejects traversal and requires explicit allowlisted paths', async () => {
  const b = await createEcosystemBackup();
  await assert.rejects(rollbackEcosystemFiles({ backupId:b.id, paths:['../../.env'] }), /ROLLBACK_PATH_NOT_ALLOWED/);
});
