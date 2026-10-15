import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'neon-orb-runtime-'));
process.env.NEON_ORB_STATE_FILE = path.join(dir, 'runtime.json');
process.env.NEON_LLM_API_KEY = '';
const { neonOrbRuntime } = await import('../core/neon-orb-runtime.js');

test('Neon Orb runtime is the resident identity and persists cognitive turns', async () => {
  await neonOrbRuntime.ready;
  assert.equal(neonOrbRuntime.snapshot().identity, 'NEON_ORB');
  assert.equal(neonOrbRuntime.snapshot().runtime, 'NATIVE');
  const result = await neonOrbRuntime.think({
    message: 'Comprueba el estado antes de actuar',
    context: { energy: 60, state: 'ACTIVE' },
    event: { type: 'TEST_EVENT' },
    session: 'test-session'
  });
  assert.equal(result.identity, 'NEON_ORB');
  assert.equal(result.runtime, 'NATIVE');
  assert.ok(result.advice.length > 0);
  const saved = JSON.parse(await fs.readFile(process.env.NEON_ORB_STATE_FILE, 'utf8'));
  assert.equal(saved.memory.length, 1);
  assert.equal(saved.memory[0].type, 'TEST_EVENT');
  await fs.rm(dir, { recursive: true, force: true });
});
