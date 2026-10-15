/** NEON ORB: CYBER POWER SLOTS — recreational demo credits only. */
import { SlotEngine } from '../core/slot-engine.js';

const engine = new SlotEngine();
const STORAGE_KEY = 'neon_orb_cyber_power_slots_v2';
const LEGACY_KEY = 'neon_arcade_demo_credits_v1';
const BRIDGE_PORTS = [8787, 8765];
const INITIAL_BALANCE = 100;
const money = n => Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const safeNumber = value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(Number(value).toFixed(2)) : INITIAL_BALANCE;

function getDeviceId() {
  try {
    let id = localStorage.getItem(`${STORAGE_KEY}:device`);
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() || `arcade_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
      localStorage.setItem(`${STORAGE_KEY}:device`, id);
    }
    return id;
  } catch { return `arcade_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`; }
}

class NeonSlotMachine {
  constructor(container) {
    this.container = container;
    this.deviceId = getDeviceId();
    this.state = this.loadLocalState();
    this.balance = this.state.balance;
    this.history = this.state.history;
    this.bet = 1;
    this.busy = false;
    this.bridgeUrl = null;
    this.render();
    this.bind();
    void this.initialize();
    this.poll = setInterval(() => void this.refreshBridge(), 15000);
    window.addEventListener('beforeunload', () => clearInterval(this.poll), { once: true });
  }

  loadLocalState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        const balance = safeNumber(saved.balance);
        return { balance: balance === 0 ? INITIAL_BALANCE : balance, history: Array.isArray(saved.history) ? saved.history.slice(-20) : [], updatedAt: Number(saved.updatedAt) || 0 };
      }
      const legacy = localStorage.getItem(LEGACY_KEY);
      const balance = legacy === null ? INITIAL_BALANCE : safeNumber(legacy);
      return { balance: balance === 0 ? INITIAL_BALANCE : balance, history: [], updatedAt: 0 };
    } catch { return { balance: INITIAL_BALANCE, history: [], updatedAt: 0 }; }
  }

  persistLocal() {
    this.state = { balance: Number(this.balance.toFixed(2)), history: this.history.slice(-20), updatedAt: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      localStorage.setItem(LEGACY_KEY, String(this.balance));
    } catch { /* Keep the active session playable if browser storage is disabled. */ }
  }

  render() {
    this.container.innerHTML = `<div class="slot-cabinet-neon" aria-label="NEON ORB Cyber Power Slots">
      <div class="jackpot-banner-grid" aria-label="Tarjetas decorativas del arcade">
        <div class="jackpot-card spades">♠ <span>NEON</span></div><div class="jackpot-card hearts">♥ <span>CYBER</span></div>
        <div class="jackpot-card diamonds">♦ <span>POWER</span></div><div class="jackpot-card clubs">♣ <span>SLOTS</span></div>
      </div>
      <div class="slot-header-title"><h3>NEON ORB: CYBER POWER SLOTS</h3><span class="sub-neon">ARCADE · CRÉDITOS VIRTUALES · MODO DEMO</span></div>
      <div class="reels-frame-neon"><div class="lightning-overlay" aria-hidden="true"></div><div class="smoke-overlay" aria-hidden="true"></div>
        <div class="reels-viewport">${Array.from({ length: 5 }, (_, i) => `<div class="reel" id="slot-reel-${i}"><div class="symbol">${['🍒','🍊','🍋','🍇','⭐'][i]}</div></div>`).join('')}</div>
      </div>
      <div class="slot-info-bar"><div class="info-box"><label>CRÉDITOS DEMO</label><span id="slot-balance-val">${money(this.balance)}</span></div>
        <div class="info-box status-msg" id="slot-status-msg" role="status" aria-live="polite">Sincronizando créditos…</div>
        <div class="info-box"><label>ÚLTIMO PREMIO</label><span id="slot-win-val">0,00</span></div></div>
      <div class="bet-quick-selector" aria-label="Seleccionar apuesta">${[1,2,3,4,5].map(n => `<button class="bet-btn ${n === 1 ? 'active' : ''}" data-bet="${n}" type="button" aria-pressed="${n === 1}">${n.toFixed(2).replace('.', ',')} créditos</button>`).join('')}</div>
      <div class="slot-controls-gold"><button class="ctrl-circle-main" id="btn-spin-main" type="button">⚡ GIRAR ⚡</button></div>
      <div class="slot-history" aria-live="polite"><strong>ÚLTIMAS TIRADAS</strong><ol id="slot-history-list">${this.history.slice(-5).reverse().map(item => `<li>${item.at ? new Date(item.at).toLocaleTimeString('es-ES') : '—'} · apuesta ${money(item.betAmount)} · premio ${money(item.winAmount)}</li>`).join('') || '<li>Aún no hay tiradas.</li>'}</ol></div>
      <p class="slot-demo-notice">Saldo de cortesía: 100 créditos virtuales. Reiniciar el saldo cuando llega a cero es una función de demostración. No hay apuestas, premios pagaderos, depósitos ni retiros de dinero real; no se utiliza ninguna billetera.</p>
    </div>`;
  }

  bind() {
    this.container.querySelectorAll('[data-bet]').forEach(button => button.addEventListener('click', () => {
      if (this.busy) return;
      this.bet = Number(button.dataset.bet);
      this.container.querySelectorAll('[data-bet]').forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
    }));
    this.container.querySelector('#btn-spin-main').addEventListener('click', () => void this.spin());
  }

  async initialize() {
    try {
      const response = await fetch(`/api/arcade/state?deviceId=${encodeURIComponent(this.deviceId)}`, { cache: 'no-store' });
      if (response.ok) {
        const remote = await response.json();
        if (remote.ok) {
          const remoteTime = Date.parse(remote.updatedAt || '') || 0;
          const localTime = Number(this.state.updatedAt) || 0;
          const merged = new Map();
          for (const item of [...(Array.isArray(remote.events) ? remote.events : []), ...this.history]) {
            if (!item || typeof item !== 'object') continue;
            const key = `${item.at || ''}|${item.betAmount}|${item.winAmount}|${item.balance}`;
            merged.set(key, item);
          }
          this.history = [...merged.values()].sort((a, b) => (Date.parse(a.at || '') || 0) - (Date.parse(b.at || '') || 0)).slice(-20);
          if (!localTime || remoteTime >= localTime) this.balance = safeNumber(remote.balance) || INITIAL_BALANCE;
          else await this.saveServerSnapshot();
        }
      }
    } catch { /* Local storage remains the offline fallback. */ }
    this.persistLocal();
    this.updateBalanceDisplay();
    this.setStatus('Créditos listos · modo demo');
    await this.refreshBridge();
  }

  setStatus(message) {
    const status = this.container.querySelector('#slot-status-msg');
    if (status) status.textContent = message;
  }
  updateBalanceDisplay() {
    const display = this.container.querySelector('#slot-balance-val');
    if (display) display.textContent = money(this.balance);
    const history = this.container.querySelector('#slot-history-list');
    if (history) history.innerHTML = this.history.slice(-5).reverse().map(item => `<li>${item.at ? new Date(item.at).toLocaleTimeString('es-ES') : '—'} · apuesta ${money(item.betAmount)} · premio ${money(item.winAmount)}</li>`).join('') || '<li>Aún no hay tiradas.</li>';
  }

  async saveServerSnapshot() {
    const response = await fetch('/api/arcade/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId: this.deviceId, balance: this.balance }), cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo guardar el estado arcade en el servidor');
    return response.json();
  }

  async syncBridge(event) {
    const hostname = window.location.hostname || '127.0.0.1';
    const ports = [...new Set(BRIDGE_PORTS)];
    for (const port of ports) {
      const base = `${window.location.protocol === 'https:' ? 'http:' : window.location.protocol}//${hostname}:${port}`;
      try {
        const response = await fetch(`${base}/arcade/state`, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId: this.deviceId, balance: this.balance, event }), signal: AbortSignal.timeout(1800) });
        if (response.ok) { this.bridgeUrl = base; return true; }
      } catch { /* The Node ledger/localStorage continue to work if Python bridge is offline. */ }
    }
    return false;
  }

  async spin() {
    if (this.busy) return;
    if (this.balance < this.bet) { this.setStatus('CRÉDITOS INSUFICIENTES'); return; }
    this.busy = true;
    const button = this.container.querySelector('#btn-spin-main');
    button.disabled = true;
    this.container.querySelectorAll('[data-bet]').forEach(item => { item.disabled = true; });
    this.setStatus('GIRANDO…');
    this.container.querySelectorAll('.reel').forEach(reel => reel.classList.add('spinning'));
    try {
      await new Promise(resolve => setTimeout(resolve, 850));
      const result = await engine.processSpin(this.bet, this.balance);
      this.balance = result.newBalance;
      const event = { type: 'DEMO_SPIN', betAmount: result.betAmount, winAmount: result.winAmount, balance: result.newBalance, reels: result.reels, at: new Date().toISOString(), currency: 'DEMO_CREDITS' };
      this.history.push(event);
      this.history = this.history.slice(-20);
      this.persistLocal();
      result.reels.forEach((symbol, index) => { const target = this.container.querySelector(`#slot-reel-${index} .symbol`); if (target) target.textContent = symbol; });
      this.container.querySelectorAll('.reel').forEach(reel => reel.classList.remove('spinning'));
      this.updateBalanceDisplay();
      this.container.querySelector('#slot-win-val').textContent = money(result.winAmount);
      this.setStatus(result.winAmount > 0 ? `PREMIO DEMO: ${money(result.winAmount)} créditos` : 'Sin premio esta vez');
      let serverSaved = false;
      try {
        const response = await fetch('/api/arcade/spin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId: this.deviceId, balance: this.balance, event }), cache: 'no-store' });
        serverSaved = response.ok;
      } catch { /* Local copy remains durable on this device. */ }
      const bridgeSaved = await this.syncBridge(event);
      const syncLabel = serverSaved ? (bridgeSaved ? 'servidor + puente Python' : 'servidor; puente Python desconectado') : 'copia local; servidor no disponible';
      const sync = document.getElementById('slot-last-sync');
      if (sync) sync.textContent = `Última tirada guardada: ${new Date().toLocaleTimeString('es-ES')} · ${syncLabel}`;
      if (!serverSaved) this.setStatus(`${result.winAmount > 0 ? `Premio demo ${money(result.winAmount)}` : 'Tirada completada'} · guardada localmente`);
    } catch (error) {
      this.setStatus(error?.message || 'No se pudo completar la tirada');
    } finally {
      this.busy = false;
      button.disabled = false;
      this.container.querySelectorAll('[data-bet]').forEach(item => { item.disabled = false; });
      this.container.querySelectorAll('.reel').forEach(reel => reel.classList.remove('spinning'));
    }
  }

  async refreshBridge() {
    const pill = document.getElementById('slot-bridge-state');
    const ledger = document.getElementById('slot-ledger-state');
    const sync = document.getElementById('slot-last-sync');
    try {
      const [health, accounting] = await Promise.all([
        fetch('/healthz', { cache: 'no-store' }),
        fetch('/api/economy/accounting', { cache: 'no-store' })
      ]);
      if (!health.ok) throw new Error('health');
      const h = await health.json();
      let ledgerOk = false;
      if (accounting.ok) { const a = await accounting.json(); ledgerOk = a.ok === true; }
      if (pill) { pill.innerHTML = `<i></i> ${h.status === 'ok' ? 'SERVIDOR EN LÍNEA' : 'SERVIDOR NO VERIFICADO'}`; pill.classList.toggle('is-live', h.status === 'ok'); }
      if (ledger) ledger.textContent = `Ledger económico: ${ledgerOk ? 'API accesible' : 'no disponible'} · separado de créditos arcade`;
      if (sync && !sync.textContent.includes('Última tirada guardada')) sync.textContent = `Estado comprobado: ${new Date().toLocaleTimeString('es-ES')}`;
    } catch {
      if (pill) { pill.innerHTML = '<i></i> SERVIDOR NO DISPONIBLE'; pill.classList.remove('is-live'); }
      if (ledger) ledger.textContent = 'Ledger económico: no se pudo verificar';
      if (sync && !sync.textContent.includes('Última tirada guardada')) sync.textContent = `Modo local · comprobación: ${new Date().toLocaleTimeString('es-ES')}`;
    }
  }
}

const mount = () => {
  const target = document.getElementById('slot-machine');
  if (target && !target.dataset.mounted) { target.dataset.mounted = 'true'; new NeonSlotMachine(target); }
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
