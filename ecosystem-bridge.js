const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const API='/api/neon-orb';
async function get(path){const r=await fetch(path,{headers:{accept:'application/json'},cache:'no-store'});if(!r.ok)throw Error('HTTP_'+r.status);return r.json()}
export function mountEcosystemBridge(root){if(!root)return;const $=s=>root.querySelector(s);const set=(id,v)=>{const n=$(id);if(n)n.textContent=v};
const time=()=>new Date().toLocaleString();
async function refresh(){set('[data-eco-updated]',`Actualizado: ${time()}`);const endpoints=[['network',`${API}/network/status`],['agent',`${API}/agent/status`],['control',`${API}/control/status`],['wallet',`${API}/wallet/observe`]];let ok=0;for(const [key,url] of endpoints){try{const data=await get(url);ok++;const node=$(`[data-eco-${key}]`);if(node){node.dataset.state='ok';node.textContent=key==='wallet'?(data.observer?.state||'LECTURA DISPONIBLE'):(data.ok===false?'RESPUESTA LIMITADA':'RESPUESTA RECIBIDA')}}catch{const node=$(`[data-eco-${key}]`);if(node){node.dataset.state='offline';node.textContent='NO VERIFICADO / API NO DISPONIBLE'}}}set('[data-eco-summary]',`${ok}/${endpoints.length} servicios respondieron`);}
const form=$('[data-eco-profile]');form?.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form);const profile={skills:String(data.get('skills')||'').slice(0,1000),region:String(data.get('region')||'').slice(0,120),availability:String(data.get('availability')||'').slice(0,120)};try{localStorage.setItem('neonOrbWorkProfile',JSON.stringify(profile));set('[data-eco-profile-state]','Perfil guardado localmente en este dispositivo. No se ha enviado a terceros.')}catch{set('[data-eco-profile-state]','No se pudo guardar el perfil local.')}});
const exportBtn=$('[data-eco-export]');exportBtn?.addEventListener('click',()=>{const payload={generatedAt:new Date().toISOString(),profile:JSON.parse(localStorage.getItem('neonOrbWorkProfile')||'{}'),notice:'Solo telemetría local de interfaz; no certifica ingresos, identidad ni transacciones.'};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='neon-orb-telemetry.json';a.click();URL.revokeObjectURL(a.href)});
refresh();const timer=setInterval(refresh,30000);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});}

// Outbound portal: searches only through the local server's bounded HTTPS allowlist.
// It is deliberately not an arbitrary URL proxy and never forwards credentials.
const portalState=$('[data-portal-state]');
const portalMessage=$('[data-portal-message]');
const portalResults=$('[data-portal-results]');
const setPortalState=(state,label)=>{if(portalState){portalState.dataset.state=state;portalState.textContent=label}};
const renderPortalResults=(items,kind)=>{
  if(!portalResults)return;
  if(!Array.isArray(items)||!items.length){portalResults.innerHTML='<p class="eco-muted">La fuente respondió, pero no devolvió resultados para esta consulta. Prueba otros términos.</p>';return;}
  portalResults.innerHTML=items.map(item=>{
    const href=String(item.url||'');
    let safe='';try{const u=new URL(href);if(u.protocol==='https:')safe=u.href;}catch{}
    if(!safe)return '';
    const title=esc(item.title||item.name||'Resultado externo');
    const description=esc(item.description||item.company||item.location||'');
    const source=esc(item.source||'Fuente externa');
    return `<article class="eco-result"><a href="${safe}" target="_blank" rel="noopener noreferrer">${title} ↗</a>${description?`<p>${description}</p>`:''}<small>${source}</small></article>`;
  }).filter(Boolean).join('')||'<p class="eco-muted">No hay enlaces HTTPS válidos en la respuesta.</p>';
};
async function runPortalSearch(form,kind){
  const input=form?.querySelector('input[name="q"]');if(!input)return;
  const query=input.value.trim();if(query.length<2){portalMessage.textContent='Escribe al menos dos caracteres.';return;}
  const button=form.querySelector('button');if(button)button.disabled=true;
  if(portalMessage)portalMessage.textContent='NEON ORB está consultando una fuente externa permitida…';
  setPortalState('pending','CONSULTANDO INTERNET');
  try{
    const endpoint=kind==='jobs'?'/api/neon-orb/jobs/search':'/api/neon-orb/network/search';
    const response=await get(`${endpoint}?q=${encodeURIComponent(query)}`);
    const items=kind==='jobs'?(response.results||[]):(response.results||[]);
    renderPortalResults(items,kind);
    if(portalMessage)portalMessage.textContent=`Consulta completada. ${items.length} resultado(s). Fuente: ${kind==='jobs'?'feeds públicos de empleo':'DuckDuckGo Instant Answer API'}.`;
    setPortalState('ok','PUENTE RESPONDIÓ');
  }catch(error){
    if(portalMessage)portalMessage.textContent='No se pudo alcanzar la fuente externa. Comprueba que NEON ORB esté ejecutándose en localhost:3000 y que haya conexión a internet.';
    if(portalResults)portalResults.innerHTML='<p class="eco-warning">Conexión externa no verificada. No se ha simulado ningún resultado.</p>';
    setPortalState('offline','SIN CONEXIÓN EXTERNA');
  }finally{if(button)button.disabled=false;}
}
$('[data-portal-search]')?.addEventListener('submit',e=>{e.preventDefault();void runPortalSearch(e.currentTarget,'web')});
$('[data-portal-jobs]')?.addEventListener('submit',e=>{e.preventDefault();void runPortalSearch(e.currentTarget,'jobs')});
