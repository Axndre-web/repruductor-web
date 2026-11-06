import test from 'node:test';
import assert from 'node:assert/strict';
import { agentMaintenanceStatus, startAgentMaintenance, stopAgentMaintenance } from '../server/agent-maintenance.js';

test('technical maintenance exposes bounded autonomy and never exposes secret values', () => {
  const status = agentMaintenanceStatus();
  assert.equal(status.policy.maxSourceChangesPerCycle, 1);
  assert.equal(status.policy.backupBeforeWrite, true);
  assert.equal(status.policy.fullFixedTestSuiteBeforeCommit, true);
  assert.equal(status.policy.automaticRollbackOnFailure, true);
  assert.equal(status.policy.privateCredentialsReadableByModel, false);
  assert.equal(status.policy.arbitraryShell, false);
  assert.equal(status.policy.transactionSigningOrBroadcasting, false);
  assert.equal(status.policy.moneyMovement, false);
  assert.equal(JSON.stringify(status).includes(process.env.NEON_ADMIN_TOKEN || '\u0000'), false);
});

test('maintenance supervisor can start and stop without changing the public interface', () => {
  const started = startAgentMaintenance();
  assert.equal(started.active, true);
  const stopped = stopAgentMaintenance();
  assert.equal(stopped.active, false);
  assert.equal(stopped.nextRunAt, null);
});
