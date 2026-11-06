import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoots = ['github-pages-sync', 'public'];
const forbiddenNames = new Set(['.env', '.env.local', '.env.production', 'keypair.json', 'keypair.js', 'credentials.json', 'secrets.json', 'id_rsa', 'id_ed25519']);
const forbiddenExt = new Set(['.pem', '.p12', '.pfx', '.keystore', '.sqlite', '.db']);
const issues = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else {
      const base = entry.name.toLowerCase();
      if (forbiddenNames.has(base) || (base.startsWith('.env.') && !['.env.example'].includes(base)) || forbiddenExt.has(path.extname(base))) {
        issues.push(`${path.relative(root, full)}: archivo privado/no publicable`);
        continue;
      }
      if (/\.(?:html?|mjs|cjs|js|json|css|txt|md)$/i.test(base)) {
        const content = fs.readFileSync(full, 'utf8');
        if (/(?:BEGIN (?:OPENSSH|RSA|EC) PRIVATE KEY|xprv[a-zA-Z0-9]{30,}|(?:mnemonic|seedPhrase|privateKey)\s*[:=]\s*['"][^'"]{20,})/i.test(content)) {
          issues.push(`${path.relative(root, full)}: posible material secreto literal`);
        }
      }
    }
  }
}
for (const dir of publicRoots) walk(path.join(root, dir));
if (issues.length) {
  console.error('PUBLIC_BUNDLE_SECURITY_FAILED');
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('PUBLIC_BUNDLE_SECURITY_OK: sin archivos de credenciales ni patrones de secretos detectados.');
}
