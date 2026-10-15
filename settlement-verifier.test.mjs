import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyProviderSettlement } from '../server/settlement-verifier.js';

const originalFetch = globalThis.fetch;

test('provider settlement needs an exact provider-side paid attestation', async () => {
  process.env.NEON_ALLOWED_PROVIDER_HOSTS = 'settlement.example.test';
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    return new Response(JSON.stringify({
      verified: true, status: 'SETTLED', provider: request.provider,
      providerRef: request.providerRef, settlementRef: request.settlementRef,
      amountEUR: request.amountEUR, currency: request.currency
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const result = await verifyProviderSettlement({
    url: 'https://settlement.example.test/verify', provider: 'provider-a',
    providerRef: 'payment-123', settlementRef: 'settlement-123', amountEUR: 12.5, currency: 'EUR'
  });
  assert.equal(result.verified, true);
  assert.equal(result.code, 'PROVIDER_SETTLEMENT_VERIFIED');
});

test('provider settlement rejects a mismatched amount', async () => {
  process.env.NEON_ALLOWED_PROVIDER_HOSTS = 'settlement.example.test';
  globalThis.fetch = async () => new Response(JSON.stringify({
    verified: true, status: 'SETTLED', provider: 'provider-a', providerRef: 'payment-123',
    settlementRef: 'settlement-123', amountEUR: 999, currency: 'EUR'
  }), { status: 200, headers: { 'content-type': 'application/json' } });
  const result = await verifyProviderSettlement({
    url: 'https://settlement.example.test/verify', provider: 'provider-a',
    providerRef: 'payment-123', settlementRef: 'settlement-123', amountEUR: 12.5, currency: 'EUR'
  });
  assert.equal(result.verified, false);
  assert.equal(result.code, 'PROVIDER_SETTLEMENT_ATTESTATION_REJECTED');
});

test.after(() => { globalThis.fetch = originalFetch; delete process.env.NEON_ALLOWED_PROVIDER_HOSTS; });
