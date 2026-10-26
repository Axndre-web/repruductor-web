# NEON ORB — autonomía operativa residente

## Qué hace automáticamente

- El runtime, el daemon de descubrimiento y el observador de wallets se inician junto al servidor.
- El supervisor actualiza telemetría pública de balances configurados, precios de mercado y estado del pool; intervalo predeterminado: 5 minutos.
- Las oportunidades laborales y económicas siguen siendo pistas hasta que un proveedor verifica trabajo y liquidación real.
- `GET /api/neon-orb/autonomy/status` devuelve estado, permisos efectivos y señales de configuración, nunca los valores de credenciales.
- `POST /api/neon-orb/autonomy/tick` permite un ciclo manual y requiere `NEON_ADMIN_TOKEN`.

## Credenciales y autoridad

Los secretos de proveedor permanecen en el servidor y solo los consumen sus adaptadores dedicados. No se entregan al modelo, al navegador ni al registro de telemetría. Las claves privadas y frases semilla no se leen ni almacenan en este módulo. El sistema puede observar balances públicos, pero no puede firmar, retirar fondos ni hacer gasto ilimitado.

## Minería local opcional

No se incluye ni descarga un minero. Para arrancar automáticamente un minero previamente instalado, configura una sola vez en `.env`:

- `ENABLE_REAL_MINING=true`
- `NEON_MINING_AUTOSTART=true`
- `NEON_MINER_EXECUTABLE` como ruta absoluta al binario local allowlisted
- `NEON_MINER_ARGS_JSON` como array JSON de argumentos
- `NEON_MINING_POOL` y `NEON_MINING_WALLET_ADDRESS` para el pool/moneda elegidos

Los argumentos deben contener la dirección pública exacta configurada y el host del pool allowlisted. El proceso se inicia con `shell:false`, un entorno reducido y se detiene cuando se cierra el servidor. Solo se admiten binarios con nombres conocidos (XMRig, lolMiner, TeamRedMiner, NBMiner, BzMiner, GMiner, Rigel o ccminer); que un binario esté allowlisted no prueba su autenticidad: descárgalo solo desde su sitio oficial y verifica su firma/hash.

Si faltan estos ajustes, el estado será `BLOCKED_CONFIGURATION`; no se simula que se está minando. El minero debe ser compatible con el algoritmo, pool y hardware. La minería puede consumir electricidad, calentar el equipo y producir pérdidas; el panel no garantiza rentabilidad. Los pagos del pool se consideran ingresos únicamente cuando se verifican en cadena o mediante un proveedor de liquidación confiable.

## Arranque

```bash
npm install
npm test
npm start
```

Para registrar el arranque al iniciar sesión del sistema, ejecuta una vez `npm run autostart:install`. El servidor conserva el puerto de la configuración existente. No compartas el `.env` ni el ZIP que lo contiene.
