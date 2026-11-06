import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MAX_FILES = 2500;
const MAX_FILE_BYTES = 512 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.sol']);
const EXCLUDED_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'coverage', '.venv', 'venv']);
const MAX_RESPONSE_BYTES = 1_000_000;
const REQUEST_TIMEOUT_MS = 8000;
const state = {
  startedAt: new Date().toISOString(),
  network: { status: 'idle', lastAt: null, lastError: null, provider: 'brave_search_api' },
  jobs: { status: 'idle', lastAt: null, count: 0, errors: [] },
  audit: { status: 'idle', lastAt: null, filesScanned: 0, findings: 0 }
};

export function autonomySnapshot() {
  return {
    ok: true,
    identity: 'NEON_ORB',
    mode: 'BOUNDED_READ_ONLY_AUTONOMY',
    startedAt: state.startedAt,
    capabilities: {
      webSearch: Boolean(process.env.BRAVE_SEARCH_API_KEY),
      jobDiscovery: true,
      localStaticAudit: true,
      arbitraryUrlFetch: false,
      remoteCodeExecution: false,
      automaticApplications: false,
      financialExecution: false
    },
    policy: {
      httpsOnly: true,
      fixedProviderEndpoints: true,
      redirects: 'DENIED',
      timeoutMs: REQUEST_TIMEOUT_MS,
      maxResponseBytes: MAX_RESPONSE_BYTES,
      auditExcludesSecretsAndDependencies: true
    },
    tasks: structuredClone(state)
  };
}

async function fetchBounded(url, { headers = {}, maxBytes = MAX_RESPONSE_BYTES } = {}) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('NETWORK_POLICY_DENIED');
  const allowedHosts = new Set(['api.search.brave.com']);
  if (!allowedHosts.has(parsed.hostname)) throw new Error('NETWORK_HOST_NOT_ALLOWLISTED');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(parsed, {
      method: 'GET', redirect: 'manual', signal: controller.signal,
      headers: { accept: 'application/json', 'user-agent': 'NEON-ORB/1.0 (bounded read-only)', ...headers }
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel().catch(() => {});
      throw new Error('NETWORK_REDIRECT_DENIED');
    }
    if (!response.ok) throw new Error(`NETWORK_HTTP_${response.status}`);
    const declared = Number(response.headers.get('content-length') || 0);
    if (declared > maxBytes) { await response.body?.cancel().catch(() => {}); throw new Error('NETWORK_RESPONSE_TOO_LARGE'); }
    if (!response.body) throw new Error('NETWORK_EMPTY_RESPONSE');
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { await reader.cancel().catch(() => {}); throw new Error('NETWORK_RESPONSE_TOO_LARGE'); }
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('NETWORK_TIMEOUT');
    throw error;
  } finally { clearTimeout(timer); }
}

export async function searchWeb(query, count = 8) {
  const cleanQuery = String(query ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 240);
  if (cleanQuery.length < 2) throw new Error('SEARCH_QUERY_TOO_SHORT');
  const apiKey = String(process.env.BRAVE_SEARCH_API_KEY || '').trim();
  if (!apiKey) throw new Error('BRAVE_SEARCH_API_KEY_NOT_CONFIGURED');
  state.network.status = 'running'; state.network.lastError = null;
  try {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', cleanQuery);
    url.searchParams.set('count', String(Math.max(1, Math.min(10, Number(count) || 8))));
    const data = await fetchBounded(url, { headers: { 'x-subscription-token': apiKey }, maxBytes: 700_000 });
    const results = (Array.isArray(data?.web?.results) ? data.web.results : []).slice(0, 10).map(item => {
      let resultUrl = '';
      try { const u = new URL(String(item.url || '')); if (u.protocol === 'https:') resultUrl = u.href; } catch {}
      return { title: safeText(item.title, 220), url: resultUrl, description: safeText(item.description, 500), source: safeText(item.profile?.long_name || new URL(resultUrl || 'https://invalid.local').hostname, 120) };
    }).filter(item => item.url);
    state.network = { status: 'ok', lastAt: new Date().toISOString(), lastError: null, provider: 'brave_search_api', resultCount: results.length };
    return { ok: true, query: cleanQuery, provider: 'brave_search_api', queriedAt: state.network.lastAt, count: results.length, results };
  } catch (error) {
    state.network = { status: 'error', lastAt: new Date().toISOString(), lastError: String(error?.message || 'SEARCH_FAILED').slice(0, 120), provider: 'brave_search_api' };
    throw error;
  }
}

