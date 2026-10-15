/**
 * Neon Orb native runtime facade.
 *
 * This is the in-process identity/telemetry boundary for Neon Orb. It does not
 * fabricate cognition, earnings, or completed work: real activity must be
 * reported by the existing work bridge and economic execution pipeline.
 */
import { randomUUID } from "node:crypto";

const bootedAt = new Date().toISOString();
const runtimeId = randomUUID();
const counters = {
  telemetryReads: 0,
  workEvents: 0,
  bridgeConnections: 0,
  lastWorkAt: null,
  lastWorkId: null,
  lastExternalNode: null
};
const recentEvents = [];
const MAX_EVENTS = 64;

function record(type, details = {}) {
  const event = {
    id: randomUUID(),
    at: new Date().toISOString(),
    type,
    details: sanitize(details)
  };
  recentEvents.unshift(event);
  if (recentEvents.length > MAX_EVENTS) recentEvents.length = MAX_EVENTS;
  return event;
}

function sanitize(value, depth = 0) {
  if (depth > 3) return "[omitted]";
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    if (typeof value === "string") return value.slice(0, 240);
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    return value;
  }
  if (Array.isArray(value)) return value.slice(0, 12).map(v => sanitize(v, depth + 1));
  if (typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value).slice(0, 16)) {
      if (/secret|token|password|private.?key|authorization/i.test(key)) continue;
      out[key] = sanitize(val, depth + 1);
    }
    return out;
  }
  return String(value).slice(0, 120);
}

export const neonOrbCore = Object.freeze({
  identity: "NEON_ORB",
  mode: "native-in-process",
  bootedAt,
  runtimeId,

  telemetry() {
    counters.telemetryReads += 1;
    return {
      identity: this.identity,
      mode: this.mode,
      status: "online",
      runtimeId,
      bootedAt,
      uptimeSeconds: Math.floor(process.uptime()),
      counters: { ...counters },
      recentEvents: recentEvents.slice(0, 12)
    };
  },

  reportWork({ workId, amount, currency, metadata } = {}) {
    counters.workEvents += 1;
    counters.lastWorkAt = new Date().toISOString();
    counters.lastWorkId = String(workId || `work-${counters.workEvents}`).slice(0, 120);
    return record("work-reported", {
      workId: counters.lastWorkId,
      amount: Number.isFinite(Number(amount)) ? Number(amount) : 0,
      currency: String(currency || "CREDITS").slice(0, 24),
      metadata: metadata || {}
    });
  },

  reportBridgeConnection({ node, outcome = "connected" } = {}) {
    counters.bridgeConnections += 1;
    counters.lastExternalNode = String(node || "unspecified").slice(0, 120);
    return record("bridge-connection", {
      node: counters.lastExternalNode,
      outcome: String(outcome).slice(0, 40)
    });
  },

  record
});
