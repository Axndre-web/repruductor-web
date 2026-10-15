import './server/load-env.js';
import express from "express";
import compression from "compression";
import helmet from "helmet";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const app = express();

const PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

app.disable("x-powered-by");

app.use(helmet({
  contentSecurityPolicy: false, // The current UI loads external fonts/streams.
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(express.json({ limit: "256kb" }));

// Fixed radio source allowlist. The route never accepts a caller-supplied URL.
const RADIO_STREAMS = [
  'https://playerservices.streamtheworld.com/api/livestream-redirect/Los40.mp3',
  'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_CLASSIC.mp3',
  'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_DANCE.mp3',
  'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_URBAN.mp3',
  'https://one.cloudstreaming.eu/proxy/europa/stream',
  'https://kissfm.kissfmradio.cires21.com/kissfm.mp3',
  'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOLE.mp3',
  'https://rockfm-cope-rrcast.flumotion.com/cope/rockfm-low.mp3',
  'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOMARCA_NACIONAL.mp3',
  'https://flucast09-h-cloud.flumotion.com/cope/net1.mp3',
  'https://playerservices.streamtheworld.com/api/livestream-redirect/RAC_1.mp3',
  'https://dispatcher.rndfnk.com/crtve/rne1/mad/mp3/high'
];
const RADIO_ALLOWED_HOSTS = new Set(RADIO_STREAMS.map(value => new URL(value).hostname));
app.get("/api/radio/stream/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 0 || id >= RADIO_STREAMS.length) return res.status(404).json({ error: 'radio_stream_not_found' });
  let target = new URL(RADIO_STREAMS[id]);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    let upstream;
    for (let hop = 0; hop <= 4; hop++) {
      if (target.protocol !== 'https:' || !RADIO_ALLOWED_HOSTS.has(target.hostname)) throw new Error('radio_redirect_host_not_allowed');
      upstream = await fetch(target, { headers: { accept: 'audio/*,*/*;q=0.8', 'user-agent': 'NeonPlayerX-Radio/1.0' }, redirect: 'manual', signal: controller.signal });
      if ([301, 302, 303, 307, 308].includes(upstream.status)) {
        const location = upstream.headers.get('location');
        await upstream.body?.cancel().catch(() => {});
        if (!location || hop === 4) throw new Error('radio_redirect_limit');
        target = new URL(location, target);
        continue;
      }
      break;
    }
    clearTimeout(timer);
    if (!upstream?.ok || !upstream.body) return res.status(502).json({ error: 'radio_upstream_unavailable' });
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/mpeg');
    const length = upstream.headers.get('content-length'); if (length && /^\d+$/.test(length)) res.setHeader('Content-Length', length);
    const { Readable } = await import('node:stream');
    const stream = Readable.fromWeb(upstream.body);
    res.on('close', () => { if (!res.writableEnded) stream.destroy(); });
    stream.on('error', () => { if (!res.headersSent) res.status(502); res.end(); });
    stream.pipe(res);
  } catch (error) {
    clearTimeout(timer);
    if (!res.headersSent) res.status(502).json({ error: error?.name === 'AbortError' ? 'radio_upstream_timeout' : 'radio_stream_unavailable' });
    else res.end();
  }
});

// Recreational slot state is isolated from the autonomous/economic ledger and wallet.
app.get('/api/arcade/state', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const state = await getArcadeState(String(req.query.deviceId || ''));
    res.json({ ...state, config: arcadeDemoConfig });
  } catch (error) {
    res.status(400).json({ ok: false, error: error?.message || 'invalid_arcade_device' });
  }
});
app.post('/api/arcade/state', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const result = await saveArcadeSnapshot(String(req.body?.deviceId || ''), req.body?.balance);
    res.json(result);
  } catch (error) {
    res.status(400).json({ ok: false, error: error?.message || 'invalid_arcade_state' });
  }
});
app.post('/api/arcade/spin', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const result = await recordArcadeSpin(String(req.body?.deviceId || ''), req.body || {});
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ ok: false, error: error?.message || 'invalid_arcade_event' });
  }
});

