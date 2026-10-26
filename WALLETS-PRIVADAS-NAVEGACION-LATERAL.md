# NEON ORB — Wallets privadas y navegación lateral

- La navegación pasa a una barra lateral en escritorio y una banda horizontal deslizable en móvil. Todos los enlaces conservan los IDs de sección existentes.
- El servidor escucha en `127.0.0.1:3000` por defecto. Para exponerlo a la LAN hay que establecer explícitamente `NEON_ALLOW_LAN_ACCESS=true` y configurar `HOST`; no se recomienda sin HTTPS y autenticación adicional.
- `GET /api/neon-orb/wallet/observed` exige `Authorization: Bearer <NEON_ADMIN_TOKEN>`. Los resultados no se cachean y no contienen claves privadas.
- El token de administración se introduce en el panel y solo se conserva en memoria de la página; no se escribe en localStorage, cookies ni archivos.
- Phantom y wallets EVM solo se conectan tras pulsar el botón correspondiente y aprobar el diálogo de la extensión. Solo se leen direcciones públicas y balances; no se firman transacciones.
- El saldo SOL de Phantom se consulta mediante Solana JSON-RPC público. Ethereum/Base se consulta con `eth_getBalance` a través del proveedor autorizado de la wallet; se muestra la cadena detectada.
- La conexión de una cuenta no demuestra por sí sola titularidad legal ni sincroniza otras cuentas de forma oculta. El usuario elige y autoriza cada conexión.
- No introducir nunca seed phrases ni claves privadas en NEON ORB.
