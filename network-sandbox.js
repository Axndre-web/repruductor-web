/** Bounded outbound network layer. HTTPS only, exact host allowlist, no redirects, bounded body/time. */
import dns from 'node:dns/promises';
import net from 'node:net';

const ALLOWED_HOSTS = new Set([
  'api.duckduckgo.com',
  'remotive.com',
  'www.remotive.com',
  'www.arbeitnow.com',
  'arbeitnow.com',
  'api.github.com'
]);
const MAX_RESPONSE_BYTES = 1_000_000;
const DEFAULT_TIMEOUT_MS = 8000;
const privateIPv4 = ip => {
  const p = ip.split('.').map(Number);
  return p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255) ||
    p[0] === 0 || p[0] === 10 || p[0] === 127 || p[0] >= 224 ||
    (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127);
};
const privateIPv6 = ip => {
  const s = ip.toLowerCase();
  return s === '::' || s === '::1' || s.startsWith('fc') || s.startsWith('fd') || s.startsWith('fe80:') || s.startsWith('::ffff:127.') || s.startsWith('::ffff:10.') || s.startsWith('::ffff:192.168.');
};
export async function assertPublicAllowedUrl(raw) {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) throw new Error('NETWORK_DESTINATION_NOT_ALLOWED');
  if (url.port && url.port !== '443') throw new Error('NETWORK_PORT_NOT_ALLOWED');
  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => net.isIP(address) === 4 ? privateIPv4(address) : privateIPv6(address))) throw new Error('NETWORK_PRIVATE_ADDRESS_BLOCKED');
  return url;
}
export async function boundedFetchJson(raw, { timeoutMs = DEFAULT_TIMEOUT_MS, maxBytes = MAX_RESPONSE_BYTES } = {}) {
  const url = await assertPublicAllowedUrl(raw);
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'NEON-PLAYER-X-SafeNetwork/1.0' },
    redirect: 'error', signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new Error(`NETWORK_UPSTREAM_HTTP_${response.status}`);
  const type = response.headers.get('content-type') || '';
  if (!type.toLowerCase().includes('json')) throw new Error('NETWORK_CONTENT_TYPE_REJECTED');
  const declared = Number(response.headers.get('content-length') || 0);
  if (declared > maxBytes) throw new Error('NETWORK_RESPONSE_TOO_LARGE');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('NETWORK_EMPTY_RESPONSE');
  const chunks = []; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { await reader.cancel(); throw new Error('NETWORK_RESPONSE_TOO_LARGE'); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function networkAllowlist() { return [...ALLOWED_HOSTS].sort(); }
