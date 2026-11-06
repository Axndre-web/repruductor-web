import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATE_FILE = process.env.NEON_CONNECTION_STATE_FILE || path.join(ROOT, 'data', 'neon-orb-connections.json');
const now = () => new Date().toISOString();
const envSet = key => Boolean(String(process.env[key] || '').trim());
const envTrue = key => String(process.env[key] || '').trim().toLowerCase() === 'true';

// Capabilities are deliberately bounded. This module never reads or returns secret values.
const PROVIDERS = [
  { id: 'solana-rpc', name: 'Solana RPC', env: ['SOLANA_RPC_ENDPOINT'], capability: 'READ_CHAIN_STATE', risk: 'READ_ONLY', auth: 'RPC endpoint; verify network and provider terms' },
  { id: 'solana-wallet', name: 'Solana wallet', env: ['SOLANA_WALLET_ADDRESS'], capability: 'OBSERVE_PUBLIC_WALLET', risk: 'READ_ONLY', auth: 'Public address only; signing requires a wallet adapter and explicit transaction confirmation' },
  { id: 'paypal', name: 'PayPal', env: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'], capability: 'PAYMENTS_READ_VERIFY', risk: 'FINANCIAL', auth: 'Provider OAuth/API approval and webhook verification required' },
  { id: 'stripe', name: 'Stripe', env: ['STRIPE_SECRET_KEY'], capability: 'PAYMENTS_READ_VERIFY', risk: 'FINANCIAL', auth: 'Restricted API key and verified webhooks required' },
  { id: 'ai-inference', name: 'AI inference provider', env: ['NEON_LLM_API_KEY'], capability: 'INFERENCE', risk: 'DATA_TRANSFER', auth: 'Configured endpoint and API credential required; send only minimized context' },
  { id: 'work-feeds', name: 'External work feeds', env: ['NEON_OPPORTUNITY_FEEDS'], capability: 'DISCOVER_PUBLIC_LISTINGS', risk: 'READ_ONLY', auth: 'Public listings only; no auto-applications or claimed revenue' }
];

const fresh = () => ({ schemaVersion: 1, updatedAt: now(), requests: [], events: [] });
let state = fresh();
let ready;
async function load() {
  try {
    const saved = JSON.parse(await fs.readFile(STATE_FILE, 'utf8'));
    state = { ...fresh(), ...saved, requests: Array.isArray(saved.requests) ? saved.requests : [], events: Array.isArray(saved.events) ? saved.events : [] };
  } catch (e) { if (e?.code !== 'ENOENT') throw e; }
  return state;
}
async function persist() {
  state.updatedAt = now();
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  const tmp = `${STATE_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), { mode: 0o600 });
  await fs.rename(tmp, STATE_FILE);
}
function event(type, details = {}) {
  state.events.unshift({ id: randomUUID(), at: now(), type, details });
  state.events = state.events.slice(0, 250);
}
function publicProvider(p) {
  const configuredKeys = p.env.filter(envSet);
  return { id: p.id, name: p.name, capability: p.capability, risk: p.risk, configured: configuredKeys.length === p.env.length,
    missingConfiguration: p.env.filter(key => !envSet(key)), auth: p.auth };
}

export const connectionCoordinator = {
  async ready() { ready ||= load(); await ready; return this.snapshot(); },
  async sync() {
    await this.ready();
    const providers = PROVIDERS.map(publicProvider);
    for (const provider of providers) {
      // One durable request per provider until a future explicit re-open action is implemented.
      // A configured credential is not proof that the provider accepted it or granted scopes.
      const existing = state.requests.find(r => r.providerId === provider.id);
      if (!existing) {
        state.requests.unshift({ id: randomUUID(), providerId: provider.id, providerName: provider.name,
          capability: provider.capability, risk: provider.risk, status: 'PENDING', createdAt: now(), updatedAt: now(),
          reason: provider.configured ? 'EXTERNAL_AUTHORIZATION_OR_HANDSHAKE_REQUIRED' : 'CONFIGURATION_REQUIRED',
          missingConfiguration: provider.missingConfiguration,
          note: provider.auth, localApproval: false, providerVerified: false });
        event('PERMISSION_REQUEST_CREATED', { providerId: provider.id, capability: provider.capability, risk: provider.risk, configured: provider.configured });
      }
    }
    state.requests = state.requests.slice(0, 200);
    await persist();
    return this.snapshot();
  },
  async decide(id, decision, actor = 'admin') {
    await this.ready();
    if (!['approve', 'deny'].includes(decision)) throw new Error('invalid_decision');
    const request = state.requests.find(r => r.id === id);
    if (!request) return null;
    if (request.status !== 'PENDING') throw new Error('request_not_pending');
    request.status = decision === 'approve' ? 'APPROVED_LOCAL' : 'DENIED';
    request.localApproval = decision === 'approve';
    request.updatedAt = now();
    request.decidedBy = String(actor).slice(0, 80);
    // A local decision is not proof of provider OAuth, wallet ownership, or transaction signature.
    request.providerVerified = false;
    request.note = decision === 'approve'
      ? 'Aprobación local registrada. La conexión real aún requiere autenticación del proveedor; cualquier firma financiera debe confirmarse en el wallet.'
      : 'Solicitud denegada localmente.';
    event('PERMISSION_REQUEST_DECIDED', { requestId: id, providerId: request.providerId, decision, actor: request.decidedBy });
    await persist();
    return structuredClone(request);
  },
  snapshot() {
    return structuredClone({ ok: true, identity: 'NEON_ORB', updatedAt: state.updatedAt,
      providers: PROVIDERS.map(publicProvider), requests: state.requests,
      events: state.events.slice(0, 50),
      policy: { secretsExposed: false, automaticAccountCreation: false, automaticFinancialSigning: false,
        localApprovalIsProviderAuthorization: false, externalConnectionVerifiedOnlyAfterProviderHandshake: true } });
  }
};
