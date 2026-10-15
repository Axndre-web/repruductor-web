# Neon Orb market + pool telemetry (read-only; no transactions signed)
NEON_MARKET_QUOTES_ENABLED=true
NEON_MARKET_DATA_PROVIDER=coinbase-spot
NEON_MINING_POOL=etc
NEON_MINING_API_PROVIDER=2miners
# Use a public wallet address for the selected mined coin, not the SOL address.
NEON_MINING_WALLET_ADDRESS=
# A miner must be installed/configured separately. The web app never launches it automatically.
NEON_MINING_AUTOSTART=false
# Optional public wallet observation
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
SOLANA_COMMITMENT=confirmed
# Never put private keys in browser code or commit this file with real secrets.

# Public work discovery; job listings are leads, not guaranteed paid tasks.
NEON_DAEMON_DISCOVERY_ENABLED=true
NEON_DAEMON_INTERVAL_MS=3600000
NEON_JOB_FEED_CACHE_MS=21600000
NEON_DAEMON_AUTO_EXECUTE_ENABLED=false
NEON_EXECUTION_MODE=READ_VERIFY_ONLY
NEON_ALLOW_SPENDING=false
NEON_ALLOW_SIGNING=false
NEON_ALLOW_WITHDRAWALS=false
NEON_REQUIRE_REALITY_VERIFICATION=true
NEON_REQUIRE_AUTHORIZED_PROVIDER=true
NEON_ADMIN_TOKEN=
NEON_MINING_POOL=etc
NEON_MINING_WALLET_ADDRESS=
NEON_BITCOIN_ADDRESS=


## V8: fuentes laborales públicas y autonomía responsable
- El daemon descubre ofertas de Arbeitnow, Remotive y Jobicy y persiste hasta 500 pistas en `/api/neon-orb/work-leads`.
- Remotive se consulta como máximo cada seis horas por caché, cumpliendo su recomendación de no superar cuatro consultas diarias; Jobicy también queda limitado por la misma caché.
- Las ofertas no son tareas aceptadas ni APIs de pago. No se envían candidaturas ni se ejecuta código externo automáticamente.
- La ejecución financiera permanece en `READ_VERIFY_ONLY`; los endpoints administrativos fallan cerrados si `NEON_ADMIN_TOKEN` falta o tiene menos de 32 caracteres.
- Las direcciones BTC/minería no se inventan ni se rellenan con direcciones de ejemplo: si no se configura la dirección pública correcta, el sistema declara `not_configured`.
