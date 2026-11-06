/**
 * Opt-in local miner process supervisor.
 * No shell is used; only a named, pre-installed miner binary is accepted.
 * The wallet must be a public payout address and must appear in the supplied args.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ALLOWED_BINARIES = new Set(['xmrig','xmrig.exe','lolminer','lolminer.exe','teamredminer','teamredminer.exe','nbminer','nbminer.exe','bzminer','bzminer.exe','gminer','gminer.exe','rigel','rigel.exe','ccminer','ccminer.exe']);
const POOL_HOSTS = Object.freeze({
  etc: 'etc.2miners.com', rvn: 'rvn.2miners.com', kas: 'kas.2miners.com', zec: 'zec.2miners.com',
  ethw: 'ethw.2miners.com', erg: 'erg.2miners.com', nexa: 'nexa.2miners.com'
});
let child = null;
let state = { status: 'NOT_CONFIGURED', configured: false, running: false, startedAt: null, stoppedAt: null, exitCode: null, lastError: null, note: 'No se ejecuta ningún minero hasta que exista un binario compatible, una dirección pública y argumentos validados.' };
let stdoutTail = '';
let stderrTail = '';
const boundedTail = (old, chunk) => `${old}${String(chunk).slice(-2000)}`.slice(-4000);
const envTrue = value => String(value || '').trim().toLowerCase() === 'true';

export function minerSupervisorStatus() {
  const wallet = String(process.env.NEON_MINING_WALLET_ADDRESS || '');
  const poolId = String(process.env.NEON_MINING_POOL || 'etc').toLowerCase();
  const executable = String(process.env.NEON_MINER_EXECUTABLE || '').trim();
  const autoStart = String(process.env.NEON_MINING_AUTOSTART || (executable ? 'true' : 'false')).toLowerCase() !== 'false';
  return {
    ...state,
    running: Boolean(child && child.exitCode === null && !child.killed),
    autoStartRequested: autoStart,
    miningEnabled: envTrue(process.env.ENABLE_REAL_MINING),
    poolId: POOL_HOSTS[poolId] ? poolId : null,
    walletConfigured: Boolean(wallet),
    executableConfigured: Boolean(executable),
    stdoutTail: stdoutTail.slice(-1000).split(wallet || '\u0000').join('[wallet-redacted]'),
    stderrTail: stderrTail.slice(-1000).split(wallet || '\u0000').join('[wallet-redacted]'),
    permissions: { walletRead: true, processStart: Boolean(child), signsTransactions: false, transfersFunds: false, withdrawsFunds: false }
  };
}

function safeChildEnv() {
  const keys = ['PATH','HOME','USERPROFILE','TEMP','TMP','TMPDIR','SYSTEMROOT','WINDIR','LANG','LC_ALL'];
  const env = {};
  for (const key of keys) if (process.env[key]) env[key] = process.env[key];
  return env;
}

export async function startConfiguredMiner({ force = false } = {}) {
  if (child && child.exitCode === null && !child.killed) return minerSupervisorStatus();
  const executableRaw = String(process.env.NEON_MINER_EXECUTABLE || '').trim();
  const wallet = String(process.env.NEON_MINING_WALLET_ADDRESS || '').trim();
  const poolId = String(process.env.NEON_MINING_POOL || 'etc').toLowerCase();
  const autoStart = String(process.env.NEON_MINING_AUTOSTART || (executableRaw ? 'true' : 'false')).toLowerCase() !== 'false';
  const enabled = envTrue(process.env.ENABLE_REAL_MINING);
  const blockers = [];
  if (!force && !autoStart) blockers.push('AUTOSTART_DISABLED');
  if (!enabled) blockers.push('REAL_MINING_DISABLED');
  if (!executableRaw) blockers.push('MINER_EXECUTABLE_NOT_CONFIGURED');
  if (!path.isAbsolute(executableRaw)) blockers.push('MINER_EXECUTABLE_MUST_BE_ABSOLUTE');
  if (!wallet || wallet.length < 10 || wallet.length > 180 || /\s/.test(wallet)) blockers.push('PUBLIC_MINING_WALLET_INVALID_OR_MISSING');
  const poolHost = POOL_HOSTS[poolId];
  if (!poolHost) blockers.push('MINING_POOL_NOT_ALLOWLISTED');
  let args;
  try {
    args = JSON.parse(String(process.env.NEON_MINER_ARGS_JSON || ''));
    if (!Array.isArray(args) || args.length < 1 || args.length > 64 || args.some(a => typeof a !== 'string' || a.length > 500 || a.includes('\0'))) throw new Error('invalid args');
  } catch { args = []; blockers.push('MINER_ARGS_JSON_INVALID_OR_MISSING'); }
  let executable = null;
  if (path.isAbsolute(executableRaw)) {
    try {
      executable = await fs.realpath(executableRaw);
      const stat = await fs.stat(executable);
      if (!stat.isFile()) blockers.push('MINER_EXECUTABLE_NOT_A_FILE');
      if (!ALLOWED_BINARIES.has(path.basename(executable).toLowerCase())) blockers.push('MINER_BINARY_NOT_ALLOWLISTED');
    } catch { blockers.push('MINER_EXECUTABLE_NOT_FOUND'); }
  }
  if (wallet && !args.some(arg => arg.includes(wallet))) blockers.push('PAYOUT_WALLET_NOT_PRESENT_IN_ARGS');
  if (poolHost && !args.some(arg => arg.toLowerCase().includes(poolHost))) blockers.push('POOL_HOST_NOT_PRESENT_IN_ARGS');
  if (blockers.length) {
    state = { ...state, status: 'BLOCKED_CONFIGURATION', configured: Boolean(executableRaw), running: false, lastError: blockers.join(','), note: 'No se ha iniciado ningún proceso de minería. Corrige la configuración una sola vez en el .env; no se leen claves privadas.' };
    return minerSupervisorStatus();
  }
  const proc = spawn(executable, args, { shell: false, windowsHide: true, stdio: ['ignore','pipe','pipe'], cwd: path.dirname(executable), env: safeChildEnv() });
  child = proc;
  stdoutTail = ''; stderrTail = '';
  state = { status: 'STARTING', configured: true, running: true, startedAt: new Date().toISOString(), stoppedAt: null, exitCode: null, lastError: null, note: 'Minero local iniciado con binario allowlist y shell deshabilitada.' };
  proc.stdout?.on('data', chunk => { stdoutTail = boundedTail(stdoutTail, chunk); });
  proc.stderr?.on('data', chunk => { stderrTail = boundedTail(stderrTail, chunk); });
  proc.once('spawn', () => { state = { ...state, status: 'RUNNING', running: true }; });
  proc.once('error', error => { state = { ...state, status: 'FAILED', running: false, lastError: String(error?.code || error?.message || 'MINER_SPAWN_FAILED').slice(0,160) }; });
  proc.once('exit', (code, signal) => {
    state = { ...state, status: code === 0 ? 'STOPPED' : 'EXITED', running: false, stoppedAt: new Date().toISOString(), exitCode: code, lastError: signal ? `EXIT_SIGNAL_${signal}` : (code && code !== 0 ? `MINER_EXIT_${code}` : null) };
    child = null;
  });
  return minerSupervisorStatus();
}

export async function stopConfiguredMiner() {
  if (!child) return minerSupervisorStatus();
  const current = child;
  state = { ...state, status: 'STOPPING', running: false };
  current.kill('SIGTERM');
  await Promise.race([new Promise(resolve => current.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 5000))]);
  if (child === current && current.exitCode === null) current.kill('SIGKILL');
  return minerSupervisorStatus();
}