app.get("/healthz", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "neon-player-x",
    version: "11.8.0"
  });
});


import { neonOrbGovernor } from './server/economic-governor.js';
import { discoverConfigured, rankPositiveOpportunities, evaluateOpportunity } from './server/opportunity-engine.js';
import { executeOpportunity, verifySettlement } from './server/external-execution.js';
import { realEconomicRegistry } from './server/real-economic-registry.js';
import { calculateCurrencyConversion, fetchCurrencyQuote, executeCurrencyConversion } from './server/currency-converter.js';
import { calculateConversion, fetchConversionQuote, executeConversion } from './server/asset-router.js';
import { listEconomicSources, verifySourceEvidence } from './server/economic-source-registry.js';
import { fetchSourceEvidence } from './server/external-source-adapter.js';
import { neonOrbRuntime } from './core/neon-orb-runtime.js';
import { neonOrbDaemon } from './core/neon-orb-daemon.js';
import { calculateEconomicAccounting } from './server/economic-accounting.js';
import { listPaidWorkSources, discoverPublicWork } from './server/public-work-sources.js';
import { getJupiterSwapQuote, getMarketQuotes, getMiningPoolStatus, getObservedWalletBalances, listMiningPools, verifyBitcoinPayout } from './server/market-mining-telemetry.js';
import { getArcadeState, recordArcadeSpin, saveArcadeSnapshot, arcadeDemoConfig } from './server/arcade-demo-ledger.js';

// Neon Orb is the resident runtime; inference is invoked as one of its capabilities.
neonOrbRuntime.start();
void neonOrbDaemon.ready.then(() => neonOrbDaemon.start()).catch(error => console.error('[Neon Orb daemon] startup failed:', error?.message || error));
const orbRequestWindows = new Map();
function orbRateLimit(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const window = orbRequestWindows.get(key);
  if (!window || now - window.startedAt >= 60_000) orbRequestWindows.set(key, { startedAt: now, count: 1 });
  else if (++window.count > 30) return res.status(429).json({ ok: false, error: 'neon_orb_rate_limit' });
  next();
}

function adminRequired(req, res, next) {
  const expected = process.env.NEON_ADMIN_TOKEN;
  if (!expected || expected.length < 32) return res.status(503).json({ error:'admin_token_not_configured_or_too_weak' });
  const supplied = Buffer.from(String(req.get('authorization') || '').replace(/^Bearer\s+/i, ''), 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  if (supplied.length !== expectedBytes.length || !timingSafeEqual(supplied, expectedBytes)) return res.status(401).json({ error:'unauthorized' });
  next();
}


// Public, read-only work discovery. These listings are never booked as income and
// the integration never submits applications or executes external tasks.
// Safe account-readiness inventory: expose only boolean readiness, never credential values.
const ACCOUNT_INTEGRATIONS = [
  { id: 'paypal', name: 'PayPal Business', category: 'COBRO', signupUrl: 'https://www.paypal.com/business', keys: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'], note: 'Cuenta de negocio y API live aprobada; verificar webhooks y moneda.' },
  { id: 'stripe', name: 'Stripe', category: 'COBRO', signupUrl: 'https://dashboard.stripe.com/register', keys: ['STRIPE_SECRET_KEY'], note: 'Activar la cuenta y configurar webhooks de pago antes de producción.' },
  { id: 'github', name: 'GitHub', category: 'TRABAJO', signupUrl: 'https://github.com/signup', keys: [], note: 'Crear perfil y repositorios; usar tokens de mínimo privilegio solo si se integra una API aprobada.' },
  { id: 'gitcoin', name: 'Gitcoin Bounties', category: 'TRABAJO', signupUrl: 'https://gitcoin.co/mechanisms/bounties', keys: [], note: 'Revisar las reglas de cada bounty; entrega y aceptación no están automatizadas.' },
  { id: 'upwork', name: 'Upwork', category: 'TRABAJO', signupUrl: 'https://www.upwork.com', keys: [], note: 'Perfil y contratación manual; no automatizar scraping ni solicitudes no autorizadas.' },
  { id: 'hackerone', name: 'HackerOne', category: 'TRABAJO', signupUrl: 'https://www.hackerone.com', keys: [], note: 'Solo investigación humana dentro del alcance de cada programa; sin escaneo automático.' },
  { id: 'wallet', name: 'Billetera pública Solana', category: 'COBRO', signupUrl: 'https://solana.com', keys: ['SOLANA_WALLET_ADDRESS'], note: 'Solo dirección pública. Nunca introducir frase semilla ni clave privada en Neon Orb.' }
];
app.get('/api/neon-orb/account-readiness', (_req, res) => {
  const integrations = ACCOUNT_INTEGRATIONS.map(item => {
    const missing = item.keys.filter(key => !String(process.env[key] || '').trim());
    return { id: item.id, name: item.name, category: item.category, signupUrl: item.signupUrl,
      status: item.keys.length === 0 ? 'MANUAL_SETUP_REQUIRED' : (missing.length ? 'CONFIGURATION_REQUIRED' : 'CONFIGURED_UNVERIFIED'),
      configured: item.keys.length > 0 && missing.length === 0, missingKeys: missing, note: item.note };
  });
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, identity: 'NEON_ORB', mode: 'ACCOUNT_READINESS_ONLY', integrations,
    safety: { credentialsExposed: false, accountCreationAutomated: false, paymentsVerified: false, withdrawalsEnabled: false },
    note: 'Configurado no equivale a autenticado ni a cobro confirmado. La titularidad, KYC, autorizaciones y pruebas de pago deben verificarse con cada proveedor.' });
});

