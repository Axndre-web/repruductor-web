/** NEON PLAYER X — persistent local wallet observer.
 * Reads public balances only. No seed phrases, private keys, signing, or transactions.
 * Trusted browser-wallet permissions are restored silently where the provider allows it.
 */
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short = value => value ? `${value.slice(0, 8)}…${value.slice(-6)}` : '—';
const fmt = (value, digits = 6) => Number.isFinite(Number(value)) ? Number(value).toLocaleString('es-ES', { maximumFractionDigits: digits }) : '—';

async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(path, { cache: 'no-store', credentials: 'same-origin', ...options, signal: controller.signal, headers: { Accept:'application/json', ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const e = new Error(data.error || data.code || `HTTP_${response.status}`); e.status = response.status; throw e; }
    return data;
  } finally { clearTimeout(timer); }
}

export function mountWalletDashboard(root) {
  if (!root) throw new Error('Dashboard root required');
  let configured = null;
  let phantomState = null;
  let evmState = null;
  let busy = false;
  let notice = 'Arrancando sincronización local…';
  let disposed = false;

  const render = (message = notice) => {
    notice = message;
    const rows = (configured?.balances || []).map(item => {
      const amount = item.verified && Number.isFinite(Number(item.amount)) ? `${fmt(item.amount, item.asset === 'BTC' ? 8 : 6)} ${esc(item.unit || item.asset)}` : 'NO VERIFICADO';
      return `<article class="npw-balance-card"><div class="npw-balance-top"><span>${esc(item.asset || 'ASSET')}</span><span class="npw-state ${item.verified ? 'ok' : 'warn'}">${item.verified ? 'OBSERVADO' : 'PENDIENTE'}</span></div><strong>${amount}</strong><small class="npw-address" title="${esc(item.address || '')}">${esc(short(item.address || 'Dirección pública no configurada'))}</small><small class="npw-source">${esc(item.source || item.error || 'Fuente no disponible')}</small></article>`;
    }).join('');
    root.innerHTML = `<div class="npw-private" aria-label="Observación privada de wallets">
      <div class="npw-head"><div><span class="eyebrow">NEON ORB · OBSERVADOR RESIDENTE</span><h3>WALLETS <em>SINCRONIZADAS</em></h3><p>La observación de direcciones públicas se inicia automáticamente al abrir el panel. No se solicitan claves privadas ni frases semilla.</p></div><span class="npw-local"><i></i> LOCAL · SOLO LECTURA</span></div>
      <div class="npw-access"><div class="npw-auto-state"><strong>${busy ? 'SINCRONIZANDO…' : configured ? 'OBSERVACIÓN ACTIVA' : 'INICIALIZANDO OBSERVACIÓN'}</strong><small>Actualización automática cada 15 segundos mientras la página esté visible.</small></div><button id="npwRefresh" type="button" class="btn mini" ${busy ? 'disabled' : ''}>${busy ? 'CONSULTANDO…' : 'ACTUALIZAR AHORA'}</button></div>
      <p class="npw-notice" role="status" aria-live="polite">${esc(message || 'Esperando respuesta del servidor local…')}</p>
      <div class="npw-balances">${rows || '<div class="npw-empty">Cargando saldos de las direcciones públicas configuradas en el servidor…</div>'}</div>
      <div class="npw-browser-wallets"><div class="npw-browser-head"><div><span class="eyebrow">WALLET DEL NAVEGADOR</span><h4>Reconexión de confianza</h4><p>NEON ORB restaura silenciosamente permisos previos cuando Phantom o la wallet EVM lo permiten. La primera autorización sigue siendo tuya.</p></div></div>
        <div class="npw-connect-actions"><button id="npwPhantom" class="btn mini" type="button">CONECTAR PHANTOM</button><button id="npwEvm" class="btn mini" type="button">CONECTAR ETHEREUM / BASE</button><button id="npwDisconnect" class="btn mini ghost" type="button">OCULTAR CUENTAS</button></div>
        <div class="npw-connected-grid"><article><small>SOLANA · PHANTOM</small><strong>${esc(phantomState ? `${fmt(phantomState.balance, 6)} SOL` : 'NO CONECTADA')}</strong><span>${esc(phantomState ? short(phantomState.address) : 'Sin permiso previo disponible')}</span><em>${esc(phantomState?.status || 'Esperando autorización guardada')}</em></article><article><small>ETHEREUM / BASE · EVM</small><strong>${esc(evmState ? `${fmt(evmState.balance, 6)} ${evmState.symbol}` : 'NO CONECTADA')}</strong><span>${esc(evmState ? short(evmState.address) : 'Sin permiso previo disponible')}</span><em>${esc(evmState?.status || 'Esperando autorización guardada')}</em></article></div>
      </div>
      <p class="npw-foot">Solo se leen balances públicos. Las conexiones confiables pueden restaurarse sin diálogo, según los permisos de la extensión. Si el proveedor revoca el permiso o el navegador bloquea la wallet, tendrás que autorizarla de nuevo desde la extensión.</p>
    </div>`;
    root.querySelector('#npwRefresh')?.addEventListener('click', () => refreshConfigured(true));
    root.querySelector('#npwPhantom')?.addEventListener('click', connectPhantom);
    root.querySelector('#npwEvm')?.addEventListener('click', connectEvm);
    root.querySelector('#npwDisconnect')?.addEventListener('click', () => { phantomState = null; evmState = null; render('Cuentas ocultadas de este panel. Esto no revoca el permiso de la extensión.'); });
  };

  async function refreshConfigured(manual = false) {
    if (busy || disposed) return;
    busy = true;
    render(manual ? 'Consultando las direcciones configuradas…' : 'Sincronizando saldos de forma automática…');
    try {
      configured = await fetchJson('/api/neon-orb/wallet/observed/local');
      render(`Sincronizado · ${new Date(configured.observedAt || Date.now()).toLocaleTimeString('es-ES')} · ${configured.balances?.filter(x => x.verified).length || 0} saldo(s) verificado(s).`);
    } catch (error) {
      configured = null;
      render(error.status === 403 ? 'El servidor rechazó la solicitud: abre el panel desde http://127.0.0.1:3000 o http://localhost:3000.' : `Observación temporalmente no disponible: ${error.message}. Se reintentará automáticamente.`);
    } finally {
      busy = false;
      if (!disposed) render(notice);
    }
  }

  async function updatePhantom(provider, { silent = false } = {}) {
    const response = silent ? await provider.connect({ onlyIfTrusted: true }) : await provider.connect();
    const address = String(response?.publicKey || provider.publicKey || '');
    if (!address) throw new Error('Phantom no devolvió una cuenta pública.');
    const rpc = 'https://api.mainnet-beta.solana.com';
    const rpcResult = await fetch(rpc, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getBalance',params:[address,{commitment:'confirmed'}]}), signal:AbortSignal.timeout(8000) });
    if (!rpcResult.ok) throw new Error('No se pudo consultar Solana RPC.');
    const payload = await rpcResult.json();
    if (payload.error || !Number.isFinite(Number(payload?.result?.value))) throw new Error('Respuesta de balance Solana no válida.');
    phantomState = { address, balance:Number(payload.result.value)/1e9, status:silent ? 'Permiso de confianza restaurado · solo lectura' : 'Cuenta autorizada por Phantom · solo lectura' };
  }

  async function updateEvm(provider, { silent = false } = {}) {
    const accounts = await provider.request({ method: silent ? 'eth_accounts' : 'eth_requestAccounts' });
    const address = accounts?.[0];
    if (!address) { if (!silent) throw new Error('No se autorizó ninguna cuenta.'); return; }
    const chainHex = await provider.request({ method:'eth_chainId' });
    const chainId = Number.parseInt(chainHex, 16);
    const balanceHex = await provider.request({ method:'eth_getBalance', params:[address, 'latest'] });
    evmState = { address, balance:Number(BigInt(balanceHex)) / 1e18, symbol:chainId === 8453 ? 'ETH · BASE' : chainId === 1 ? 'ETH' : `ETH · CHAIN ${chainId}`, chainId, status:silent ? 'Permiso de confianza restaurado · solo lectura' : 'Cuenta autorizada por wallet · solo lectura' };
  }

  async function connectPhantom() {
    try {
      const provider = window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null);
      if (!provider) throw new Error('Phantom no está instalada en este navegador.');
      await updatePhantom(provider);
      render('Phantom conectada bajo tu autorización. Solo se ha leído el saldo SOL.');
    } catch (error) { render(`Phantom: ${error.message || 'conexión cancelada'}`); }
  }

  async function connectEvm() {
    try {
      const provider = window.ethereum;
      if (!provider?.request) throw new Error('No se detectó una wallet EVM compatible.');
      await updateEvm(provider);
      render(`Wallet EVM conectada bajo tu autorización. Red detectada: ${evmState.chainId}.`);
    } catch (error) { render(`Wallet EVM: ${error.message || 'conexión cancelada'}`); }
  }

  async function restoreTrustedWallets() {
    let restored = false;
    const phantom = window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null);
    if (phantom?.connect && !phantomState) {
      try { await updatePhantom(phantom, { silent:true }); restored = true; } catch { /* Not previously trusted or extension unavailable. */ }
    }
    const evm = window.ethereum;
    if (evm?.request && !evmState) {
      try { await updateEvm(evm, { silent:true }); restored = Boolean(evmState) || restored; } catch { /* No previously authorized account. */ }
    }
    if (!disposed) render(restored ? 'Permisos previos restaurados sin diálogo. Saldos de wallet actualizados.' : notice);
  }

  async function refreshConnectedBalances() {
    let changed = false;
    const phantom = window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null);
    if (phantomState?.address && phantom) {
      try { await updatePhantom(phantom, { silent:true }); changed = true; } catch { /* Preserve last verified value. */ }
    }
    if (evmState?.address && window.ethereum?.request) {
      try { await updateEvm(window.ethereum, { silent:true }); changed = true; } catch { /* Preserve last verified value. */ }
    }
    if (changed && !disposed) render('Wallets del navegador sincronizadas automáticamente · solo lectura.');
  }

  render();
  void refreshConfigured();
  void restoreTrustedWallets();
  const poller = setInterval(async () => {
    if (disposed || document.visibilityState !== 'visible') return;
    await refreshConfigured();
    await refreshConnectedBalances();
  }, 15000);
  return () => { disposed = true; clearInterval(poller); configured = null; phantomState = null; evmState = null; };
}
