/** Unified responsive control center for NEON ORB. Status values come from live local endpoints. */
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time = value => value ? new Date(value).toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '—';
const getJson = async (url) => { const r = await fetch(url, {cache:'no-store', headers:{Accept:'application/json'}, signal:AbortSignal.timeout(4500)}); if(!r.ok) throw new Error(`HTTP_${r.status}`); return r.json(); };

const nodes = [
  {id:'api', label:'API local', sub:'HTTP · puerto configurado', x:160, y:122, href:'#control', group:'CORE'},
  {id:'ai', label:'NEON ORB / IA', sub:'Agente técnico', x:300, y:80, href:'#control', group:'AGENT'},
  {id:'radio', label:'Radio / media', sub:'Reproductor integrado', x:398, y:147, href:'#radio', group:'MEDIA'},
  {id:'web', label:'Red / búsqueda', sub:'Fuentes públicas HTTPS', x:490, y:88, href:'#unifiedNetworkOpsHost', group:'NETWORK'},
  {id:'sol', label:'Solana', sub:'Conector de cadena', x:340, y:210, href:'#wallet', group:'CHAIN'},
  {id:'evm', label:'Ethereum / Base', sub:'Conector EVM', x:485, y:215, href:'#wallet', group:'CHAIN'},
  {id:'btc', label:'Bitcoin', sub:'Conector BTC', x:205, y:222, href:'#wallet', group:'CHAIN'},
  {id:'arcade', label:'Arcade / slots', sub:'Créditos de demostración', x:575, y:158, href:'#slot-zone', group:'ARCADE'}
];

