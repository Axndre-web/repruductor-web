import { neonOrbGovernor } from './economic-governor.js';
import { realEconomicRegistry } from './real-economic-registry.js';

const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * A cash-basis view of the evidence already stored by Neon Orb.
 * Pending opportunities and pending settlements are deliberately excluded from
 * realized revenue. Only verified registry assets count as realized revenue.
 */
export function calculateEconomicAccounting({ governor = neonOrbGovernor.snapshot(), registry = realEconomicRegistry.snapshot(), at = new Date().toISOString() } = {}) {
  const assets = Array.isArray(registry.assets) ? registry.assets : [];
  const executions = Array.isArray(governor.executions) ? governor.executions : [];
  const verifiedRevenueEUR = round(assets
    .filter(asset => asset.verification?.verified === true && String(asset.currency || 'EUR').toUpperCase() === 'EUR')
    .reduce((sum, asset) => sum + n(asset.amountEUR), 0));

  // A successful provider acceptance is a confirmed cost commitment even while
  // its deliverable/payment settlement is pending. Failed calls are not booked.
  const confirmedSpendEUR = round(executions
    .filter(item => ['EXECUTED_PENDING_SETTLEMENT', 'EXECUTED', 'SETTLED_VERIFIED'].includes(item.status))
    .reduce((sum, item) => sum + n(item.spendEUR), 0));
  const pendingSettlementCount = executions.filter(item => item.status === 'EXECUTED_PENDING_SETTLEMENT').length;
  const pendingOpportunityCount = (governor.opportunities || []).filter(item => item.realityVerified === true && n(item.netProfitEUR) > 0).length;

  return {
    identity: 'NEON_ORB',
    basis: 'EVIDENCE_BACKED_CASH_BASIS',
    currency: 'EUR',
    calculatedAt: at,
    verifiedRevenueEUR,
    confirmedSpendEUR,
    realizedNetEUR: round(verifiedRevenueEUR - confirmedSpendEUR),
    pendingSettlementCount,
    verifiedAssetCount: assets.filter(asset => asset.verification?.verified === true).length,
    positiveVerifiedOpportunityCount: pendingOpportunityCount,
    excludedFromRealizedRevenue: ['unverified opportunities', 'pending settlements', 'internal credits', 'unconfirmed provider responses'],
    executionMode: governor.execution || 'UNKNOWN',
    paused: Boolean(governor.paused)
  };
}
