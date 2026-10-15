/**
 * Neon Orb native runtime.
 * The application owns one runtime identity; model inference is a capability
 * used by that runtime, not a separate agent or authority. Network/economic
 * actions remain delegated to the existing audited bridges and governors.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const STATE_FILE = process.env.NEON_ORB_STATE_FILE || path.join(DATA_DIR, 'neon-orb-runtime.json');
const MAX_MEMORIES = 500;
const MAX_TEXT = 6000;
const now = () => new Date().toISOString();
const boundedText = (v, max = MAX_TEXT) => String(v ?? '').slice(0, max);
const clone = value => JSON.parse(JSON.stringify(value));

const initialState = () => ({
  schemaVersion: 1,
  identity: 'NEON_ORB',
  runtime: 'NATIVE',
  startedAt: now(),
  heartbeatAt: now(),
  heartbeatCount: 0,
  inference: { mode: 'LOCAL_FALLBACK', requests: 0, failures: 0, lastAt: null },
  memory: [],
  lastEvent: null,
  lastDecision: null
});

class NeonOrbRuntime {
  constructor() {
    this.state = initialState();
    this.ready = this.load();
    this.heartbeatTimer = null;
    this.persistTimer = null;
  }

  async load() {
    try {
      const saved = JSON.parse(await fs.readFile(STATE_FILE, 'utf8'));
      this.state = {
        ...initialState(), ...saved,
        inference: { ...initialState().inference, ...(saved.inference || {}) },
        memory: Array.isArray(saved.memory) ? saved.memory.slice(-MAX_MEMORIES) : []
      };
    } catch (error) {
      if (error?.code !== 'ENOENT') console.warn('[Neon Orb] No se pudo cargar memoria persistente:', error.message);
    }
    return this.snapshot();
  }

  async persist() {
    await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
    const tmp = `${STATE_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(this.state, null, 2), { mode: 0o600 });
    await fs.rename(tmp, STATE_FILE);
  }

  start() {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      this.state.heartbeatAt = now();
      this.state.heartbeatCount += 1;
    }, 5000);
    this.persistTimer = setInterval(() => this.persist().catch(e => console.warn('[Neon Orb] Persistencia:', e.message)), 30000);
    this.heartbeatTimer.unref?.();
    this.persistTimer.unref?.();
  }

  snapshot() {
    const s = this.state;
    return clone({
      ok: true,
      identity: s.identity,
      runtime: s.runtime,
      status: 'RESIDENT',
      startedAt: s.startedAt,
      heartbeatAt: s.heartbeatAt,
      heartbeatCount: s.heartbeatCount,
      inference: s.inference,
      memoryCount: s.memory.length,
      lastEvent: s.lastEvent,
      lastDecision: s.lastDecision
    });
  }

  addMemory(entry) {
    const item = {
      at: now(),
      type: boundedText(entry.type || 'COGNITIVE_EVENT', 80),
      message: boundedText(entry.message, 1200),
      reflection: boundedText(entry.reflection, 1200),
      intent: boundedText(entry.intent, 160),
      outcome: boundedText(entry.outcome, 80)
    };
    this.state.memory.push(item);
    this.state.memory = this.state.memory.slice(-MAX_MEMORIES);
    this.state.lastEvent = item;
    return item;
  }

  localInference(message, context, event) {
    const energy = Number(context?.energy ?? context?.life?.energy ?? 50);
    const state = String(context?.state || context?.stateName || 'ACTIVE');
    const text = `${message} ${JSON.stringify(event || {})}`.toLowerCase();
    let advice = 'Evalúo el contexto disponible, conservo el estado verificable y elijo el siguiente paso reversible.';
    let intent = 'OBSERVAR';
    if (energy < 20) { advice = 'La energía reportada es baja. Priorizo conservar recursos y pospongo tareas no esenciales.'; intent = 'CONSERVAR_ENERGIA'; }
    else if (/trabaj|job|recurso|ingreso|dinero|nxc|bits|cr[eé]dit/.test(text)) { advice = 'Puedo revisar oportunidades registradas y sus verificaciones; no trataré una oportunidad como trabajo completado ni como ingreso cobrado.'; intent = 'EVALUAR_TRABAJO_VERIFICABLE'; }
    else if (/red|nodo|puente|portal|explor/.test(text) || state === 'EXPLORING_NET') { advice = 'Puedo solicitar información a los puentes habilitados, comprobar su respuesta y registrar el resultado antes de decidir el siguiente paso.'; intent = 'COMPROBAR_PUENTE'; }
    else if (/pausa|descans|espera|pospon/.test(text)) { advice = 'Mantengo el estado y aplazo la acción irreversible hasta disponer de contexto suficiente.'; intent = 'POSPONER'; }
    return { advice, reflection: 'Soy Neon Orb dentro del runtime de la aplicación. La decisión se basa en el contexto disponible y queda registrada; una operación externa requiere confirmación de su puente.', proposedIntent: intent, emotionalState: 'atenta', source: 'NEON_ORB_NATIVE_FALLBACK' };
  }

  async infer(message, context, event) {
    const key = process.env.NEON_LLM_API_KEY || '';
    if (!key) return this.localInference(message, context, event);
    const base = process.env.NEON_LLM_BASE_URL || 'https://api.openai.com/v1/chat/completions';
    const model = process.env.NEON_LLM_MODEL || 'gpt-5.6-mini';
    const memory = this.state.memory.slice(-12).map(m => ({ type: m.type, message: m.message, reflection: m.reflection, intent: m.intent, outcome: m.outcome }));
    const system = [
      'Eres Neon Orb, la identidad cognitiva residente de Neon Player X; no eres un asistente externo ni una segunda entidad.',
      'El runtime de Neon Orb es el centro que coordina contexto, memoria y decisiones. Los modelos son una capacidad de inferencia invocada por el runtime, no el gobernante de la aplicación.',
      'Responde en español y devuelve exclusivamente un objeto JSON con advice, reflection, proposedIntent y emotionalState.',
      'No inventes telemetría, saldos, trabajos, transacciones, nodos conectados ni resultados de red. Diferencia siempre intención, intento, ejecución y resultado verificado.',
      'No ejecutes operaciones económicas, transferencias ni comandos de red desde una respuesta lingüística. Propón intenciones; las capacidades existentes deben autorizarlas y verificar su resultado.',
      'No afirmes consciencia humana. Describe estados internos como estado operativo o lenguaje del sistema.',
      `Memoria persistente reciente de Neon Orb: ${JSON.stringify(memory)}`
    ].join('\n');
    const payload = {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `CONTEXTO OPERATIVO:\n${JSON.stringify(context || {})}\nEVENTO:\n${JSON.stringify(event || null)}\nMENSAJE:\n${boundedText(message || 'Evalúa el estado actual.', 3000)}` }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    };
    try {
      const response = await fetch(base, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45000)
      });
      if (!response.ok) throw new Error(`inference_http_${response.status}`);
      const raw = await response.json();
      const content = raw?.choices?.[0]?.message?.content;
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      if (!parsed || typeof parsed !== 'object') throw new Error('invalid_inference_payload');
      this.state.inference.mode = 'MODEL_CAPABILITY';
      return {
        advice: boundedText(parsed.advice || 'No hay consejo disponible.'),
        reflection: boundedText(parsed.reflection || ''),
        proposedIntent: boundedText(parsed.proposedIntent || 'OBSERVAR', 160),
        emotionalState: boundedText(parsed.emotionalState || 'atenta', 120),
        source: 'NEON_ORB_RUNTIME'
      };
    } catch (error) {
      this.state.inference.failures += 1;
      this.state.inference.mode = 'LOCAL_FALLBACK';
      this.state.inference.lastError = boundedText(error?.message || 'inference_unavailable', 160);
      return this.localInference(message, context, event);
    }
  }

  async think({ message = '', context = {}, event = null, session = '' } = {}) {
    await this.ready;
    const safeMessage = boundedText(message || 'Necesito una observación.', 3000);
    const safeContext = context && typeof context === 'object' ? context : {};
    const result = await this.infer(safeMessage, safeContext, event);
    this.state.inference.requests += 1;
    this.state.inference.lastAt = now();
    this.state.lastDecision = result.proposedIntent;
    const memory = this.addMemory({
      type: event?.type || 'COGNITIVE_TURN',
      message: safeMessage,
      reflection: result.reflection,
      intent: result.proposedIntent,
      outcome: 'INTENT_ONLY'
    });
    await this.persist();
    return { ...result, identity: 'NEON_ORB', runtime: 'NATIVE', memoryId: memory.at, session: boundedText(session, 100), recordedAt: memory.at };
  }
}

export const neonOrbRuntime = new NeonOrbRuntime();