function safeText(value, max) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

const RULES = [
  { id: 'DYNAMIC_CODE', severity: 'high', regex: /\beval\s*\(|new\s+Function\s*\(/g, message: 'Ejecución dinámica de código; revisar origen y necesidad.' },
  { id: 'COMMAND_EXECUTION', severity: 'high', regex: /\b(?:exec|execSync|spawn|spawnSync|execFile)\s*\(/g, message: 'Ejecución de comandos del sistema; comprobar validación y aislamiento.' },
  { id: 'INSECURE_TLS', severity: 'high', regex: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0/g, message: 'La validación TLS parece desactivada.' },
  { id: 'WEAK_HASH', severity: 'medium', regex: /createHash\s*\(\s*['"](?:md5|sha1)['"]\s*\)/gi, message: 'Hash criptográfico débil; evitar para integridad o seguridad.' },
  { id: 'UNSAFE_INNERHTML', severity: 'medium', regex: /\.innerHTML\s*=|insertAdjacentHTML\s*\(/g, message: 'Inserción HTML; revisar si el contenido externo está saneado.' },
  { id: 'DISABLED_TLS_VERIFY', severity: 'high', regex: /verify\s*[:=]\s*false/g, message: 'Posible desactivación de verificación TLS/certificados.' },
  { id: 'PRIVATE_KEY_LITERAL', severity: 'critical', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, message: 'Posible clave privada incrustada; eliminar del código y rotar si es real.' }
];

async function collectFiles(dir, out) {
  if (out.length >= MAX_FILES) return;
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (out.length >= MAX_FILES) break;
    if (entry.name.startsWith('.') && ['.env', '.git', '.vscode'].includes(entry.name)) continue;
    if (entry.isDirectory()) { if (!EXCLUDED_DIRS.has(entry.name)) await collectFiles(path.join(dir, entry.name), out); continue; }
    if (!entry.isFile() || !ALLOWED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (/(^|\/)(?:secrets?|credentials?|keypair)(?:\.|\/|$)/i.test(rel)) continue;
    out.push({ full, rel });
  }
}

export async function runStaticAudit({ maxFiles = MAX_FILES } = {}) {
  state.audit.status = 'running';
  const files = [];
  await collectFiles(ROOT, files);
  const bounded = files.slice(0, Math.max(1, Math.min(MAX_FILES, Number(maxFiles) || MAX_FILES)));
  const findings = [];
  for (const file of bounded) {
    let stat; try { stat = await fs.stat(file.full); } catch { continue; }
    if (stat.size > MAX_FILE_BYTES) continue;
    let source; try { source = await fs.readFile(file.full, 'utf8'); } catch { continue; }
    const lines = source.split(/\r?\n/);
    for (const rule of RULES) {
      rule.regex.lastIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        rule.regex.lastIndex = 0;
        if (rule.regex.test(lines[i])) findings.push({ rule: rule.id, severity: rule.severity, file: file.rel, line: i + 1, message: rule.message, confidence: 'review_required' });
        if (findings.length >= 1000) break;
      }
      if (findings.length >= 1000) break;
    }
    if (findings.length >= 1000) break;
  }
  const summary = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of findings) summary[finding.severity] = (summary[finding.severity] || 0) + 1;
  state.audit = { status: 'ok', lastAt: new Date().toISOString(), filesScanned: bounded.length, findings: findings.length, summary };
  return { ok: true, mode: 'LOCAL_STATIC_PATTERN_SCAN', completedAt: state.audit.lastAt, filesScanned: bounded.length, findingsCount: findings.length, summary, findings, limitations: ['No ejecuta código ni contratos.', 'Los patrones pueden producir falsos positivos y no detectan todas las vulnerabilidades.', 'No lee .env, dependencias instaladas ni archivos de credenciales.', 'No sustituye revisión manual, SAST especializado ni pruebas dinámicas autorizadas.'] };
}

export function recordJobTask(result) {
  state.jobs = { status: result?.ok ? 'ok' : 'error', lastAt: new Date().toISOString(), count: Number(result?.count || 0), errors: Array.isArray(result?.errors) ? result.errors.slice(0, 8) : [] };
  return autonomySnapshot();
}
