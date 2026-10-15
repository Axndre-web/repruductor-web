# NEON ORB — V6: telemetría real de pool, mercado y balances observados

## Cambios de esta fase
- `server/market-mining-telemetry.js`: adaptador de solo lectura para estadísticas de 2Miners, series de participaciones válidas/stale/invalid, cotizaciones spot de Coinbase y observación de balances públicos SOL/BTC.
- `server.js`: endpoints read-only para pools, telemetría minera, precios spot y balances observados.
- `UI/neon-orb-command-deck.js` y `public/UI/neon-orb-command-deck.js`: panel holográfico conectado a datos de pool, participaciones y mercado.
- `neon-lim.bridge.py`: reconoce los nombres de configuración `SOLANA_WALLET_ADDRESS` y `SOLANA_RPC_ENDPOINT` del entorno proporcionado, manteniendo las variables anteriores como fallback.
- `mining/run-etc-miner-linux.sh`: lanzador opt-in para un lolMiner ya instalado y verificado. No descarga ni ejecuta mineros automáticamente.
- `.env`: se conservaron los valores existentes; se añadieron únicamente las variables del archivo de entorno proporcionado que no existían, más configuración de telemetría. Las claves originales del proyecto tienen prioridad.

## Endpoints
- `GET /api/neon-orb/mining/pools` — catálogo de pools compatibles.
- `GET /api/neon-orb/mining/status?pool=etc` — estadísticas de 2Miners; consulta la cuenta y la serie de participaciones válidas, stale e inválidas de los últimos 30 minutos.
- `GET /api/neon-orb/mining/payout/<txid>/verify` — contrasta una transacción BTC en mempool.space y comprueba que está confirmada y que tiene una salida al BTC público configurado.
- `GET /api/neon-orb/market-data?assets=BTC,ETH,SOL,USDC,ETC&fiats=USD,EUR` — precios spot indicativos de Coinbase.
- `GET /api/neon-orb/solana/swap-quote?inputMint=<mint>&outputMint=<mint>&amount=<unidades-atómicas>&slippageBps=50` — cotización real de ruta de Jupiter Swap API (tier público), solo lectura.
- `GET /api/neon-orb/wallet/observed` — balance público SOL por JSON-RPC y BTC por mempool.space, si las direcciones están configuradas.

## Configuración de minería
- `NEON_MINING_POOL=etc` selecciona 2Miners ETC para observación.
- `NEON_MINING_WALLET_ADDRESS` usa la dirección pública BTC ya presente en la base para recibir pagos en BTC desde el pool ETC (2Miners admite pagos BTC sustituyendo la dirección de usuario); también admite una dirección ETC `0x…`. No uses la dirección SOL.
- `ENABLE_REAL_MINING=true` solo indica intención de habilitar la función; no instala hardware, no crea participaciones ni garantiza rentabilidad.
- `NEON_MINING_AUTOSTART=false`: el proceso de minado no se inicia al arrancar la web.
- El script `mining/run-etc-miner-linux.sh` exige que el operador instale y verifique por separado un minero compatible, indique `NEON_MINER_BIN` y confirme que la dirección pública de pago es correcta (BTC o ETC). El script solo se ejecuta cuando se lanza manualmente.

## Límites de veracidad y economía
- El pool recibe shares del cliente de minería compatible; el endpoint de telemetría solo las consulta.
- La verificación BTC confirma la salida al destinatario configurado en la cadena; no añade automáticamente ese pago al ledger ni demuestra que toda la transacción pertenezca a Neon Orb.
- La API de 2Miners expone series de `valid`, `stale` e `invalid` para las monedas compatibles. Si no se obtiene una serie, el panel no inventa un recuento.
- Los importes de `stats.balance` y `stats.paid` se exponen como valores devueltos por la API del pool y se etiquetan como unidades de API; no se contabilizan como ingresos realizados.
- Un pago minero solo debe entrar al ledger como ingreso verificado después de contrastar una transacción/pago identificable en la red y conciliar importe, activo y destinatario.
- Coinbase Spot es un precio indicativo de mercado, no una orden ejecutable ni un precio garantizado de intercambio. Jupiter devuelve una ruta de swap cotizada y temporal; V6 no firma ni transmite la transacción ni la presenta como liquidada.
- SOL usa Proof of Stake, no minería Proof of Work. El staking de SOL es un proceso distinto y requiere delegación/una transacción autorizada; esta fase no mueve SOL.
- No existe un nodo gratuito universal que pague solo por tener un servidor conectado. La minería requiere hardware adecuado, electricidad y un pool; el trabajo remunerado requiere una tarea aceptada por un cliente/proveedor. El sistema no promete rentabilidad.

## Pruebas
`npm test` — 29 pruebas aprobadas, 0 fallidas en el entorno de trabajo de esta versión.
También se verificó sintaxis con `node --check` para servidor, adaptador y panel; `bash -n` para el script del minero y compilación sintáctica del puente Python.

## Referencias oficiales
- 2Miners ETC: https://2miners.com/etc-mining-pool
- 2Miners ayuda ETC y direcciones de pago BTC: https://etc.2miners.com/help
- 2Miners pagos en BTC para minería de altcoins: https://2miners.com/blog/get-paid-in-bitcoin-for-altcoin-mining-btc-payouts-for-gpu-mined-etc-ergo-rvn/
- API de 2Miners: https://apidoc.2miners.com/
- Coinbase Spot Price API: https://api.coinbase.com/v2/prices/BTC-USD/spot
- Jupiter Swap API (documentación): https://dev.jup.ag/docs/swap-api
- Documentación oficial de staking Solana: https://solana.com/docs/references/staking
