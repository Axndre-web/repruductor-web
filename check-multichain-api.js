const base = (process.env.NEON_API_CHECK_URL || `http://127.0.0.1:${process.env.PORT || 3000}`).replace(/\/$/, '');
for (const route of ['/healthz', '/api/neon-orb/wallet/multichain/healthz']) {
  const response = await fetch(`${base}${route}`, { signal: AbortSignal.timeout(5000), headers: { accept: 'application/json' } });
  const body = await response.json();
  if (!response.ok || body?.ok === false) throw new Error(`${route} failed with HTTP ${response.status}`);
  console.log(`${route}: OK`);
}
