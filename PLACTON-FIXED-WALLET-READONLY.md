# Cuenta pública fija Placton — integración de solo lectura

- El backend resuelve por defecto `PLACTON_EVM_ADDRESS`, `PLACTON_SOLANA_ADDRESS` y `PLACTON_BITCOIN_ADDRESS`.
- Si el alias Placton está vacío, usa las variables públicas heredadas de la red: EVM (`NEON_EVM_WALLET_ADDRESS` o `EVM_WALLET_ADDRESS`), Solana (`SOLANA_WALLET_ADDRESS`, `NEON_SOLANA_ADDRESS`, `NEON_SOLANA_PUBLIC_KEY`) y Bitcoin (`NEON_BITCOIN_ADDRESS`, `BITCOIN_ADDRESS`).
- La configuración actual ya contiene una dirección pública Solana en `SOLANA_WALLET_ADDRESS`, por lo que Solana puede consultarse sin iniciar sesión en Coinbase Wallet.
- No se inventa una dirección EVM o Bitcoin. Si no están configuradas, esas redes devuelven estado pendiente hasta proporcionar su dirección pública.
- El dashboard consulta automáticamente el endpoint multi-red al iniciar. La conexión de wallet en el navegador sigue siendo opcional y puede sobreescribir la dirección EVM para una consulta puntual.
- No se leen ni se trasladan claves privadas, frases semilla ni keypairs. Todas las operaciones de este módulo son de solo lectura; no firma ni envía transacciones.