// Effective configuration summary based on the local .env. Never returns credential values,
// public wallet addresses, RPC URLs, tokens, or secret key material.
const envEnabled = name => String(process.env[name] || '').trim().toLowerCase() === 'true';
const envPresent = name => Boolean(String(process.env[name] || '').trim());
app.get('/api/neon-orb/runtime-readiness', (_req, res) => {
  const spendingAllowed = envEnabled('NEON_ALLOW_SPENDING');
  const signingAllowed = envEnabled('NEON_ALLOW_SIGNING');
  const withdrawalsAllowed = envEnabled('NEON_ALLOW_WITHDRAWALS');
  const realVerification = envEnabled('NEON_REQUIRE_REALITY_VERIFICATION');
  const authorizedProviderRequired = envEnabled('NEON_REQUIRE_AUTHORIZED_PROVIDER');
  const providers = {
    paypal: envPresent('PAYPAL_CLIENT_ID') && envPresent('PAYPAL_CLIENT_SECRET'),
    stripe: envPresent('STRIPE_SECRET_KEY'),
    solanaPublicWallet: envPresent('SOLANA_WALLET_ADDRESS'),
    solanaRpc: envPresent('SOLANA_RPC_ENDPOINT'),
    pythonBridge: envPresent('BRIDGE_SCRIPT_PATH')
  };
  const blockers = [];
  if (!providers.paypal) blockers.push('PAYPAL_API_CREDENTIALS_MISSING');
  if (!providers.stripe) blockers.push('STRIPE_API_CREDENTIAL_MISSING');
  if (!providers.solanaPublicWallet) blockers.push('SOLANA_PUBLIC_WALLET_MISSING');
  if (!providers.solanaRpc) blockers.push('SOLANA_RPC_MISSING');
  if (!spendingAllowed) blockers.push('SPENDING_DISABLED_BY_ENV');
  if (!signingAllowed) blockers.push('SIGNING_DISABLED_BY_ENV');
  if (!withdrawalsAllowed) blockers.push('WITHDRAWALS_DISABLED_BY_ENV');
  res.set('Cache-Control', 'no-store');
  res.json({
    ok: true,
    identity: 'NEON_ORB',
    status: blockers.length ? 'READY_FOR_READ_ONLY_DISCOVERY' : 'CONFIGURED_REQUIRES_PROVIDER_VERIFICATION',
    mode: String(process.env.NEON_EXECUTION_MODE || 'READ_VERIFY_ONLY'),
    features: {
      autonomousMode: envEnabled('AGENT_AUTONOMOUS_MODE'),
      executeIntents: envEnabled('AGENT_EXECUTE_INTENTS'),
      publicWorkDiscovery: envEnabled('NEON_DAEMON_DISCOVERY_ENABLED'),
      daemonAutoExecute: envEnabled('NEON_DAEMON_AUTO_EXECUTE_ENABLED'),
      zeroSimulationMode: envEnabled('ZERO_SIMULATION_MODE'),
      mockDataAllowed: envEnabled('ALLOW_MOCK_DATA'),
      realMiningConfigured: envEnabled('ENABLE_REAL_MINING'),
      nodeValidationConfigured: envEnabled('ENABLE_NODE_VALIDATION')
    },
    policy: {
      spendingAllowed, signingAllowed, withdrawalsAllowed,
      realEvidenceRequired: realVerification,
      authorizedProviderRequired,
      effectiveExternalMoneyMovement: spendingAllowed && signingAllowed && withdrawalsAllowed && realVerification && authorizedProviderRequired
    },
    providers,
    blockers,
    security: { secretsReturned: false, walletAddressReturned: false, rpcUrlReturned: false, noAutomaticAccountCreation: true },
    note: 'La configuración local permite descubrir y verificar en modo de solo lectura. La presencia de una variable no demuestra que una cuenta esté autenticada, aprobada o que haya generado ingresos.'
  });
});

