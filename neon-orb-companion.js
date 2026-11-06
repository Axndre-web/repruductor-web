const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function mountNeonOrbCompanion(root = document.body) {
  if (!root || document.querySelector('#neonOrbCompanion')) return;
  const panel = document.createElement('section');
  panel.id = 'neonOrbCompanion';
  panel.className = 'orb-companion';
  panel.innerHTML = `
    <button class="orb-launch" type="button" aria-expanded="false" aria-controls="orbPanel">
      <span class="orb-pulse" aria-hidden="true"></span><span>NEON ORB</span><small>ASISTENTE DEL ECOSISTEMA</small>
    </button>
    <div class="orb-panel" id="orbPanel" hidden>
      <header class="orb-head"><div><span class="orb-kicker">RUNTIME RESIDENTE</span><h2>Habla con <em>Neon Orb</em></h2><p class="orb-status" role="status">Comprobando runtime…</p></div><div class="orb-head-actions"><button class="orb-voice" type="button" aria-pressed="false" title="Activar respuestas habladas">🔊 VOZ OFF</button><button class="orb-close" type="button" aria-label="Cerrar">×</button></div></header>
      <div class="orb-capabilities"><span>Estado</span><span>Radio</span><span>Economía verificada</span><span>Oportunidades</span></div>
      <div class="orb-messages" aria-live="polite" aria-label="Conversación">
        <article class="orb-message orb-system">Soy Neon Orb, el asistente integrado de este ecosistema. Puedo explicar funciones, consultar información disponible y ayudarte a decidir próximos pasos. Las operaciones externas y económicas siguen sujetas a sus controles.</article>
      </div>
      <form class="orb-form"><label class="orb-sr" for="orbInput">Mensaje para Neon Orb</label><textarea id="orbInput" maxlength="2000" rows="2" placeholder="Pregúntame qué puedo hacer en este ecosistema…" required></textarea><button type="submit">ENVIAR ↗</button></form>
      <footer class="orb-foot">La conversación se mantiene en esta pestaña. No introduzcas contraseñas, claves privadas ni frases semilla.</footer>
    </div>`;
  root.append(panel);
  const launch = panel.querySelector('.orb-launch');
  const box = panel.querySelector('.orb-panel');
  const close = panel.querySelector('.orb-close');
  const form = panel.querySelector('.orb-form');
  const input = panel.querySelector('#orbInput');
  const messages = panel.querySelector('.orb-messages');
  const status = panel.querySelector('.orb-status');
  const voice = panel.querySelector('.orb-voice');
  let voiceEnabled = false;
  const speak = text => {
    if (!voiceEnabled || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text).slice(0, 1800));
    utterance.lang = 'es-ES';
    utterance.rate = 1;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(item => /^es(-|_)/i.test(item.lang) && /Spain|Españ/i.test(item.name + ' ' + item.lang)) || voices.find(item => /^es(-|_)/i.test(item.lang)) || null;
    window.speechSynthesis.speak(utterance);
  };
  voice.addEventListener('click', () => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      addMessage('Este navegador no ofrece síntesis de voz. Puedes seguir usando las respuestas escritas.', 'meta');
      return;
    }
    voiceEnabled = !voiceEnabled;
    voice.setAttribute('aria-pressed', String(voiceEnabled));
    voice.textContent = voiceEnabled ? '🔊 VOZ ON' : '🔊 VOZ OFF';
    voice.title = voiceEnabled ? 'Desactivar respuestas habladas' : 'Activar respuestas habladas';
    if (!voiceEnabled) window.speechSynthesis.cancel();
    else speak('Hola, soy Neon Orb. Ya puedo leer mis respuestas en voz alta.');
  });
  const session = (globalThis.crypto?.randomUUID?.() || `orb-${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 80);
  let busy = false;
  const toggle = open => {
    box.hidden = !open;
    launch.setAttribute('aria-expanded', String(open));
    if (open) input.focus();
  };
  launch.addEventListener('click', () => toggle(box.hidden));
  close.addEventListener('click', () => { toggle(false); launch.focus(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) { toggle(false); launch.focus(); } });
  function addMessage(text, kind) {
    const item = document.createElement('article');
    item.className = `orb-message orb-${kind}`;
    item.textContent = text;
    messages.append(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }
  async function refreshStatus() {
    try {
      const response = await fetch('/api/neon-orb/status', { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        if (response.status === 404) throw new Error('API_RUNTIME_NOT_FOUND');
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      const mode = data.inference?.mode || 'INFERENCIA LOCAL';
      status.textContent = `${data.identity || 'NEON_ORB'} · ${data.status || 'DISPONIBLE'} · ${mode}`;
      status.dataset.state = 'online';
      status.title = data.inference?.lastError ? `Último error de inferencia: ${data.inference.lastError}` : 'Runtime conectado';
    } catch (error) {
      const detail = String(error?.message || 'runtime_unavailable');
      status.textContent = detail === 'API_RUNTIME_NOT_FOUND'
        ? 'Servidor activo sin API de Neon Orb; reinicia con esta versión del proyecto.'
        : 'Runtime sin respuesta; comprueba el servidor.';
      status.title = detail;
      status.dataset.state = 'offline';
    }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || busy) return;
    busy = true;
    input.value = '';
    input.disabled = true;
    form.querySelector('button').disabled = true;
    addMessage(message, 'user');
    const pending = addMessage('Estoy revisando el contexto disponible…', 'pending');
    try {
      const history = [...messages.querySelectorAll('.orb-message')].slice(-10).map(node => ({
        role: node.classList.contains('orb-user') ? 'user' : (node.classList.contains('orb-assistant') ? 'assistant' : null),
        content: node.textContent || ''
      })).filter(item => item.role && item.content).slice(-8);
      if (history.at(-1)?.role === 'user' && history.at(-1)?.content === message) history.pop();
      const payload = JSON.stringify({
        message,
        history,
        session,
        context: {
          app: 'Neon Player X',
          availableAreas: ['inicio', 'reproductor multimedia', 'radio', 'Control Center', 'temas', 'arcade', 'telemetría de solo lectura'],
          safety: 'No afirmar que una acción externa se ejecutó sin verificación. No solicitar secretos.'
        }
      });
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(50000),
        body: payload
      };
      let response = await fetch('/api/neon-orb/agent/chat', requestOptions);
      // Older deployments can still answer through the native runtime, without tool use.
      if (response.status === 404) response = await fetch('/api/neon-orb/think', requestOptions);
      if (response.status === 404) response = await fetch('/api/neon-orb/chat', requestOptions);
      const result = await response.json().catch(() => ({}));
      if (response.status === 404) throw new Error('API_RUNTIME_NOT_FOUND');
      if (!response.ok || result.ok === false) {
        const detail = result.error || result.message || `HTTP ${response.status}`;
        throw new Error(detail === 'cognition_unavailable' ? 'el núcleo cognitivo no está disponible ahora' : detail);
      }
      pending.remove();
      const reply = result.answer || result.advice || result.response || result.message || result.reflection;
      if (!reply) throw new Error('el runtime respondió sin contenido; vuelve a intentarlo');
      addMessage(reply, 'assistant');
      speak(reply);
      if (Array.isArray(result.toolsUsed) && result.toolsUsed.length) {
        const completed = result.toolsUsed.filter(item => item.ok).length;
        addMessage(`Herramientas utilizadas: ${completed}/${result.toolsUsed.length}.`, 'meta');
      } else if (result.degraded) {
        addMessage('Modo local básico: el modelo de agente no está conectado; no se ejecutaron herramientas.', 'meta');
      } else if (result.proposedIntent) {
        addMessage(`Intención: ${result.proposedIntent}.`, 'meta');
      }
    } catch (error) {
      pending.remove();
      const reason = error?.name === 'TimeoutError' || error?.name === 'AbortError'
        ? 'la consulta ha tardado demasiado'
        : error?.message === 'Failed to fetch' ? 'servidor no disponible'
        : error?.message === 'API_RUNTIME_NOT_FOUND' ? 'el servidor activo no tiene la API de Neon Orb. Reinicia el servidor desde la carpeta de esta versión y comprueba el puerto indicado en la consola'
        : (error?.message || 'error de comunicación');
      addMessage(`No he podido completar la consulta: ${reason}. No se ha confirmado ninguna acción externa. Puedes volver a intentarlo.`, 'error');
    } finally {
      busy = false;
      input.disabled = false;
      form.querySelector('button').disabled = false;
      input.focus();
    }
  });
  refreshStatus();
  const statusTimer = setInterval(refreshStatus, 60000);
  window.addEventListener('pagehide', () => { clearInterval(statusTimer); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, { once: true });
}
