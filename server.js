import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JsonStore } from './server/economic-store.js';
import { ExternalEconomicGovernor } from './server/external-economic-governor.js';
import { createEconomicApi } from './server/economic-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const dataFile = process.env.NEON_ECONOMIC_DATA_FILE || path.join(__dirname, 'data', 'external-economic.json');
const app = express();

const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
const governor = new ExternalEconomicGovernor(new JsonStore(dataFile), {
  maxSingleSettlementEUR: process.env.NEON_MAX_SINGLE_SETTLEMENT_EUR,
  maxDailyVerifiedRevenueEUR: process.env.NEON_MAX_DAILY_VERIFIED_REVENUE_EUR
});

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

app.get('/healthz', (_req, res) => {
  const status = governor.status();
  res.status(200).json({
    status: 'ok',
    service: 'neon-player-x',
    version: '11.7.1',
    economicMode: status.mode,
    execution: status.execution,
    paused: status.paused
  });
});

app.use('/api/economy', createEconomicApi(governor));

app.use(express.static(publicDir, {
  index: 'index.html',
  extensions: ['html'],
  fallthrough: true,
  etag: true,
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  setHeaders(res, filePath) {
    if (/\.(?:png|jpe?g|gif|webp|svg|ico|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    }
  }
}));

app.get('/{*splat}', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = /REQUIRED|INVALID|NOT_FOUND|MISMATCH|EXCEEDED|PAUSED|POSITIVE|VALID_/.test(err?.message || '') ? 400 : 500;
  res.status(status).json({ error: err?.message || 'internal_server_error' });
});

await governor.init();
const server = app.listen(PORT, HOST, () => {
  console.log(`NEON PLAYER X listening on http://${HOST}:${PORT}`);
  console.log(`Economic mode: GUARDED_AUTONOMY / READ_VERIFY_ONLY`);
});

function shutdown(signal) {
  console.log(`${signal} received; shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
