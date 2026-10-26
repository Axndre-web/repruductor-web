# NEON ORB — telemetría Bitcoin, pool y nodo local

Esta actualización reutiliza la telemetría de pool existente y añade una vista coordinada de la red Bitcoin, más un conector opcional y estrictamente de solo lectura para Bitcoin Core local.

## Endpoints

- `GET /api/neon-orb/bitcoin/status`: altura pública, tamaño de mempool, tarifas recomendadas y estado del nodo Bitcoin Core opcional.
- `GET /api/neon-orb/mining/pools`: catálogo existente de pools admitidos.
- `GET /api/neon-orb/mining/status`: estadísticas del pool configurado y datos de cuenta si la dirección pública del pool está configurada.
- `GET /api/neon-orb/autonomy/status`: estado del supervisor, incluyendo el último estado de telemetría Bitcoin.

## Pool reutilizado

La configuración original selecciona `NEON_MINING_POOL=etc`, con telemetría pública de 2Miners ETC. El pool puede admitir pagos en BTC si se configuran correctamente el proveedor y la dirección de pago; esto no es minería nativa de Bitcoin. No se cambia el pool ni se altera el `.env` original automáticamente. Si no existe dirección de pago, la cuenta del trabajador no puede consultarse y se informa como pendiente de configuración.

## Bitcoin Core local opcional

Configura en el `.env` local (no en el repositorio público):

```dotenv
BITCOIN_RPC_URL=http://127.0.0.1:8332/
BITCOIN_RPC_USER=usuario_rpc
BITCOIN_RPC_PASSWORD=contraseña_rpc
```

Alternativamente, usa `BITCOIN_RPC_COOKIE_FILE=/ruta/absoluta/al/.cookie` y no configures usuario/contraseña. El conector solo admite loopback (`127.0.0.1`, `localhost` o `::1`), y únicamente llama a `getblockchaininfo`, `getnetworkinfo` y `getmempoolinfo`. No llama a métodos de wallet, no lee claves, no firma, no transmite y no mueve fondos. Las credenciales nunca aparecen en respuestas API.

Si Bitcoin Core no está instalado/encendido o la autenticación no está configurada, la interfaz seguirá mostrando la telemetría pública y marcará el nodo local como no configurado/no disponible, sin fingir conexión.

## Verificación

La interfaz de mando consulta `/api/neon-orb/bitcoin/status` junto al estado del pool y el mercado. El supervisor residente también registra la última observación Bitcoin en su estado. Los datos públicos dependen de la disponibilidad de mempool.space. Los valores de pool son telemetría del proveedor y no se contabilizan como ingresos realizados hasta verificar su liquidación.
