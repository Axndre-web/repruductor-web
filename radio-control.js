/** Shared radio intent bus between NEON ORB and the integrated Player X browser UI. */
import { randomBytes } from 'node:crypto';
const STATION_COUNT = 12;
const INSTANCE_ID = `${Date.now()}-${randomBytes(5).toString('hex')}`;
let sequence = 0;
let state = {
  instanceId: INSTANCE_ID, mode: 'BROWSER_MEDIA_WITH_USER_GESTURE_FALLBACK',
  action: 'idle', station: 0, intentId: 0, requestedAt: null,
  requestedBy: 'system', note: 'La radio permanece integrada en la interfaz principal.'
};
export function requestRadioControl({ action, station = state.station, requestedBy = 'NEON_ORB' } = {}) {
  const normalized = String(action || '').toLowerCase();
  const index = Number(station);
  if (!['play', 'pause'].includes(normalized)) throw new Error('RADIO_ACTION_NOT_ALLOWED');
  if (!Number.isInteger(index) || index < 0 || index >= STATION_COUNT) throw new Error('RADIO_STATION_INVALID');
  state = {
    instanceId: INSTANCE_ID, mode: 'BROWSER_MEDIA_WITH_USER_GESTURE_FALLBACK', action: normalized, station: index,
    intentId: ++sequence, requestedAt: new Date().toISOString(),
    requestedBy: String(requestedBy || 'NEON_ORB').slice(0, 40),
    note: normalized === 'play'
      ? 'NEON ORB ha solicitado reproducir esta emisora en el reproductor integrado. El navegador puede exigir un clic del usuario.'
      : 'NEON ORB ha solicitado pausar la radio integrada.'
  };
  return getRadioControlState();
}
export function getRadioControlState() { return { ok: true, ...state, stationCount: STATION_COUNT }; }
export function resetRadioControlStateForTests() { sequence = 0; state = { instanceId:INSTANCE_ID, mode:'BROWSER_MEDIA_WITH_USER_GESTURE_FALLBACK', action:'idle', station:0, intentId:0, requestedAt:null, requestedBy:'system', note:'La radio permanece integrada en la interfaz principal.' }; }
