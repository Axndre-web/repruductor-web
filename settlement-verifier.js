import { assertAllowedForExecution } from './provider-security.js';

const text = value => String(value ?? '').trim();
const amount = value => Number.isFinite(Number(value)) ? Number(value) : NaN;

/** Independently verifies provider-side payment settlement; work delivery alone is not payment proof. */
export async function verifyProviderSettlement({ url, provider, providerRef, settlementRef, amountEUR, currency = 'EUR' } = {}, { timeoutMs = 8000 } = {}) {
  if (!url) return { verified: false, code: 'SETTLEMENT_VERIFICATION_URL_REQUIRED' };
  if (!text(provider) || !text(providerRef) || !text(settlementRef)) return { verified: false, code: 'SETTLEMENT_REFERENCES_REQUIRED' };
  const expectedAmount = amount(amountEUR);
  if (!(expectedAmount > 0) || text(currency).toUpperCase() !== 'EUR') return { verified: false, code: 'SETTLEMENT_AMOUNT_OR_CURRENCY_INVALID' };
  const target = assertAllowedForExecution(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
  try {
    const response = await fetch(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ provider: text(provider), providerRef: text(providerRef), settlementRef: text(settlementRef), amountEUR: expectedAmount, currency: 'EUR' }),
      signal: controller.signal
    });
    const attestation = await response.json().catch(() => ({}));
    const settledStatus = ['SETTLED', 'COMPLETED', 'PAID', 'CONFIRMED'].includes(text(attestation.status).toUpperCase());
    const verified = response.ok && attestation.verified === true &&
      text(attestation.provider) === text(provider) &&
      text(attestation.providerRef) === text(providerRef) &&
      text(attestation.settlementRef) === text(settlementRef) &&
      amount(attestation.amountEUR) === expectedAmount &&
      text(attestation.currency || 'EUR').toUpperCase() === 'EUR' &&
      (settledStatus || attestation.settled === true);
    return { verified, code: verified ? 'PROVIDER_SETTLEMENT_VERIFIED' : 'PROVIDER_SETTLEMENT_ATTESTATION_REJECTED', attestation };
  } finally {
    clearTimeout(timer);
  }
}