app.get('/api/neon-orb/work-sources', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, identity: 'NEON_ORB', sources: listPaidWorkSources() });
});
app.get('/api/neon-orb/work-leads', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  const discovery = neonOrbDaemon.snapshot().discovery || {};
  res.json({
    ok: true, identity: 'NEON_ORB', mode: 'LEADS_ONLY_NOT_REVENUE',
    lastDiscoveryAt: discovery.lastAt || null,
    count: Array.isArray(discovery.leads) ? discovery.leads.length : 0,
    leads: Array.isArray(discovery.leads) ? discovery.leads : [],
    note: 'Las ofertas son pistas públicas; no implican contrato, tarea aceptada ni pago.'
  });
});

app.get('/api/neon-orb/work-opportunities', orbRateLimit, async (req, res) => {
  try {
    const result = await discoverPublicWork({
      query: typeof req.query.q === 'string' ? req.query.q : '',
      remoteOnly: ['true', '1'].includes(String(req.query.remote || '').toLowerCase()),
      limit: req.query.limit
    });
    res.set('Cache-Control', 'no-store');
    res.json(result);
  } catch (error) {
    res.status(502).json({ ok: false, identity: 'NEON_ORB', code: 'WORK_DISCOVERY_UNAVAILABLE' });
  }
});

// Public market data, pool telemetry and chain-observed balances. Read-only only.
app.get('/api/neon-orb/mining/pools', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, identity: 'NEON_ORB', pools: listMiningPools() });
});
app.get('/api/neon-orb/mining/payout/:txid/verify', orbRateLimit, async (req, res) => {
  const result = await verifyBitcoinPayout({ txid: req.params.txid });
  res.set('Cache-Control', 'no-store');
  res.status(result.ok ? 200 : (result.code?.includes('INVALID') ? 400 : 502)).json(result);
});
app.get('/api/neon-orb/mining/status', orbRateLimit, async (req, res) => {
  try {
    const poolId = typeof req.query.pool === 'string' ? req.query.pool : undefined;
    const result = await getMiningPoolStatus({ poolId });
    res.set('Cache-Control', 'no-store');
    res.json(result);
  } catch (error) {
    res.status(502).json({ ok: false, identity: 'NEON_ORB', code: 'MINING_TELEMETRY_UNAVAILABLE' });
  }
});
app.get('/api/neon-orb/solana/swap-quote', orbRateLimit, async (req, res) => {
  const result = await getJupiterSwapQuote({
    inputMint: typeof req.query.inputMint === 'string' ? req.query.inputMint : '',
    outputMint: typeof req.query.outputMint === 'string' ? req.query.outputMint : '',
    amount: typeof req.query.amount === 'string' ? req.query.amount : '',
    slippageBps: req.query.slippageBps === undefined ? 50 : Number(req.query.slippageBps)
  });
  res.set('Cache-Control', 'no-store');
  res.status(result.ok ? 200 : (result.code?.startsWith('SWAP_') ? 400 : 502)).json(result);
});
app.get('/api/neon-orb/market-data', orbRateLimit, async (req, res) => {
  try {
    const parseList = (value, fallback) => typeof value === 'string' ? value.split(',').slice(0, 8) : fallback;
    const result = await getMarketQuotes({
      assets: parseList(req.query.assets, ['BTC', 'ETH', 'SOL', 'USDC']),
      fiats: parseList(req.query.fiats, ['USD', 'EUR'])
    });
    res.set('Cache-Control', 'no-store');
    res.json(result);
  } catch {
    res.status(502).json({ ok: false, identity: 'NEON_ORB', code: 'MARKET_QUOTES_UNAVAILABLE' });
  }
});
app.get('/api/neon-orb/wallet/observed', orbRateLimit, async (_req, res) => {
  try {
    const result = await getObservedWalletBalances();
    res.set('Cache-Control', 'no-store');
    res.json(result);
  } catch {
    res.status(502).json({ ok: false, identity: 'NEON_ORB', code: 'WALLET_OBSERVATION_UNAVAILABLE' });
  }
});

