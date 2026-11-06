import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const server = await readFile(new URL('../server.js', import.meta.url), 'utf8');
const ui = await readFile(new URL('../UI/wallet-dashboard.js', import.meta.url), 'utf8');
const autostart = await readFile(new URL('../scripts/autostart.mjs', import.meta.url), 'utf8');
const observer = await readFile(new URL('../server/wallet-observer.js', import.meta.url), 'utf8');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('automatic wallet endpoint remains read-only and loopback/same-origin restricted', () => {
  assert.match(server, /function localSameOriginReadOnly\(req, res, next\)/);
  assert.match(server, /app\.get\(['"]\/api\/neon-orb\/wallet\/observed\/local['"], localSameOriginReadOnly, orbRateLimit/);
  assert.match(server, /local_same_origin_required/);
  assert.match(server, /snapshotWalletObservation\(\)/);
});

test('wallet panel refreshes automatically and restores previously trusted providers silently', () => {
  assert.match(ui, /void refreshConfigured\(\)/);
  assert.match(ui, /setInterval\(async \(\) =>/);
  assert.match(ui, /connect\(\{ onlyIfTrusted: true \}\)/);
  assert.match(ui, /method: silent \? 'eth_accounts' : 'eth_requestAccounts'/);
  assert.doesNotMatch(ui, /localStorage|sessionStorage|privateKey|eth_sendTransaction/);
});

test('user-level autostart can be installed and removed without copying .env secrets', () => {
  assert.equal(pkg.scripts['autostart:install'], 'node scripts/autostart.mjs install');
  assert.equal(pkg.scripts['autostart:uninstall'], 'node scripts/autostart.mjs uninstall');
  assert.match(autostart, /systemd/);
  assert.match(autostart, /LaunchAgents/);
  assert.match(autostart, /Microsoft.*Start Menu.*Programs.*Startup/);
  assert.doesNotMatch(autostart, /NEON_ADMIN_TOKEN|PRIVATE_KEY|SEED_PHRASE/);
});

test('resident wallet observer starts with the server and uses a bounded refresh interval', () => {
  assert.match(server, /startWalletObserver\(\)/);
  assert.match(server, /stopWalletObserver\(\)/);
  assert.match(observer, /setInterval\(\(\) => \{ void refreshWalletObservation\(\); \}, intervalMs\(\)\)/);
  assert.match(observer, /Math\.min\(300_000, Math\.max\(15_000/);
});
