#!/usr/bin/env node
/** Installs/removes an explicit per-user login startup entry for NEON PLAYER X. */
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const node = process.execPath;
const action = process.argv[2] || 'install';
const home = os.homedir();
const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error || result.status !== 0) throw result.error || new Error(`${command} ${args.join(' ')} failed`);
};
const quote = value => String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"');

async function windows() {
  const appData = process.env.APPDATA;
  if (!appData) throw new Error('APPDATA no está definido.');
  const startup = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
  const cmdFile = path.join(startup, 'NEON-PLAYER-X.cmd');
  if (action === 'uninstall') { await fs.rm(cmdFile, { force: true }); console.log('Inicio automático de NEON PLAYER X eliminado.'); return; }
  await fs.mkdir(startup, { recursive: true });
  await fs.writeFile(cmdFile, `@echo off\r\ncd /d "${root}"\r\nstart "NEON PLAYER X" /min "${node}" "${path.join(root, 'server.js')}"\r\n`, 'utf8');
  console.log(`Inicio automático registrado: ${cmdFile}`);
}

async function linux() {
  const dir = path.join(home, '.config', 'systemd', 'user');
  const unit = path.join(dir, 'neon-player-x.service');
  if (action === 'uninstall') {
    try { run('systemctl', ['--user', 'disable', '--now', 'neon-player-x.service']); } catch { /* May not have been enabled. */ }
    await fs.rm(unit, { force: true });
    try { run('systemctl', ['--user', 'daemon-reload']); } catch { /* systemd may be unavailable in containers. */ }
    console.log('Configuración de inicio automático eliminada.'); return;
  }
  await fs.mkdir(dir, { recursive: true });
  const contents = `[Unit]\nDescription=NEON PLAYER X / NEON ORB local resident runtime\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nType=simple\nWorkingDirectory=${root}\nExecStart=${node} ${path.join(root, 'server.js')}\nRestart=on-failure\nRestartSec=5\n\n[Install]\nWantedBy=default.target\n`;
  await fs.writeFile(unit, contents, 'utf8');
  run('systemctl', ['--user', 'daemon-reload']);
  run('systemctl', ['--user', 'enable', '--now', 'neon-player-x.service']);
  console.log(`Servicio de usuario instalado y arrancado: ${unit}`);
}

async function macos() {
  const dir = path.join(home, 'Library', 'LaunchAgents');
  const plist = path.join(dir, 'com.neon.playerx.plist');
  if (action === 'uninstall') {
    try { run('launchctl', ['bootout', `gui/${process.getuid()}`, plist]); } catch { /* Not loaded. */ }
    await fs.rm(plist, { force: true });
    console.log('Configuración de inicio automático eliminada.'); return;
  }
  await fs.mkdir(dir, { recursive: true });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>Label</key><string>com.neon.playerx</string><key>ProgramArguments</key><array><string>${quote(node)}</string><string>${quote(path.join(root, 'server.js'))}</string></array><key>WorkingDirectory</key><string>${quote(root)}</string><key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>StandardOutPath</key><string>${quote(path.join(home, 'Library', 'Logs', 'neon-player-x.log'))}</string><key>StandardErrorPath</key><string>${quote(path.join(home, 'Library', 'Logs', 'neon-player-x-error.log'))}</string></dict></plist>\n`;
  await fs.writeFile(plist, xml, 'utf8');
  try { run('launchctl', ['bootout', `gui/${process.getuid()}`, plist]); } catch { /* Not loaded yet. */ }
  run('launchctl', ['bootstrap', `gui/${process.getuid()}`, plist]);
  console.log(`Agente de inicio instalado y cargado: ${plist}`);
}

try {
  if (!['install', 'uninstall'].includes(action)) throw new Error('Uso: node scripts/autostart.mjs [install|uninstall]');
  if (process.platform === 'win32') await windows();
  else if (process.platform === 'linux') await linux();
  else if (process.platform === 'darwin') await macos();
  else throw new Error(`Sistema operativo no soportado: ${process.platform}`);
} catch (error) {
  console.error(`[NEON autostart] ${error.message}`);
  process.exitCode = 1;
}
