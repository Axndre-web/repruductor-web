# Coinbase Wallet + cartera multi-red (solo lectura)

## Qué incorpora

- La interfaz detecta un proveedor EIP-1193 inyectado y prioriza `provider.isCoinbaseWallet` cuando está disponible. La conexión solo se inicia al pulsar **Conectar Coinbase Wallet**.
- La dirección EVM previamente autorizada se restaura silenciosamente con `eth_accounts` (sin abrir un diálogo de permisos) y se usa para consultar ETH en Ethereum Mainnet y Base mediante RPC de solo lectura. El agente también detecta una dirección Solana ya expuesta por un proveedor conectado.
- La telemetría intenta observar BTC desde `NEON_BITCOIN_ADDRESS`/`BITCOIN_ADDRESS` mediante mempool.space y SOL/tokens SPL desde `SOLANA_WALLET_ADDRESS` o una dirección pública de un proveedor Solana conectado, usando el RPC público de Solana como fallback. Ethereum y Base también tienen RPC públicos predeterminados. Si falta una dirección que no puede derivarse de la sesión EVM (en particular BTC), la respuesta devuelve un estado explícito de no configurada; nunca inventa una dirección ni muestra saldo cero como si se hubiera observado.
- Se pueden configurar contratos ERC-20 públicos mediante `EVM_TOKEN_LIST` para consultar balances en Ethereum/Base.
- Los balances compatibles se valoran con cotizaciones públicas Coinbase Spot en USD/EUR. La valoración es indicativa y no es una cotización ejecutable.
- La respuesta indica expresamente que posiciones Perps/derivados de TSLA no son visibles en una blockchain pública. Para mostrarlas hace falta una API oficial autenticada y autorizada del proveedor donde se mantienen.

## Configuración

1. Copia las variables de `.env.example` al gestor de secretos/configuración del servidor. Configura direcciones públicas, no claves privadas.
2. Configura `NEON_BITCOIN_ADDRESS` y `SOLANA_WALLET_ADDRESS` para observar BTC/SOL de la cartera deseada.
3. Para ERC-20, configura `EVM_TOKEN_LIST` como JSON, por ejemplo:

```json
[{"chain":"ethereum","address":"0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","symbol":"USDC","decimals":6}]
```

4. Ejecuta `npm start`. El servidor realiza una comprobación ligera de `/healthz` y `/api/neon-orb/wallet/multichain/healthz` al iniciar. La ruta de solo lectura es `GET /api/neon-orb/wallet/multichain?evmAddress=0x...&solanaAddress=...&bitcoinAddress=...`; solo se aceptan direcciones públicas y se validan antes de consultar proveedores. Para comprobar manualmente las rutas con el servidor ya iniciado, ejecuta `npm run check:api`.
5. Si la web y el backend tienen orígenes distintos, establece `globalThis.NEON_API_URL` antes de cargar los módulos de interfaz. Usa HTTPS y limita CORS en el despliegue.

## Límites y seguridad

- Esta integración no necesita ni lee frase semilla, clave privada, ni permisos de firma.
- La conexión EIP-1193 no implica autorización para mover fondos. No se crean ni envían transacciones.
- Coinbase Wallet puede exponer distintos proveedores según navegador/dispositivo; si no hay proveedor inyectado, abre la app/extensión y vuelve a conectar. La web wallet por sí sola no garantiza un objeto `window.ethereum`.
- ETH en Ethereum y ETH en Base se presentan como saldos de redes diferentes; ambos se suman en el total de cartera, pero no representan el mismo saldo on-chain.
- Tokens SPL y ERC-20 no configurados o sin precio compatible se muestran sin valoración. Por ello, el total aparece como parcial cuando falta información.
- Perps TSLA, acciones tokenizadas o posiciones custodiales no se infieren a partir de saldos de wallet. No se ha integrado una API de broker ni se simulan esas posiciones.
- RPC públicos pueden limitar solicitudes. Para producción, configura endpoints de proveedor confiable y monitoriza disponibilidad. Coinbase Wallet no proporciona una dirección Bitcoin a través de su proveedor EVM; BTC debe venir de una dirección pública configurada o de una integración de wallet Bitcoin específica. La consulta es de solo lectura y nunca solicita frases semilla ni claves privadas.
