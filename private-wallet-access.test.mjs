import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const server = await readFile(new URL('../server.js', import.meta.url), 'utf8');
const walletUI = await readFile(new URL('../UI/wallet-dashboard.js', import.meta.url), 'utf8');
const style = await readFile(new URL('../style.css', import.meta.url), 'utf8');

test('observed wallet endpoint requires local administrator bearer authorization', () => {
  assert.match(server, /app\.get\(['"]\/api\/neon-orb\/wallet\/observed['"],\s*adminRequired,\s*orbRateLimit/);
  assert.match(server, /const expected = process\.env\.NEON_ADMIN_TOKEN/);
});

test('server binds to loopback unless LAN access is explicitly enabled', () => {
  assert.match(server, /process\.env\.NEON_ALLOW_LAN_ACCESS === "true"[\s\S]{0,100}127\.0\.0\.1/);
});

test('wallet UI only asks for public account connections and does not persist admin token', () => {
  assert.match(walletUI, /provider\.connect\(\)/);
  assert.match(walletUI, /eth_requestAccounts/);
  assert.match(walletUI, /eth_getBalance/);
  assert.doesNotMatch(walletUI, /(?:localStorage|sessionStorage)\s*(?:\.|\[)|\bprivateKey\b|eth_sendTransaction/);
});

test('navigation has responsive lateral layout rules', () => {
  assert.match(style, /\.nav\{position:fixed;left:14px/);
  assert.match(style, /@media\(max-width:680px\)[\s\S]*?\.nav\{position:sticky/);
});

test('served wallet panel and stylesheet match the editable source files', async () => {
  const { readFile: read } = await import('node:fs/promises');
  const sourceHtml = await read(new URL('../index.html', import.meta.url), 'utf8');
  const servedHtml = await read(new URL('../public/index.html', import.meta.url), 'utf8');
  const sourceWallet = await read(new URL('../UI/wallet-dashboard.js', import.meta.url), 'utf8');
  const servedWallet = await read(new URL('../public/UI/wallet-dashboard.js', import.meta.url), 'utf8');
  const sourceCss = await read(new URL('../UI/wallet-private.css', import.meta.url), 'utf8');
  const servedCss = await read(new URL('../public/UI/wallet-private.css', import.meta.url), 'utf8');
  assert.equal(servedHtml, sourceHtml);
  assert.equal(servedWallet, sourceWallet);
  assert.equal(servedCss, sourceCss);
});
