/** Central, read-only inventory and guarded maintenance for NEON ORB.
 * It observes existing subsystems; it does not replace their authority or invent health.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { connectionCoordinator } from './connection-coordinator.js';
import { neonOrbRuntime } from '../core/neon-orb-runtime.js';
import { neonOrbDaemon } from '../core/neon-orb-daemon.js';
import { autonomySupervisorStatus } from './autonomy-supervisor.js';
import { minerSupervisorStatus } from './miner-supervisor.js';
import { getNetworkOperationsStatus } from './network-operations.js';
import { getRadioControlState } from './radio-control.js';
import { calculateEconomicAccounting } from './economic-accounting.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BACKUP_ROOT = path.join(ROOT, 'data', 'orb-backups');
const EXCLUDED = new Set(['.env', '.env.example', '.env.exampl', 'keypair.json', 'keypair.js']);
const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'orb-backups', '__pycache__']);
const MODULES = [
  ['orb-runtime','Runtime NEON ORB','core/neon-orb-runtime.js','CORE'],
  ['orb-daemon','Daemon residente','core/neon-orb-daemon.js','CORE'],
  ['agent-runtime','Agente técnico','server/agent-runtime.js','AGENT'],
  ['connection-coordinator','Coordinador de conexiones','server/connection-coordinator.js','NETWORK'],
  ['autonomy-supervisor','Supervisor de autonomía','server/autonomy-supervisor.js','CORE'],
  ['economic-engine','Motor económico','core/economic-engine.js','ECONOMY'],
  ['unified-ledger','Ledger unificado','core/unified-ledger.js','ECONOMY'],
  ['economic-accounting','Contabilidad económica','server/economic-accounting.js','ECONOMY'],
  ['external-execution','Ejecución externa verificada','server/external-execution.js','ECONOMY'],
  ['wallet-observer','Observador de wallets','server/wallet-observer.js','WEB3'],
  ['bitcoin-network','Red Bitcoin','server/bitcoin-network.js','WEB3'],
  ['multichain-wallet','Wallet multichain','server/multichain-wallet.js','WEB3'],
  ['network-operations','Operaciones de red','server/network-operations.js','NETWORK'],
  ['radio-control','Control de radio','server/radio-control.js','MEDIA'],
  ['slot-engine','Motor arcade','core/slot-engine.js','ARCADE'],
  ['ui-control-center','Centro de control UI','UI/unified-control-center.js','UI'],
  ['ui-command-deck','Command Deck UI','UI/neon-orb-command-deck.js','UI'],
  ['provider-security','Seguridad de proveedores','server/provider-security.js','SECURITY'],
  ['secret-manager','Gestión de secretos','server/secrets.js','SECURITY'],
  ['security-audit','Auditoría de seguridad','server/security-audit.js','SECURITY'],
  ['wallet-vault','Bóveda de wallets','server/wallet-vault.js','WEB3'],
  ['market-telemetry','Telemetría de mercado','server/market-mining-telemetry.js','ECONOMY'],
  ['opportunity-engine','Motor de oportunidades','server/opportunity-engine.js','ECONOMY'],
  ['settlement-verifier','Verificador de liquidaciones','server/settlement-verifier.js','ECONOMY']
];

// These are intentionally mirrored deployment assets. Compare content hashes; never copy
// runtime secrets or private state into a public deployment directory.
const MIRRORS = [
  ['index.html','public/index.html','github-pages-sync/index.html'],
  ['script.js','public/script.js','github-pages-sync/script.js'],
  ['style.css','public/style.css','github-pages-sync/style.css'],
  ['neon-ai.config.js','public/neon-ai.config.js','github-pages-sync/neon-ai.config.js'],
  ['UI/unified-control-center.js','public/UI/unified-control-center.js','github-pages-sync/UI/unified-control-center.js'],
  ['UI/unified-control-center.css','public/UI/unified-control-center.css','github-pages-sync/UI/unified-control-center.css']
];

async function sha256File(file) {
  try { return createHash('sha256').update(await fs.readFile(path.join(ROOT, file))).digest('hex'); }
  catch { return null; }
}
async function getMirrorDiagnostics() {
  return Promise.all(MIRRORS.map(async paths => {
    const hashes = await Promise.all(paths.map(sha256File));
    const present = hashes.filter(Boolean).length;
    const synchronized = present === paths.length && new Set(hashes).size === 1;
    return { asset: paths[0], copies: paths.map((file, i) => ({ file, present: Boolean(hashes[i]), sha256: hashes[i] })), status: synchronized ? 'SYNCHRONIZED' : present < paths.length ? 'MISSING_COPY' : 'DIVERGED' };
  }));
}
const safeClone = value => JSON.parse(JSON.stringify(value));

async function walk(dir, base = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const rel = path.posix.join(base, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name) && !entry.name.startsWith('.')) out.push(...await walk(path.join(dir, entry.name), rel));
    } else if (entry.isFile() && !EXCLUDED.has(entry.name) && !entry.name.startsWith('.env') && !/\.pem$|\.key$|\.p12$|\.pfx$/i.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

export async function getEcosystemSnapshot() {
  await neonOrbRuntime.ready;
  const [connections, modules] = await Promise.all([
    connectionCoordinator.ready(),
    Promise.all(MODULES.map(async ([id, name, file, domain]) => {
      try { const stat = await fs.stat(path.join(ROOT, file)); return { id, name, domain, status: stat.isFile() ? 'AVAILABLE' : 'MISSING', path: file, sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString() }; }
      catch { return { id, name, domain, status: 'MISSING', path: file }; }
    }))
  ]);
  const runtime = neonOrbRuntime.snapshot();
  const mirrors = await getMirrorDiagnostics();
  const autonomy = autonomySupervisorStatus();
  const providers = connections.providers.map(p => ({ id: p.id, name: p.name, configured: p.configured, status: p.configured ? 'CONFIGURED_UNVERIFIED' : 'NOT_CONFIGURED', capability: p.capability, risk: p.risk }));
  const warnings = [];
  if (modules.some(m => m.status === 'MISSING')) warnings.push('MODULE_FILES_MISSING');
  if (providers.some(p => p.status === 'NOT_CONFIGURED')) warnings.push('EXTERNAL_PROVIDERS_REQUIRE_CONFIGURATION');
  if (providers.some(p => p.status === 'CONFIGURED_UNVERIFIED')) warnings.push('PROVIDER_HANDSHAKES_NOT_VERIFIED');
  if (runtime.inference?.mode !== 'MODEL_CAPABILITY') warnings.push('LOCAL_INFERENCE_FALLBACK_ACTIVE');
  if (mirrors.some(m => m.status !== 'SYNCHRONIZED')) warnings.push('DEPLOYMENT_COPIES_DIVERGED');
  return {
    ok: true, identity: 'NEON_ORB', ecosystem: 'NEON_PLAYER_X', coordinator: 'CENTRAL', generatedAt: new Date().toISOString(),
    overall: warnings.some(w => w === 'MODULE_FILES_MISSING') ? 'DEGRADED' : warnings.length ? 'OPERATIONAL_WITH_WARNINGS' : 'OPERATIONAL',
    runtime, modules, connections: providers,
    subsystems: {
      daemon: neonOrbDaemon.snapshot(), autonomy: { active: autonomy.active, lastTickAt: autonomy.lastTickAt, tickCount: autonomy.tickCount, lastError: autonomy.lastError },
      miner: minerSupervisorStatus(), network: getNetworkOperationsStatus(), radio: getRadioControlState(), economy: calculateEconomicAccounting()
    },
    synchronization: { status: mirrors.every(m => m.status === 'SYNCHRONIZED') ? 'SYNCHRONIZED' : 'REVIEW_REQUIRED', mirrors },
    diagnostics: { warnings, moduleCount: modules.length, availableModules: modules.filter(m => m.status === 'AVAILABLE').length, configuredProviders: providers.filter(p => p.configured).length, verifiedProviders: 0,
      policy: 'Configuration is not connectivity. A provider is ONLINE only after a real provider handshake; this inventory does not promote configured credentials to verified connections.' }
  };
}

export async function createEcosystemBackup() {
  const id = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
  const dir = path.join(BACKUP_ROOT, id);
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const files = await walk(ROOT);
  const copied = [];
  for (const rel of files) {
    if (rel.startsWith('data/orb-backups/')) continue;
    const source = path.join(ROOT, rel);
    const target = path.join(dir, rel);
    await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await fs.copyFile(source, target);
    copied.push(rel);
  }
  const manifest = { id, createdAt: new Date().toISOString(), fileCount: copied.length, files: copied, exclusions: [...EXCLUDED, ...EXCLUDED_DIRS], purpose: 'NEON ORB pre-change recovery snapshot' };
  await fs.writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2), { mode: 0o600 });
  return { ok: true, id, createdAt: manifest.createdAt, fileCount: copied.length, includesSecrets: false };
}

export async function listEcosystemBackups() {
  await fs.mkdir(BACKUP_ROOT, { recursive: true, mode: 0o700 });
  const entries = await fs.readdir(BACKUP_ROOT, { withFileTypes: true });
  const backups = [];
  for (const entry of entries.filter(e => e.isDirectory()).slice(-30).reverse()) {
    try { const m = JSON.parse(await fs.readFile(path.join(BACKUP_ROOT, entry.name, 'manifest.json'), 'utf8')); backups.push({ id: m.id, createdAt: m.createdAt, fileCount: m.fileCount }); } catch {}
  }
  return backups;
}

export async function rollbackEcosystemFiles({ backupId, paths } = {}) {
  if (!/^[0-9T-Z-]+-[a-f0-9]{8}$/.test(String(backupId || ''))) throw new Error('INVALID_BACKUP_ID');
  if (!Array.isArray(paths) || !paths.length || paths.length > 30) throw new Error('ROLLBACK_PATHS_REQUIRED');
  const dir = path.join(BACKUP_ROOT, backupId);
  const manifest = JSON.parse(await fs.readFile(path.join(dir, 'manifest.json'), 'utf8'));
  const allowed = new Set(manifest.files);
  const selected = [...new Set(paths.map(p => String(p).replaceAll('\\', '/')))];
  for (const rel of selected) {
    if (path.posix.isAbsolute(rel) || rel.split('/').includes('..') || EXCLUDED.has(path.posix.basename(rel)) || !allowed.has(rel)) throw new Error('ROLLBACK_PATH_NOT_ALLOWED');
  }
  const recovery = await createEcosystemBackup();
  for (const rel of selected) {
    const source = path.join(dir, rel);
    const target = path.join(ROOT, rel);
    const temp = `${target}.orb-rollback-${randomUUID()}.tmp`;
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(source, temp);
    await fs.rename(temp, target);
  }
  return { ok: true, restored: selected, recoveryBackupId: recovery.id, sourceBackupId: backupId };
}
