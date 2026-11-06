import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const server = await fs.readFile(new URL('../server.js', import.meta.url), 'utf8');
const agent = await fs.readFile(new URL('../server/agent-runtime.js', import.meta.url), 'utf8');
const ui = await fs.readFile(new URL('../public/UI/neon-orb-companion.js', import.meta.url), 'utf8');

test('private agent chat uses loopback same-origin protection by default and admin token for LAN mode', () => {
  assert.match(server, /function privateAgentAccess\(req, res, next\)[\s\S]*NEON_ALLOW_LAN_ACCESS === 'true'[\s\S]*adminRequired[\s\S]*localSameOriginReadOnly/);
  assert.match(server, /app\.post\(\"\/api\/neon-orb\/agent\/chat\", privateAgentAccess, orbRateLimit/);
});

test('companion invokes tool-capable agent first and visibly marks native fallback', () => {
  assert.match(ui, /fetch\('\/api\/neon-orb\/agent\/chat'/);
  assert.match(ui, /Modo local básico: el modelo de agente no está conectado/);
  assert.match(server, /NATIVE_FALLBACK_MODEL_OFFLINE/);
});

test('agent is instructed to act before giving concise results and retains critical operation guards', () => {
  assert.match(agent, /Primero inspecciona\/actúa con las herramientas apropiadas/);
  assert.match(agent, /No firmes ni envíes transacciones/);
  assert.match(agent, /apply_project_file/);
  assert.match(agent, /run_project_tests/);
});
