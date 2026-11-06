import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
test('Neon Orb companion is wired into the served page and uses same-origin runtime APIs', () => {
  const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'public/UI/neon-orb-companion.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'public/UI/neon-orb-companion.css'), 'utf8');
  assert.match(html, /UI\/neon-orb-companion\.css/);
  assert.match(html, /mountNeonOrbCompanion/);
  assert.match(js, /\/api\/neon-orb\/status/);
  assert.match(js, /\/api\/neon-orb\/think/);
  assert.match(js, /textContent\s*=/);
  assert.match(js, /maxlength|maxlength/i);
  assert.match(css, /orb-panel/);
});
test('admin endpoints fail closed when the admin token is missing or too short', () => {
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(server, /Fail closed in every environment/);
  assert.match(server, /expected\.length < 24/);
  assert.match(server, /admin_token_not_configured/);
});

test('Neon Orb chat has bounded requests, readable error messages and optional Spanish speech', () => {
  const js = fs.readFileSync(path.join(root, 'public/UI/neon-orb-companion.js'), 'utf8');
  assert.match(js, /AbortSignal\.timeout\(50000\)/);
  assert.match(js, /cognition_unavailable/);
  assert.match(js, /speechSynthesis/);
  assert.match(js, /utterance\.lang = 'es-ES'/);
  assert.match(js, /window\.SpeechRecognition \|\| window\.webkitSpeechRecognition/);
  assert.match(js, /recognition\.start\(\)/);
  assert.match(js, /sessionStorage/);
  assert.match(js, /localStorage\.setItem\('neonOrbVoice'/);
  assert.equal(fs.readFileSync(path.join(root, 'UI/neon-orb-companion.js'), 'utf8'), js);
  assert.equal(fs.readFileSync(path.join(root, 'UI/neon-orb-companion.css'), 'utf8'), fs.readFileSync(path.join(root, 'public/UI/neon-orb-companion.css'), 'utf8'));
});

test('Neon Orb runtime exposes the primary think API and a compatibility chat alias', () => {
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'public/UI/neon-orb-companion.js'), 'utf8');
  assert.match(server, /app\.post\('\/api\/neon-orb\/think', orbRateLimit, handleNeonOrbThink\)/);
  assert.match(server, /app\.post\('\/api\/neon-orb\/chat', orbRateLimit, handleNeonOrbThink\)/);
  assert.match(server, /res\.json\(\{ ok: true, \.\.\.result \}\)/);
  assert.match(js, /if \(response\.status === 404\) response = await fetch\('\/api\/neon-orb\/chat'/);
  assert.match(js, /API_RUNTIME_NOT_FOUND/);
  assert.equal(fs.readFileSync(path.join(root, 'UI/neon-orb-companion.js'), 'utf8'), js);
});
