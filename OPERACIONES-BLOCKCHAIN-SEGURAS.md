# Operaciones blockchain con control de seguridad

Esta versión añade una capa de preparación y verificación de comisiones, no un firmante custodial.

## Endpoints
- `GET /api/neon-orb/operations/status`: indica la política activa.
- `POST /api/neon-orb/operations/evm-preflight`: comprueba cadena, saldo del emisor, estimación de gas, margen del 20 % y reserva configurada. Responde `200` si el saldo cubre valor + gas + reserva, o `409` si no alcanza.

Ejemplo del cuerpo de preflight (direcciones públicas):
```json
{
  "from": "0x1111111111111111111111111111111111111111",
  "to": "0x2222222222222222222222222222222222222222",
  "valueWei": "0",
  "data": "0x",
  "chainId": 1
}
```

## Variables
- `NEON_CHAIN_WRITES_ENABLED=false`: predeterminado seguro. Si se establece `true`, solo cambia el indicador de política; **no activa firma ni envío** en este paquete.
- `NEON_EVM_CHAIN_ID=1`: cadena esperada (Ethereum Mainnet). Para Base, cambia a `8453` y configura `ETHEREUM_RPC_ENDPOINT` con el RPC de Base. No se debe permitir que la petición del cliente elija arbitrariamente el RPC.
- `ETHEREUM_RPC_ENDPOINT=https://ethereum-rpc.publicnode.com`: endpoint RPC fijo en el servidor.
- `NEON_EVM_MIN_RESERVE_WEI=0`: reserva mínima adicional en wei; configura un valor mayor si necesitas mantener gas para operaciones futuras.

## Flujo operativo recomendado
1. Construir una transacción concreta y mostrar destino, red, valor y calldata.
2. Ejecutar el preflight inmediatamente antes de solicitar la firma.
3. Si el saldo es insuficiente o el RPC falla, abortar; no reintentar con otro destino ni reducir el importe automáticamente.
4. Mostrar la transacción completa en Phantom u otra wallet compatible y requerir que el usuario la apruebe explícitamente.
5. Verificar el hash/recibo después de la emisión y registrar el resultado sin guardar claves privadas.

Este release **no contiene un endpoint que firme o transmita transacciones**, no lee semillas ni claves privadas, y no ejecuta transferencias autónomas. Para operaciones reales, la firma se mantiene en la wallet externa y cada transacción debe ser revisada y autorizada por el usuario. La bandera de entorno no debe interpretarse como permiso para gastos autónomos.
