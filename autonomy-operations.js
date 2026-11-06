const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

export function mountAutonomyOperations(root) {
  if (!root) return;
  root.innerHTML = `
    <section class="autonomy-panel" aria-labelledby="autonomyTitle">
      <div class="autonomy-head"><div><span class="eyebrow">NEON ORB · BOUNDED AUTONOMY</span><h2 id="autonomyTitle">RED <em>Y AUDITORÍA</em></h2><p>Consultas externas acotadas, auditoría estática local y ofertas públicas. Sin ejecución remota ni solicitudes automáticas.</p></div><span id="autonomyStatus" class="autonomy-badge">SINCRONIZANDO</span></div>
      <label class="autonomy-token-label" for="autonomyToken">Token de administración local</label><input id="autonomyToken" class="autonomy-input" type="password" autocomplete="off" maxlength="256" placeholder="NEON_ADMIN_TOKEN (no se guarda)">
      <div class="autonomy-grid">
        <article><h3>Búsqueda web</h3><form id="autonomySearchForm"><input class="autonomy-input" id="autonomyQuery" maxlength="240" placeholder="Qué quieres investigar" required><button class="btn mini" type="submit">BUSCAR EN WEB</button></form><div id="autonomySearchResults" class="autonomy-results" aria-live="polite">Configura BRAVE_SEARCH_API_KEY en el entorno para habilitar el proveedor.</div></article>
        <article><h3>Auditoría de código</h3><p>Escanea archivos fuente locales con patrones estáticos. No ejecuta el código.</p><button class="btn mini" id="autonomyAudit" type="button">EJECUTAR AUDITORÍA</button><div id="autonomyAuditResults" class="autonomy-results" aria-live="polite">Pendiente de ejecución.</div></article>
        <article><h3>Ofertas de empleo</h3><input class="autonomy-input" id="autonomyJobQuery" maxlength="100" placeholder="Palabras clave (opcional)"><button class="btn mini" id="autonomyJobs" type="button">RASTREAR OFERTAS</button><div id="autonomyJobResults" class="autonomy-results" aria-live="polite">Fuentes públicas; las ofertas no son ingresos confirmados.</div></article>
      </div>
      <p class="autonomy-footnote">La clave de administración solo se mantiene en memoria de esta página. Los hallazgos requieren revisión humana; no son un certificado de seguridad.</p>
    </section>`;

  let token = '';
  const tokenInput = root.querySelector('#autonomyToken');
  const headers = () => ({ 'content-type': 'application/json', authorization: `Bearer ${token}` });
  const post = async (url, body) => {
    token = tokenInput.value.trim();
    if (!token) throw new Error('Introduce el token de administración local.');
    const response = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body), cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP_${response.status}`);
    return data;
  };
  const errorBox = (id, error) => { root.querySelector(id).textContent = error?.message || 'Operación no disponible'; };
  const statusEl = root.querySelector('#autonomyStatus');
  async function refreshStatus() {
    try {
      const r = await fetch('/api/neon-orb/autonomy/status', { cache: 'no-store' });
      const data = await r.json();
      const tasks = data.tasks || {};
      statusEl.textContent = `RED ${tasks.network?.status || 'idle'} · AUDITORÍA ${tasks.audit?.status || 'idle'} · EMPLEO ${tasks.jobs?.status || 'idle'}`.toUpperCase();
      root.querySelector('#autonomySearchResults').dataset.ready = data.capabilities?.webSearch ? 'true' : 'false';
      if (!data.capabilities?.webSearch && root.querySelector('#autonomySearchResults').textContent.startsWith('Configura')) {
        root.querySelector('#autonomySearchResults').textContent = 'Búsqueda deshabilitada: falta BRAVE_SEARCH_API_KEY en el entorno.';
      }
    } catch { statusEl.textContent = 'ESTADO NO DISPONIBLE'; }
  }
  root.querySelector('#autonomySearchForm').addEventListener('submit', async event => {
    event.preventDefault(); const output = root.querySelector('#autonomySearchResults'); output.textContent = 'Buscando…';
    try {
      const data = await post('/api/neon-orb/autonomy/search', { query: root.querySelector('#autonomyQuery').value, count: 8 });
      output.innerHTML = data.results.length ? data.results.map(item => `<div class="autonomy-result"><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a><p>${esc(item.description)}</p><small>${esc(item.source)}</small></div>`).join('') : 'Sin resultados.';
    } catch (error) { errorBox('#autonomySearchResults', error); }
    refreshStatus();
  });
  root.querySelector('#autonomyAudit').addEventListener('click', async () => {
    const output = root.querySelector('#autonomyAuditResults'); output.textContent = 'Analizando archivos locales…';
    try {
      const data = await post('/api/neon-orb/autonomy/audit', {});
      output.innerHTML = `<p><b>${data.filesScanned}</b> archivos · <b>${data.findingsCount}</b> hallazgos</p>` + (data.findings.length ? data.findings.slice(0, 30).map(f => `<div class="autonomy-result"><b>${esc(f.severity.toUpperCase())} · ${esc(f.rule)}</b><small>${esc(f.file)}:${f.line}</small><p>${esc(f.message)}</p></div>`).join('') : '<p>No se detectaron patrones de las reglas configuradas.</p>') + `<small>Se muestran hasta 30 de ${data.findingsCount} hallazgos.</small>`;
    } catch (error) { errorBox('#autonomyAuditResults', error); }
    refreshStatus();
  });
  root.querySelector('#autonomyJobs').addEventListener('click', async () => {
    const output = root.querySelector('#autonomyJobResults'); output.textContent = 'Consultando fuentes públicas…';
    try {
      const data = await post('/api/neon-orb/autonomy/jobs', { query: root.querySelector('#autonomyJobQuery').value, remoteOnly: true, limit: 12 });
      output.innerHTML = `<p><b>${data.count}</b> ofertas · consulta ${esc(data.queriedAt || '')}</p>` + (data.jobs.length ? data.jobs.map(job => `<div class="autonomy-result"><a href="${esc(job.listingUrl)}" target="_blank" rel="noopener noreferrer">${esc(job.title)}</a><p>${esc(job.company)} · ${esc(job.location)}</p><small>${esc(job.sourceName)} · remuneración no verificada</small></div>`).join('') : '<p>No hay ofertas coincidentes en este momento.</p>');
    } catch (error) { errorBox('#autonomyJobResults', error); }
    refreshStatus();
  });
  refreshStatus();
  setInterval(refreshStatus, 5000);
}
