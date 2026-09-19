// Configuración local del canal LLM. No contiene claves ni secretos.
// El puente Python escucha por defecto en localhost:8787.
window.NEON_AI_ENDPOINT = 'http://127.0.0.1:8787/v1/neon-orb';

// Herramienta externa pública de Neon Orb: solo lectura/observación.
window.NEON_SOLANA_RPC = window.NEON_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
window.NEON_SOLANA_ADDRESS = '5ifQth8MCG9LgnuxJaTaNcRgfmpxhsc9bMZexy2FMTJ3';

// V9.0 — respaldo on-chain del estado computable de Neon Orb.
// No contiene private keys. La firma, si se configura, vive exclusivamente en neon-lim.bridge.py.
window.NEON_SOLANA_CONFIG = Object.freeze({
  rpcEndpoint: window.NEON_SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
  orbPublicKey: window.NEON_SOLANA_ADDRESS || '5ifQth8MCG9LgnuxJaTaNcRgfmpxhsc9bMZexy2FMTJ3',
  autoSaveInterval: 300000,
  bridgeEndpoint: 'http://127.0.0.1:8788/v1/neon-orb/onchain-backup',
  bridgeHealthEndpoint: 'http://127.0.0.1:8788/health',
  stateEndpoint: 'http://127.0.0.1:8788/v1/neon-orb/state',
  statusEndpoint: 'http://127.0.0.1:8788/v1/neon-orb/status',
  treasuryEndpoint: 'http://127.0.0.1:8788/v1/neon-orb/treasury/sweep',
  // Misma cuenta Solana de Neon Orb: reserva lógica/contable dentro de la misma cuenta on-chain.
  treasuryDestination: window.NEON_SOLANA_ADDRESS || '5ifQth8MCG9LgnuxJaTaNcRgfmpxhsc9bMZexy2FMTJ3',
  cluster: 'mainnet-beta'
});
