import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('served UI has all local module dependencies available', () => {
  const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  for (const id of ['neonOrbCommandDeck', 'walletDashboard', 'realWorkDashboard']) assert.match(html, new RegExp(`id="${id}"`));
  for (const asset of ['public/UI/neon-orb-command-deck.js', 'public/UI/wallet-dashboard.js', 'public/UI/real-work-dashboard.js', 'public/UI/styles-economy.css', 'public/core/unified-ledger.js', 'public/core/economic-engine.js']) {
    assert.ok(fs.existsSync(path.join(root, asset)), `missing browser asset ${asset}`);
  }
  assert.match(html, /mountNeonOrbCommandDeck/);
});

test('command deck reports unverified mining as unavailable, never as fabricated output', () => {
  const js = fs.readFileSync(path.join(root, 'public/UI/neon-orb-command-deck.js'), 'utf8');
  assert.match(js, /NO VERIFICADO/);
  assert.match(js, /POOL NO CONFIGURADO/);
  assert.match(js, /acceptedShares/);
  assert.match(js, /mining\/status/);
  assert.match(js, /work-opportunities/);
});

test('command deck exposes live pool and real Solana route quote without executing swaps', () => {
  const js = fs.readFileSync(path.join(root, 'public/UI/neon-orb-command-deck.js'), 'utf8');
  assert.match(js, /orbSwapQuoteButton/);
  assert.match(js, /solana\/swap-quote/);
  assert.match(js, /no firma ni transmite/i);
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(server, /api\/neon-orb\/solana\/swap-quote/);
  assert.match(server, /api\/neon-orb\/mining\/status/);
});
