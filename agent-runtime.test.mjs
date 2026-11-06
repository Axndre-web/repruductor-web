import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getAgentStatus, resolveAgentProviderConfig, runNeonAgent, saveAgentProposal, isAutonomousWritablePath } from '../server/agent-runtime.js';

test('agent status exposes capabilities and safety restrictions without provider secrets', () => {
  const status = getAgentStatus({ NEON_AGENT_BASE_URL:'http://127.0.0.1:11434/v1/chat/completions', NEON_AGENT_MODEL:'coder-local', NEON_AGENT_API_KEY:'super-secret-key' });
  assert.equal(status.ok, true);
  assert.equal(status.configured, true);
  assert.equal(status.apiKeyConfigured, true);
  assert.ok(status.restrictions.includes('no arbitrary shell'));
  assert.ok(!JSON.stringify(status).includes('super-secret-key'));
});

test('agent accepts local loopback HTTP only for model inference', async () => {
  const config = await resolveAgentProviderConfig({ NEON_AGENT_BASE_URL:'http://127.0.0.1:11434/v1/chat/completions', NEON_AGENT_MODEL:'coder-local' });
  assert.equal(config.local, true);
  assert.equal(config.configured, true);
  await assert.rejects(() => resolveAgentProviderConfig({ NEON_AGENT_BASE_URL:'http://example.com/v1/chat/completions' }), /HTTPS_OR_LOOPBACK/);
});

test('remote model provider requires HTTPS, exact hostname allowlist and API key', () => {
  const status = getAgentStatus({ NEON_AGENT_BASE_URL:'https://model.example.com/v1/chat/completions', NEON_AGENT_ALLOWED_HOSTS:'other.example.com', NEON_AGENT_API_KEY:'key' });
  assert.equal(status.configured, false);
  assert.equal(status.provider, 'not-allowlisted');
});

test('agent rejects empty prompts before making any model request', async () => {
  await assert.rejects(() => runNeonAgent({ message:'  ' }), /AGENT_MESSAGE_TOO_SHORT/);
});


test('agent saves only a new sanitized proposal file inside the isolated proposal directory', async () => {
  const result = await saveAgentProposal({ title:'../../test proposal', format:'md', content:'# Reviewable proposal\n' });
  try {
    assert.equal(result.ok, true);
    assert.match(result.path, /^agent-workspace\/proposals\/[a-z0-9TZ-]+-test-proposal-[a-f0-9]{6}\.md$/);
    const saved = await fs.readFile(path.resolve(result.path),'utf8');
    assert.equal(saved,'# Reviewable proposal\n');
    assert.equal(result.note.includes('no se ha aplicado'), true);
  } finally {
    await fs.rm(path.resolve(result.path),{force:true});
    await fs.rmdir(path.dirname(path.resolve(result.path))).catch(()=>{});
    await fs.rmdir(path.dirname(path.dirname(path.resolve(result.path)))).catch(()=>{});
  }
});

test('autonomous edits allow only source paths and block secrets/config/dependencies', () => {
  assert.equal(isAutonomousWritablePath('server/network-operations.js'), true);
  assert.equal(isAutonomousWritablePath('public/UI/network-operations-dashboard.js'), true);
  assert.equal(isAutonomousWritablePath('server.js'), true);
  assert.equal(isAutonomousWritablePath('.env'), false);
  assert.equal(isAutonomousWritablePath('package.json'), false);
  assert.equal(isAutonomousWritablePath('node_modules/express/index.js'), false);
  assert.equal(isAutonomousWritablePath('../outside.js'), false);
  assert.equal(isAutonomousWritablePath('server/../.env'), false);
});
