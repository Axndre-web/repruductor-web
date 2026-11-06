import test from 'node:test';
import assert from 'node:assert/strict';
import { autonomySnapshot, searchWeb, runStaticAudit } from '../server/autonomy/operations.js';

test('autonomy status reports bounded capabilities without secret values', () => {
  const status = autonomySnapshot();
  assert.equal(status.mode, 'BOUNDED_READ_ONLY_AUTONOMY');
  assert.equal(status.capabilities.arbitraryUrlFetch, false);
  assert.equal(status.capabilities.remoteCodeExecution, false);
  assert.equal(status.capabilities.automaticApplications, false);
  assert.equal(status.policy.redirects, 'DENIED');
  assert.equal(JSON.stringify(status).includes(process.env.BRAVE_SEARCH_API_KEY || '\u0000'), false);
});

test('web search validates short queries before network access', async () => {
  await assert.rejects(() => searchWeb(' '), /SEARCH_QUERY_TOO_SHORT/);
});

test('static audit completes and never reports environment files', async () => {
  const result = await runStaticAudit({ maxFiles: 500 });
  assert.equal(result.ok, true);
  assert.ok(result.filesScanned > 0);
  assert.ok(Array.isArray(result.findings));
  assert.ok(result.findings.every(f => !String(f.file).startsWith('.env')));
  assert.ok(result.limitations.length >= 3);
});
