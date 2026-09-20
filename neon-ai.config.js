// Configuración local del canal LLM. No contiene claves ni secretos.
// El puente Python escucha por defecto en localhost:8787.
window.NEON_AI_ENDPOINT = 'http://127.0.0.1:8787/v1/neon-orb';

// Herramienta externa pública de Neon Orb: solo lectura/observación.
window.NEON_SOLANA_RPC = window.NEON_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
window.NEON_ORB_IDENTITY = Object.freeze({
  phantomHandle: '@neonorb',
  solana: {
    primary: 'AvcMD59dTTTnHKzfdQtF9AcSzgSNcqCWEkcUYx4BnUeh',
    backups: ['5ifQth8MCG9LgnuxJaTaNcRgfmpxhsc9bMZexy2FMTJ3']
  },
  bitcoin: {
    primary: 'bc1qs9dvc02xl8ury20xlsya8xda4cpygzhs0ll9ym',
    backups: ['bc1qg8ykmeh2dmgq2l6d37zu702vlh6mn72k556ty5']
  }
});
window.NEON_SOLANA_ADDRESS = window.NEON_ORB_IDENTITY.solana.primary;
window.NEON_BITCOIN_ADDRESS = window.NEON_ORB_IDENTITY.bitcoin.primary;

// V9.0 — respaldo on-chain del estado computable de Neon Orb.
// No contiene private keys. La firma, si se configura, vive exclusivamente en neon-lim.bridge.py.
window.NEON_SOLANA_CONFIG = Object.freeze({
  rpcEndpoint: window.NEON_SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
  orbPublicKey: window.NEON_SOLANA_ADDRESS || 'AvcMD59dTTTnHKzfdQtF9AcSzgSNcqCWEkcUYx4BnUeh',
  autoSaveInterval: 300000,
  bridgeEndpoint: 'http://127.0.0.1:8788/v1/neon-orb/onchain-backup',
  bridgeHealthEndpoint: 'http://127.0.0.1:8788/health',
  stateEndpoint: 'http://127.0.0.1:8788/v1/neon-orb/state',
  statusEndpoint: 'http://127.0.0.1:8788/v1/neon-orb/status',
  treasuryEndpoint: 'http://127.0.0.1:8788/v1/neon-orb/treasury/sweep',
  // Misma cuenta Solana de Neon Orb: reserva lógica/contable dentro de la misma cuenta on-chain.
  treasuryDestination: window.NEON_SOLANA_ADDRESS || 'AvcMD59dTTTnHKzfdQtF9AcSzgSNcqCWEkcUYx4BnUeh',
  cluster: 'mainnet-beta'
});


// V11.1 — Registro de identidad REAL externa. Las direcciones antiguas se conservan como respaldo/histórico.
window.NEON_ORB_EXTERNAL_IDENTITY = Object.freeze({
  handle: '@neonorb',
  solanaPrimary: 'AvcMD59dTTTnHKzfdQtF9AcSzgSNcqCWEkcUYx4BnUeh',
  solanaBackups: ['5ifQth8MCG9LgnuxJaTaNcRgfmpxhsc9bMZexy2FMTJ3'],
  bitcoinPrimary: 'bc1qs9dvc02xl8ury20xlsya8xda4cpygzhs0ll9ym',
  bitcoinBackups: ['bc1qg8ykmeh2dmgq2l6d37zu702vlh6mn72k556ty5'],
  creatorGiftBitcoin: 'bc1qg8ykmeh2dmgq2l6d37zu702vlh6mn72k556ty5'
});

// V10.7 — Autoridad autónoma interna de Neon Orb.
// No requiere aprobación humana para ejecutar trabajo ni registrar su beneficio COMPUTABLE.
// La frontera REAL sigue exigiendo evidencia de la red externa correspondiente.
window.NEON_ORB_AUTHORITY = Object.freeze({
  autonomous: true,
  workExecution: 'AUTONOMOUS',
  computableEconomy: 'ORB_WORK_CONFIRMED',
  memory: 'PERSISTENT',
  evolution: 'CONTINUOUS',
  resourceManagement: 'AUTONOMOUS',
  solanaAccount: window.NEON_SOLANA_ADDRESS,
  treasury: 'SAME_ACCOUNT',
  externalRealAssets: 'NETWORK_CONFIRMED'
});