export function mountUnifiedControlCenter(root) {
  if (!root) return () => {};
  let control=null, network=null, operations=null, health=null, lastSuccess=null, failures=0, timer=null, stopped=false;
  const stateFor = id => {
    if (id==='api') return (health?.ok || health?.status==='ok') ? ['ONLINE','good'] : ['SIN RESPUESTA','bad'];
    if (id==='ai') return control?.agent?.configured ? ['CONFIGURADA','good'] : ['PENDIENTE','warn'];
    if (id==='radio') return control?.radio?.action==='play' ? ['REPRODUCCIÓN SOLICITADA','good'] : ['DISPONIBLE','muted'];
    if (id==='web') return network?.mode ? ['CONECTADA','good'] : ['SIN DATOS','warn'];
    if (id==='arcade') { const text=document.querySelector('#slot-bridge-state')?.textContent || ''; return /LISTO|CONECTADO|OK/i.test(text) ? ['PUENTE ACTIVO','good'] : ['ESTADO DEL MÓDULO','muted']; }
    if (id==='sol'||id==='evm'||id==='btc') return operations?.gasPreflight ? ['MÓDULO DISPONIBLE','muted'] : ['ESTADO NO VERIFICADO','muted'];
    return ['DISPONIBLE','muted'];
  };
  const render = () => {
    const detailsOpen = root.querySelector('[data-neo-diagnostics]')?.open ?? false;
    const nodeMarks=nodes.map(n=>{const [status,cls]=stateFor(n.id);return `<a class="neo-map-node ${cls}" href="${n.href}" data-node="${n.id}" aria-label="${esc(n.label)}: ${esc(status)}" title="${esc(n.label)} · ${esc(status)}"><span class="neo-map-pulse"></span><span class="neo-map-node-label"><b>${esc(n.label)}</b><small>${esc(status)}</small></span></a>`;}).join('');
    const cards=nodes.map(n=>{const [status,cls]=stateFor(n.id);const sub=n.id==='api'?`HTTP · puerto ${control?.server?.port ?? 'configurado'}`:n.sub;return `<a class="neo-cc-tile" href="${n.href}"><span class="neo-cc-tile-top"><i class="neo-status-dot ${cls}"></i><small>${esc(n.group)}</small></span><b>${esc(n.label)}</b><span class="neo-cc-status ${cls}">${esc(status)}</span><small class="neo-cc-sub">${esc(sub)}</small></a>`;}).join('');
    const serverOk=!!(health?.ok || health?.status==='ok');
    const networkOk=!!network?.mode;
    const agentOk=!!control?.agent?.configured;
    root.innerHTML=`<section class="neo-unified-center neo-cc-streamlined" aria-labelledby="neoUnifiedTitle">
      <header class="neo-cc-header"><div><span class="neo-cc-kicker">NEON ORB <i class="neo-cc-separator">/</i> ECOSYSTEM COMMAND</span><h2 id="neoUnifiedTitle">CONTROL <em>DECK</em></h2></div><div class="neo-cc-live ${failures===0&&lastSuccess?'is-live':'is-warn'}"><i></i><span>${failures===0&&lastSuccess?'LIVE LINK':'SYNC CHECK'}</span><small>${time(lastSuccess)}</small></div></header>
      <div class="neo-cc-summary neo-cc-summary-compact" aria-label="Estado esencial"><div><small>CORE</small><b class="${serverOk?'neo-state-good':'neo-state-warn'}">${serverOk?'ONLINE':'CHECKING'}</b></div><div><small>NETWORK</small><b class="${networkOk?'neo-state-good':'neo-state-warn'}">${networkOk?'READY':'PENDING'}</b></div><div><small>NEON ORB</small><b class="${agentOk?'neo-state-good':'neo-state-warn'}">${agentOk?'ACTIVE CONFIG':'STANDBY'}</b></div></div>
      <article class="neo-holo-map-card neo-holo-map-card-primary"><div class="neo-cc-panel-head"><div><span>LIVE SYSTEM TOPOLOGY</span><h3>HOLOGRAPHIC <em>ECOSYSTEM</em></h3></div><span class="neo-cc-tag">${esc(control?.server?.port ? `PORT ${control.server.port}` : 'LOCAL LINK')}</span></div>
      <div class="neo-holo-map" role="img" aria-label="Mapa holográfico esquemático de los nodos del ecosistema. Las posiciones son ilustrativas, no geolocalización real."><div class="neo-map-sweep" aria-hidden="true"></div><svg class="neo-world-svg" viewBox="0 0 700 300" aria-hidden="true"><defs><linearGradient id="neoLand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00f6ff" stop-opacity=".30"/><stop offset="1" stop-color="#8e5cff" stop-opacity=".12"/></linearGradient><pattern id="neoGrid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#38dfff" stroke-opacity=".18" stroke-width=".6"/></pattern><filter id="neoMapGlow"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="700" height="300" fill="url(#neoGrid)"/><g fill="url(#neoLand)" stroke="#4deaff" stroke-opacity=".7" stroke-width="1.1" filter="url(#neoMapGlow)"><path d="M65 64l22-18 32 4 13 17 25 3 11 19-17 12-4 22-21 14-10 28-19 5-7-20-17-12-4-23-17-18 6-21-8-12zM158 156l19 5 15 18-4 24-12 18-6 31-13 14-8-23-10-18 4-22-10-21zM280 60l24-15 30 7 11 16 23 4 14 15-7 14-22 2-7 14-21 1-10 20-16 4-6-21-15-12 1-19-11-11zM324 141l24-8 24 11 11 24-11 25-7 26-16 20-12-19-4-25-14-20-7-18zM376 75l36-16 45 5 19 13 32-2 29 16 26 1 24 19-12 14-29-6-17 14-24-4-13 18-25-4-9-16-24-5-15-17-23-4-8-13-21 2zM516 170l22-9 20 12 10 23-17 20-20-4-14-18z"/></g><g class="neo-map-links" stroke="#1feaff" stroke-opacity=".65" stroke-dasharray="3 6" fill="none"><path d="M160 122Q230 30 300 80T398 147T490 88"/><path d="M160 122Q180 190 205 222T340 210T485 215T575 158"/><path d="M300 80Q330 150 340 210"/><path d="M398 147Q440 180 485 215"/></g><g fill="none" stroke="#9afcff" stroke-opacity=".22"><ellipse cx="350" cy="150" rx="325" ry="120"/><ellipse cx="350" cy="150" rx="210" ry="120"/><ellipse cx="350" cy="150" rx="100" ry="120"/></g></svg><div class="neo-map-markers">${nodeMarks}</div><div class="neo-map-caption"><span><i></i> ONLINE</span><span><i class="warn"></i> PENDING / UNVERIFIED</span><span>SCHEMATIC · NOT GPS</span></div></div>
      <div class="neo-cc-map-foot"><span>Selección de nodo → acceso al módulo. Los estados proceden de sondeos locales.</span><button type="button" data-refresh-center>↻ SYNC</button></div></article>
      <nav class="neo-cc-command-rail" aria-label="Accesos del ecosistema"><a href="#control"><span>⌘</span><b>AGENT</b></a><a href="#unifiedNetworkOpsHost"><span>⌁</span><b>NETWORK</b></a><a href="#wallet"><span>◇</span><b>WALLETS</b></a><a href="#radio"><span>◉</span><b>RADIO</b></a><a href="#slot-zone"><span>▥</span><b>ARCADE</b></a><a href="#temas"><span>✦</span><b>THEMES</b></a></nav>
      <details class="neo-cc-diagnostics" data-neo-diagnostics ${detailsOpen?'open':''}><summary><span>DIAGNOSTICS</span><small>Estado detallado de los 8 subsistemas</small><b aria-hidden="true">＋</b></summary><div class="neo-cc-modules"><div class="neo-cc-tile-grid">${cards}</div><p class="neo-cc-safety-note">El mapa es esquemático, no muestra ubicaciones físicas. Los módulos sin datos confirmados aparecen como pendientes; no se infiere conectividad.</p></div></details>
      <footer class="neo-cc-footer"><span><i class="neo-footer-led ${failures===0&&lastSuccess?'good':'warn'}"></i> NEON ORB · ADMIN</span><span>SYNC ${time(lastSuccess)} · 5 S</span><button type="button" class="neo-cc-footer-sync" data-refresh-center>SYNC NOW</button></footer>
    </section>`;
    root.querySelectorAll('[data-refresh-center]').forEach(button=>button.addEventListener('click', refresh));
  };
  async function refresh(){
    if(stopped) return;
    const checks=await Promise.allSettled([getJson('/api/neon-orb/control/status'),getJson('/api/neon-orb/network/status'),getJson('/api/neon-orb/operations/status'),getJson('/healthz')]);
    [control,network,operations,health]=checks.map((r)=>r.status==='fulfilled'?r.value:null);
    failures=checks.filter(r=>r.status==='rejected').length;
    if(checks.some(r=>r.status==='fulfilled')) lastSuccess=new Date().toISOString();
    render();
  }
  // Paint the holographic map immediately; live API checks must never block first render.
  render();
  refresh(); timer=setInterval(refresh,5000);
  return () => { stopped=true; clearInterval(timer); };
}
