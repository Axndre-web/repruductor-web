import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const mirrored = [
  'index.html', 'script.js', 'style.css', 'neon-ai.config.js', 'creator-gift.bridge.js',
  'manifest.webmanifest', 'sw.js', 'favicon-32.png', 'app-icon.jpg', 'icon-48.png',
  'icon-96.png', 'icon-180.png', 'icon-192.png', 'icon-512.png',
  'UI/styles-economy.css', 'UI/styles.css', 'UI/neon-orb-companion.css',
  'UI/wallet-dashboard.js', 'UI/real-work-dashboard.js', 'UI/neon-orb-command-deck.js',
  'UI/account-readiness.js', 'UI/neon-orb-companion.js', 'UI/arcade-slot-machine.js',
  'UI/autonomy-operations.css', 'UI/autonomy-operations.js',
  'core/unified-ledger.js', 'core/economic-engine.js', 'core/neon-orb-runtime.js', 'core/slot-engine.js'
];

test('browser source assets and served public assets remain synchronized', () => {
  for (const rel of mirrored) {
    const source = path.join(root, rel);
    const served = path.join(root, 'public', rel);
    assert.ok(fs.existsSync(source), `missing source asset ${rel}`);
    assert.ok(fs.existsSync(served), `missing served asset public/${rel}`);
    assert.deepEqual(fs.readFileSync(served), fs.readFileSync(source), `source/public drift: ${rel}`);
  }
});

test('all local script and stylesheet references in served HTML resolve', () => {
  const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)].map(m => m[1]);
  for (const ref of refs) {
    if (/^(?:https?:)?\/\//.test(ref) || ref.startsWith('data:')) continue;
    assert.ok(fs.existsSync(path.join(root, 'public', ref)), `unresolved local UI reference: ${ref}`);
  }
  assert.match(html, /UI\/styles\.css/);
  assert.match(html, /UI\/neon-orb-companion\.css/);
  assert.match(html, /mountAccountReadiness/);
});

test('service worker cache list includes the unified UI styles and companion modules', () => {
  const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8');
  for (const asset of ['./UI/styles.css', './UI/styles-economy.css', './UI/neon-orb-companion.css', './UI/neon-orb-companion.js', './UI/account-readiness.js', './UI/arcade-slot-machine.js', './UI/autonomy-operations.css', './UI/autonomy-operations.js']) {
    assert.ok(sw.includes(asset), `service worker cache missing ${asset}`);
  }
});
