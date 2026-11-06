import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('served page mounts unified control center and keeps operational dashboard in stable host', () => {
  const html = read('public/index.html');
  assert.match(html, /id="unifiedControlCenter"/);
  assert.match(html, /id="unifiedNetworkOpsHost"/);
  assert.match(html, /mountUnifiedControlCenter/);
  assert.match(html, /unifiedOpsHost\.append\(networkOpsRoot\)/);
  assert.match(html, /href="#slot-zone" class="nav-link"/);
});

test('holographic center polls only same-origin status endpoints and labels map schematic', () => {
  const js = read('public/UI/unified-control-center.js');
  assert.match(js, /\/api\/neon-orb\/control\/status/);
  assert.match(js, /\/api\/neon-orb\/network\/status/);
  assert.match(js, /\/api\/neon-orb\/operations\/status/);
  assert.match(js, /\/healthz/);
  assert.match(js, /setInterval\(refresh,5000\)/);
  assert.match(js, /no son coordenadas geográficas|no geolocalización real/i);
});

test('unified UI assets have matching source and served copies with responsive and reduced-motion rules', () => {
  assert.equal(read('UI/unified-control-center.js'), read('public/UI/unified-control-center.js'));
  assert.equal(read('UI/unified-control-center.css'), read('public/UI/unified-control-center.css'));
  const css = read('public/UI/unified-control-center.css');
  assert.match(css, /@media\(max-width:900px\)/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
