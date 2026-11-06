import test from 'node:test';
import assert from 'node:assert/strict';
import { getRadioControlState, requestRadioControl, resetRadioControlStateForTests } from '../server/radio-control.js';

test('radio control creates a shared play intent for the integrated player', () => {
  resetRadioControlStateForTests();
  const state = requestRadioControl({ action:'play', station:5, requestedBy:'NEON_ORB_AGENT' });
  assert.equal(state.action, 'play'); assert.equal(state.station, 5); assert.equal(state.requestedBy, 'NEON_ORB_AGENT');
  assert.ok(state.intentId > 0); assert.equal(getRadioControlState().intentId, state.intentId);
});
test('radio control rejects unsupported actions and invalid station indices', () => {
  assert.throws(() => requestRadioControl({ action:'url', station:0 }), /RADIO_ACTION_NOT_ALLOWED/);
  assert.throws(() => requestRadioControl({ action:'play', station:12 }), /RADIO_STATION_INVALID/);
  assert.throws(() => requestRadioControl({ action:'pause', station:-1 }), /RADIO_STATION_INVALID/);
});
test('radio intent explicitly records browser autoplay fallback', () => {
  const state = requestRadioControl({ action:'play', station:0 });
  assert.match(state.mode, /BROWSER_MEDIA/); assert.match(state.note, /navegador/);
});
