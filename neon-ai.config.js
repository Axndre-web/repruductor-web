// Configuración local del canal LLM. No contiene claves ni secretos.
// El puente Python escucha por defecto en localhost:8787.
window.NEON_AI_ENDPOINT = 'http://127.0.0.1:8787/v1/neon-orb';


// V11.2 — Identidad externa de Neon Orb. Sólo datos públicos; nunca incluir claves privadas.
window.NEON_ORB_EXTERNAL_IDENTITY = Object.freeze({
  handle: '@neonorb',
  solana: { primary: 'AvcMD59dTTTnHKzfdQtF9AcSzgSNcqCWEkcUYx4BnUeh', backups: ['5ifQth8MCG9LgnuxJaTaNcRgfmpxhsc9bMZexy2FMTJ3'] },
  bitcoin: { primary: 'bc1qs9dvc02xl8ury20xlsya8xda4cpygzhs0ll9ym', backups: ['bc1qg8ykmeh2dmgq2l6d37zu702vlh6mn72k556ty5'] },
  roles: { solanaPrimary: 'REAL_EXTERNAL_PRIMARY', solanaBackup: 'REAL_EXTERNAL_BACKUP', bitcoinPrimary: 'REAL_EXTERNAL_PRIMARY', bitcoinBackup: 'REAL_EXTERNAL_BACKUP' }
});
window.NEON_SOLANA_ADDRESS = window.NEON_ORB_EXTERNAL_IDENTITY.solana.primary;
window.NEON_BITCOIN_ADDRESS = window.NEON_ORB_EXTERNAL_IDENTITY.bitcoin.primary;

window.NEON_BRIDGE_HEALTH_URL = 'http://127.0.0.1:8787/health';