app.get('/api/neon-orb/daemon', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, daemon: neonOrbDaemon.snapshot(), accounting: calculateEconomicAccounting() });
});
app.post('/api/neon-orb/daemon/tick', adminRequired, async (_req, res) => {
  const result = await neonOrbDaemon.tick();
  res.status(result.ok ? 200 : 503).json(result);
});
app.post('/api/neon-orb/daemon/stop', adminRequired, async (_req, res) => {
  res.json({ ok: true, daemon: await neonOrbDaemon.stop() });
});
app.post('/api/neon-orb/daemon/start', adminRequired, (_req, res) => {
  res.json({ ok: true, daemon: neonOrbDaemon.start() });
});
app.get('/api/neon-orb/status', async (_req, res) => {
  try {
    await neonOrbRuntime.ready;
    res.set('Cache-Control', 'no-store');
    res.json({ ...neonOrbRuntime.snapshot(), economy: neonOrbGovernor.snapshot() });
  } catch (error) {
    res.status(503).json({ ok: false, identity: 'NEON_ORB', error: 'runtime_unavailable' });
  }
});
app.post('/api/neon-orb/think', orbRateLimit, async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const result = await neonOrbRuntime.think({
      message: body.message,
      context: body.context,
      event: body.event,
      session: body.session
    });
    res.set('Cache-Control', 'no-store');
    res.json(result);
  } catch (error) {
    console.error('[Neon Orb runtime] cognition request failed:', error?.message || error);
    res.status(503).json({ ok: false, identity: 'NEON_ORB', error: 'cognition_unavailable' });
  }
});

