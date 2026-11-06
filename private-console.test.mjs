import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
test('private NEON ORB console is outside public assets and has no public navigation link', () => {
  const page = fs.readFileSync(path.join(root, 'private/neon-orb-console.html'), 'utf8');
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  const index = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  assert.match(server, /app\.get\('\/orb-private',\s*localSameOriginReadOnly/);
  assert.match(server, /path\.join\(__dirname, 'private', 'neon-orb-console\.html'\)/);
  assert.match(page, /noindex,nofollow,noarchive/);
  assert.match(page, /credentials\s*:\s*'same-origin'/);
  assert.doesNotMatch(index, /orb-private/);
  assert.doesNotMatch(page, /NEON_ADMIN_TOKEN|PRIVATE_KEY|MNEMONIC|SEED_PHRASE/);
});
