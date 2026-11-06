import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const html = path.join(root, 'public', 'index.html');

test('root and /index.html explicitly serve the unified public interface', () => {
  assert.ok(fs.existsSync(html), 'public/index.html must exist');
  assert.match(server, /app\.get\(\["\/", "\/index\.html"\]/);
  assert.match(server, /res\.sendFile\(path\.join\(publicDir, "index\.html"\)/);
});

test('static assets resolve from the project directory and missing assets stay 404', () => {
  assert.match(server, /const publicDir = path\.join\(__dirname, "public"\)/);
  assert.match(server, /app\.use\(express\.static\(publicDir, \{/);
  assert.match(server, /if \(path\.extname\(req\.path\)\)/);
});

test('unknown API paths return JSON 404 instead of the SPA document', () => {
  assert.match(server, /app\.use\("\/api", \(_req, res\) => \{/);
  assert.match(server, /api_route_not_found/);
  assert.ok(server.indexOf('app.use("/api"') < server.indexOf('app.get("/{*splat}"'), 'API fallback must precede SPA fallback');
});