app.get('/api/economy/status', (_req,res)=>res.json({ok:true,...neonOrbGovernor.snapshot(), economicSources:listEconomicSources()}));
app.get('/api/economy/accounting', (_req,res)=>{ res.set('Cache-Control','no-store'); res.json({ok:true,accounting:calculateEconomicAccounting()}); });
app.get('/api/economy/sources', (_req,res)=>res.json({ok:true,sources:listEconomicSources()}));
app.post('/api/economy/sources/verify', adminRequired, (req,res)=>{
  try {
    const result=verifySourceEvidence({sourceId:req.body?.sourceId,evidence:req.body?.evidence||{}});
    res.status(result.verified?200:422).json({ok:result.verified,...result});
  } catch(error) { res.status(422).json({ok:false,error:String(error?.message||error)}); }
});
app.post('/api/economy/sources/fetch', adminRequired, async (req,res)=>{
  try {
    const result=await fetchSourceEvidence({sourceId:req.body?.sourceId,url:req.body?.url,payload:req.body?.payload||{}});
    res.status(result.verification.verified?200:422).json({ok:result.verification.verified,...result});
  } catch(error) { res.status(502).json({ok:false,error:String(error?.message||error)}); }
});
app.post('/api/economy/pause', adminRequired, (req,res)=>res.json({ok:true,state:neonOrbGovernor.setPaused(true, req.body?.reason||'manual')}));
app.post('/api/economy/resume', adminRequired, (req,res)=>res.json({ok:true,state:neonOrbGovernor.setPaused(false, req.body?.reason||'manual')}));
app.post('/api/economy/discover', adminRequired, async (_req,res)=>{ try { const result=await discoverConfigured(); res.json({ok:true,...result}); } catch(error){ res.status(502).json({ok:false,error:String(error?.message||error)}); } });
app.get('/api/economy/opportunities', (_req,res)=>res.json({ok:true,opportunities:rankPositiveOpportunities()}));
app.get('/api/economy/assets', (_req,res)=>res.json({ok:true,...realEconomicRegistry.snapshot()}));
app.post('/api/economy/opportunities/evaluate', adminRequired, (req,res)=>res.json({ok:true,opportunity:evaluateOpportunity(req.body||{})}));
app.post('/api/economy/opportunities/:id/execute', adminRequired, async (req,res)=>{ const op=neonOrbGovernor.snapshot().opportunities.find(x=>x.id===req.params.id); if(!op)return res.status(404).json({ok:false,error:'opportunity_not_found'}); try { const result=await executeOpportunity(op,req.body||{}); res.status(result.ok?200:409).json(result); } catch(error){ res.status(502).json({ok:false,error:String(error?.message||error)}); } });
app.post('/api/economy/opportunities/:id/settle', adminRequired, async (req,res)=>{ const op=neonOrbGovernor.snapshot().opportunities.find(x=>x.id===req.params.id); if(!op)return res.status(404).json({ok:false,error:'opportunity_not_found'}); try { const result=await verifySettlement(op,req.body||{}); res.status(result.ok?200:409).json(result); } catch(error){ res.status(502).json({ok:false,error:String(error?.message||error)}); } });
app.post('/api/economy/conversion/quote', adminRequired, async (req,res)=>{ try { const body=req.body||{}; const quote=body.quoteUrl ? await fetchConversionQuote(body.quoteUrl,body.payload||{}) : body.quote; if(!quote)return res.status(400).json({ok:false,error:'quote_required'}); const calc=calculateConversion({...body,...quote}); res.json({ok:true,conversion:calc,quote}); } catch(error){ res.status(502).json({ok:false,error:String(error?.message||error)}); } });
app.post('/api/economy/conversion/execute', adminRequired, async (req,res)=>{ try { const body=req.body||{}; const calc=calculateConversion(body); const result=await executeConversion(body.executeUrl,{...calc,...(body.payload||{})}); res.status(result.ok?200:409).json({conversion:calc,...result}); } catch(error){ res.status(502).json({ok:false,error:String(error?.message||error)}); } });
app.post('/api/economy/currency/quote', adminRequired, async (req,res)=>{ try { const body=req.body||{}; const quote=body.quoteUrl ? await fetchCurrencyQuote(body.quoteUrl,body.payload||{}) : body.quote; if(!quote)return res.status(400).json({ok:false,error:'quote_required'}); res.json({ok:true,conversion:calculateCurrencyConversion({...body,...quote}),quote}); } catch(error){ res.status(502).json({ok:false,error:String(error?.message||error)}); } });
app.post('/api/economy/currency/execute', adminRequired, async (req,res)=>{ try { const body=req.body||{}; const result=await executeCurrencyConversion(body.executeUrl,body,body.payload||{}); res.status(result.ok?200:409).json(result); } catch(error){ res.status(502).json({ok:false,error:String(error?.message||error)}); } });

app.use(express.static(publicDir, {
  index: "index.html",
  extensions: ["html"],
  fallthrough: true,
  etag: true,
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
  setHeaders(res, filePath) {
    if (/\.(?:png|jpe?g|gif|webp|svg|ico|woff2?)$/i.test(filePath)) {
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    }
  }
}));

app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "internal_server_error" });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`NEON PLAYER X listening on http://${HOST}:${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received; shutting down...`);
  void neonOrbDaemon.stop().catch(() => {});
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
