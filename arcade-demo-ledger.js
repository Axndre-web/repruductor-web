/** Isolated persistent ledger for recreational demo credits; never touches the economic ledger. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.resolve(process.env.NEON_ARCADE_DEMO_STORE || path.join(moduleDir, '..', 'data', 'arcade-demo-ledger.json'));
const INITIAL_BALANCE = 100;
const MAX_EVENTS = 100;
let writeQueue = Promise.resolve();

function validDeviceId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(value);
}
function keyFor(deviceId) { return createHash('sha256').update(deviceId).digest('hex'); }
async function readStore() {
  try {
    const parsed = JSON.parse(await fs.readFile(STORE_PATH, 'utf8'));
    return parsed && typeof parsed === 'object' && parsed.devices && typeof parsed.devices === 'object' ? parsed : { version: 1, devices: {} };
  } catch (error) {
    if (error?.code === 'ENOENT' || error instanceof SyntaxError) return { version: 1, devices: {} };
    throw error;
  }
}
async function mutate(mutator) {
  const operation = writeQueue.then(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    const temp = `${STORE_PATH}.${process.pid}.tmp`;
    await fs.writeFile(temp, JSON.stringify(store, null, 2), { mode: 0o600 });
    await fs.rename(temp, STORE_PATH);
    return result;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}
function cleanEvent(event) {
  if (!event || typeof event !== 'object') return null;
  const bet = Number(event.betAmount), win = Number(event.winAmount), balance = Number(event.balance);
  if (![bet, win, balance].every(Number.isFinite) || bet < 0 || win < 0 || balance < 0 || bet > 10000 || win > 1000000 || balance > 1000000) return null;
  return { id: randomUUID(), type: 'DEMO_SPIN', betAmount: Number(bet.toFixed(2)), winAmount: Number(win.toFixed(2)), balance: Number(balance.toFixed(2)), reels: Array.isArray(event.reels) ? event.reels.slice(0, 5).map(v => String(v).slice(0, 8)) : [], at: new Date().toISOString(), currency: 'DEMO_CREDITS' };
}
export async function getArcadeState(deviceId) {
  if (!validDeviceId(deviceId)) throw new TypeError('deviceId inválido');
  return mutate(store => {
    const key = keyFor(deviceId);
    let record = store.devices[key];
    if (!record || !Number.isFinite(Number(record.balance)) || Number(record.balance) <= 0) {
      record = store.devices[key] = { balance: INITIAL_BALANCE, events: [], updatedAt: new Date().toISOString(), currency: 'DEMO_CREDITS' };
    }
    return { ok: true, balance: Number(record.balance), events: record.events.slice(-MAX_EVENTS), updatedAt: record.updatedAt || null, currency: 'DEMO_CREDITS', source: 'isolated-arcade-demo-ledger' };
  });
}
export async function recordArcadeSpin(deviceId, payload) {
  if (!validDeviceId(deviceId)) throw new TypeError('deviceId inválido');
  const balance = Number(payload?.balance);
  const event = cleanEvent(payload?.event);
  if (!Number.isFinite(balance) || balance < 0 || balance > 1000000 || !event || Math.abs(balance - event.balance) > 0.011) throw new TypeError('evento arcade inválido');
  return mutate(store => {
    const key = keyFor(deviceId);
    const previous = store.devices[key] || { events: [] };
    const events = Array.isArray(previous.events) ? previous.events : [];
    events.push(event);
    store.devices[key] = { balance: Number(balance.toFixed(2)), events: events.slice(-MAX_EVENTS), updatedAt: new Date().toISOString(), currency: 'DEMO_CREDITS' };
    return { ok: true, balance: store.devices[key].balance, event, persisted: true, currency: 'DEMO_CREDITS' };
  });
}
export const arcadeDemoConfig = Object.freeze({ initialBalance: INITIAL_BALANCE, currency: 'DEMO_CREDITS', realMoney: false });

export async function saveArcadeSnapshot(deviceId, balance) {
  if (!validDeviceId(deviceId)) throw new TypeError('deviceId inválido');
  const amount = Number(balance);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1000000) throw new TypeError('saldo arcade inválido');
  return mutate(store => {
    const key = keyFor(deviceId);
    const previous = store.devices[key] || { events: [] };
    store.devices[key] = { ...previous, balance: Number(amount.toFixed(2)), events: Array.isArray(previous.events) ? previous.events.slice(-MAX_EVENTS) : [], updatedAt: new Date().toISOString(), currency: 'DEMO_CREDITS' };
    return { ok: true, balance: store.devices[key].balance, persisted: true, currency: 'DEMO_CREDITS' };
  });
}
