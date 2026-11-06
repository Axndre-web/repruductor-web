import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPublicAllowedUrl } from '../server/network-sandbox.js';
import { runStaticSecurityAudit } from '../server/security-audit.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('network sandbox rejects HTTP, credentials, custom ports and unapproved hosts', async () => {
  for (const url of [
    'http://api.duckduckgo.com/?q=test',
    'https://user:pass@api.duckduckgo.com/',
    'https://api.duckduckgo.com:8443/',
    'https://127.0.0.1/',
    'https://example.com/'
  ]) await assert.rejects(() => assertPublicAllowedUrl(url), /NETWORK_/);
});

test('static audit detects common patterns without scanning .env or keypair files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'neon-audit-'));
  try {
    await fs.writeFile(path.join(root, 'bad.js'), "const x = eval(input);\nelement.innerHTML = data;\n");
    await fs.writeFile(path.join(root, '.env'), 'PRIVATE_KEY="super-secret-value-should-not-be-read"\n');
    await fs.writeFile(path.join(root, 'keypair.json'), '{"privateKey":"never scan"}');
    const result = await runStaticSecurityAudit(root);
    assert.equal(result.ok, true);
    assert.equal(result.scannedFiles, 1);
    assert.ok(result.findings.some(f => f.ruleId === 'JS_EVAL'));
    assert.ok(result.findings.some(f => f.ruleId === 'UNSAFE_INNERHTML'));
    assert.ok(!JSON.stringify(result).includes('super-secret-value'));
  } finally { await fs.rm(root, { recursive:true, force:true }); }
});

test('network allowlist is finite and contains only approved service hosts', async () => {
  const { networkAllowlist } = await import('../server/network-sandbox.js');
  const hosts = networkAllowlist();
  assert.deepEqual(hosts, [...hosts].sort());
  assert.ok(hosts.includes('api.duckduckgo.com'));
  assert.ok(hosts.includes('remotive.com'));
  assert.ok(!hosts.includes('localhost'));
});

test('network sandbox rejects URL schemes other than HTTPS before any request', async () => {
  for (const url of ['file:///etc/passwd','ftp://api.duckduckgo.com/','javascript:alert(1)']) {
    await assert.rejects(() => assertPublicAllowedUrl(url), /NETWORK_|Invalid URL/);
  }
});

test('public search rejects empty queries without making a network request', async () => {
  const { searchPublicWeb } = await import('../server/network-operations.js');
  await assert.rejects(() => searchPublicWeb('  '), /SEARCH_QUERY_TOO_SHORT/);
});

test('static audit recognizes common Solidity authorization and randomness patterns', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'neon-sol-audit-'));
  try {
    await fs.writeFile(path.join(root, 'Vault.sol'), 'function withdraw() public { require(tx.origin == owner); }\n');
    await fs.writeFile(path.join(root, 'random.js'), 'const r = Math.random();\n');
    const result = await runStaticSecurityAudit(root);
    assert.ok(result.findings.some(f => f.ruleId === 'SOLIDITY_TX_ORIGIN'));
    assert.ok(result.findings.some(f => f.ruleId === 'WEAK_RANDOM'));
  } finally { await fs.rm(root, { recursive:true, force:true }); }
});

test('static audit skips dependency directories and does not traverse their source files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'neon-skip-audit-'));
  try {
    await fs.mkdir(path.join(root, 'node_modules'), { recursive:true });
    await fs.writeFile(path.join(root, 'node_modules', 'dependency.js'), 'eval(userInput);');
    await fs.writeFile(path.join(root, 'app.js'), 'export const safe = true;');
    const result = await runStaticSecurityAudit(root);
    assert.equal(result.scannedFiles, 1);
    assert.equal(result.findingsCount, 0);
  } finally { await fs.rm(root, { recursive:true, force:true }); }
});

test('GitHub repository search rejects empty queries without network access', async () => {
  const { searchGitHubSolutions } = await import('../server/network-operations.js');
  await assert.rejects(() => searchGitHubSolutions(' '), /GITHUB_QUERY_TOO_SHORT/);
});
