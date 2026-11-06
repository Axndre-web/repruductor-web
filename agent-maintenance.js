/**
 * NEON ORB autonomous technical-care loop.
 * Runs a bounded maintenance/research session using the existing private agent.
 * One source-file change maximum per cycle; applyProjectFile still enforces
 * path allowlists, private-file exclusion, atomic backups, syntax checks and
 * disposable full-suite rollback. No arbitrary shell or financial operations.
 */
import { runNeonAgent, getAgentStatus } from './agent-runtime.js';
import { neonOrbRuntime } from '../core/neon-orb-runtime.js';

const DAY = 24 * 60 * 60 * 1000;
const intervalMs = () => Math.max(6 * 60 * 60 * 1000, Math.min(7 * DAY, Number(process.env.NEON_AGENT_MAINTENANCE_INTERVAL_MS || DAY)));
const enabled = () => String(process.env.NEON_AGENT_MAINTENANCE_ENABLED ?? 'true').toLowerCase() !== 'false';
let timer = null;
let initialTimer = null;
let inFlight = null;
const state = { enabled: enabled(), active: false, startedAt: null, lastRunAt: null, nextRunAt: null, runs: 0, changesApplied: 0, lastStatus: 'WAITING_FOR_FIRST_CYCLE', lastSummary: null, lastError: null };

export function agentMaintenanceStatus() {
  return { ...structuredClone(state), enabled: enabled(), intervalMs: intervalMs(), model: getAgentStatus(), policy: { maxSourceChangesPerCycle: 1, backupBeforeWrite: true, fullFixedTestSuiteBeforeCommit: true, automaticRollbackOnFailure: true, privateCredentialsReadableByModel: false, arbitraryShell: false, transactionSigningOrBroadcasting: false, moneyMovement: false, jobApplications: false } };
}

export async function runAgentMaintenanceCycle({ force = false } = {}) {
  if (!enabled() && !force) return agentMaintenanceStatus();
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const at = new Date().toISOString();
    state.lastRunAt = at;
    state.lastStatus = 'RUNNING';
    state.lastError = null;
    try {
      await neonOrbRuntime.ready;
      const result = await runNeonAgent({
        autonomousMaintenance: true,
        context: { task: 'RESIDENT_TECHNICAL_MAINTENANCE', cadence: 'daily', maxSourceChanges: 1 },
        message: [
          'Ejecuta tu ciclo autónomo de mantenimiento técnico de NEON PLAYER X.',
          '1) Audita el código local y revisa la arquitectura por capas; conserva la interfaz pública y todos los módulos existentes.',
          '2) Investiga documentación pública o soluciones GitHub solo si ayudan a resolver un hallazgo concreto.',
          '3) Comprueba pruebas y coherencia de los subsistemas; distingue hechos, hipótesis y servicios no configurados.',
          '4) Si encuentras una mejora pequeña, inequívoca, compatible y de bajo riesgo, aplica como máximo UN archivo mediante apply_project_file. La herramienta hace backup, pruebas completas y rollback automático.',
          '5) Si el cambio es amplio, ambiguo, requiere secretos, dependencias, despliegue, gasto, firma, transferencia, permisos o acción externa irreversible, NO lo ejecutes: guarda una propuesta técnica aislada y explica el bloqueo.',
          '6) No leas, solicites, imprimas ni copies credenciales, .env, semillas o claves privadas. Las integraciones pueden usar credenciales desde el servidor sin exponerlas al modelo. Las claves públicas y direcciones públicas no son secretos.',
          'No inventes conexiones activas, ingresos, resultados de pruebas ni beneficios. No cambies la interfaz principal ni ocultes módulos funcionales.',
          'Devuelve un resumen breve en español con auditoría, hallazgos, cambios realmente aplicados, pruebas y tareas pendientes.'
        ].join('\n')
      });
      state.runs += 1;
      if (result.appliedChanges) state.changesApplied += Number(result.appliedChangeCount || 1);
      state.lastStatus = result.degraded ? 'DEGRADED' : (result.ok ? (result.appliedChanges ? 'CHANGE_APPLIED_AND_TESTED' : 'CYCLE_COMPLETED') : 'FAILED');
      state.lastSummary = String(result.answer || '').slice(0, 4000);
      neonOrbRuntime.addMemory({ type: 'AUTONOMOUS_TECHNICAL_MAINTENANCE', message: `Ciclo técnico ${state.lastStatus}; cambios aplicados=${result.appliedChangeCount || 0}.`, reflection: state.lastSummary || 'Sin resumen del proveedor.', intent: 'MAINTAIN_AND_IMPROVE_ECOSYSTEM', outcome: state.lastStatus });
      return agentMaintenanceStatus();
    } catch (error) {
      state.lastStatus = error?.message === 'AGENT_PROVIDER_NOT_CONFIGURED' ? 'WAITING_FOR_LOCAL_MODEL' : 'DEGRADED';
      state.lastError = String(error?.message || 'AGENT_MAINTENANCE_FAILED').slice(0, 180);
      neonOrbRuntime.addMemory({ type: 'AUTONOMOUS_TECHNICAL_MAINTENANCE', message: `Ciclo técnico detenido: ${state.lastError}`, reflection: 'No se afirmó que se ejecutaran herramientas ni cambios.', intent: 'MAINTAIN_AND_IMPROVE_ECOSYSTEM', outcome: 'DEGRADED' });
      return agentMaintenanceStatus();
    }
  })();
  try { return await inFlight; } finally { inFlight = null; }
}

export function startAgentMaintenance() {
  if (!enabled()) { state.active = false; state.lastStatus = 'DISABLED_BY_CONFIGURATION'; return agentMaintenanceStatus(); }
  if (timer) return agentMaintenanceStatus();
  state.active = true;
  state.startedAt = new Date().toISOString();
  state.nextRunAt = new Date(Date.now() + 120000).toISOString();
  initialTimer = setTimeout(() => { initialTimer = null; void runAgentMaintenanceCycle().finally(scheduleNext); }, 120000);
  initialTimer.unref?.();
  function scheduleNext() {
    if (!state.active || timer) return;
    state.nextRunAt = new Date(Date.now() + intervalMs()).toISOString();
    timer = setTimeout(() => { timer = null; void runAgentMaintenanceCycle().finally(scheduleNext); }, intervalMs());
    timer.unref?.();
  }
  return agentMaintenanceStatus();
}

export function stopAgentMaintenance() {
  if (initialTimer) clearTimeout(initialTimer);
  if (timer) clearTimeout(timer);
  initialTimer = timer = null;
  state.active = false;
  state.nextRunAt = null;
  return agentMaintenanceStatus();
}
