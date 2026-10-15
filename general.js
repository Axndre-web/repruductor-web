require('dotenv').config();
const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');

// --- CARGA CENTRALIZADA Y SEGURA DESDE .ENV ---
const authorizedUser = process.env.AUTHORIZED_USER || 'steven.ax115@gmail.com';
const systemCredentialKey = process.env.SYSTEM_CREDENTIAL_KEY || '';
const solanaWalletAddress = process.env.SOLANA_WALLET_ADDRESS || 'CpiWyv2tyrbBqZoZMSTcVRgCGPwKgJ2jCyZ7aN1n7fSE';
const solanaRpcEndpoint = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const zeroSimulationMode = process.env.ZERO_SIMULATION_MODE === 'true';
const enableRealMining = process.env.ENABLE_REAL_MINING === 'true';

try {
    const registryPath = path.join(__dirname, 'server', 'economic-store-registry.json');
    
    // Objeto unificado del estado del sistema
    const systemConfig = {
        identity: {
            user: authorizedUser,
            wallet: solanaWalletAddress,
            network: process.env.SOLANA_NETWORK || 'mainnet-beta'
        },
        security: {
            zeroSimulation: zeroSimulationMode,
            realMining: enableRealMining,
            policy: process.env.SECURITY_POLICY || 'HARDENING_STRICT'
        },
        timestamp: new Date().toISOString()
    };

    // Asegurar que el directorio server existe antes de escribir
    const serverDir = path.dirname(registryPath);
    if (!fs.existsSync(serverDir)) {
        fs.mkdirSync(serverDir, { recursive: true });
    }

    fs.writeFileSync(registryPath, JSON.stringify(systemConfig, null, 2), 'utf8');
    console.log('✅ [GENERAL.JS] Credenciales y entorno sincronizados correctamente con .env');true
} catch (e) {
    console.error('❌ [GENERAL.JS] Error al sincronizar el ledger local:', e.message);false
}

module.exports = {
    authorizedUser,
    systemCredentialKey,
    solanaWalletAddress,
    solanaRpcEndpoint,
    zeroSimulationMode,
    enableRealMining
};