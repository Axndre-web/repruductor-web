# NEON ORB — autonomía residente y minería supervisada

## Qué funciona en automático

- El runtime de NEON ORB y el daemon residente se inician con el servidor.
- El daemon descubre ofertas públicas y oportunidades configuradas, reconcilia contabilidad y registra actividad. Las ofertas son pistas, no ingresos confirmados.
- El observador de wallets consulta saldos públicos configurados; las extensiones de navegador siguen sujetas a sus permisos.
- El supervisor de minería se evalúa al arrancar cuando `NEON_MINING_AUTOSTART=true`.

## Activación del minero local

El paquete **no incluye ni descarga** ejecutables de minería. El supervisor solo permite un perfil fijo ETC/ETCHash contra `stratum+tcp://etc.2miners.com:1010`, con `shell:false`, sin comandos libres y con un entorno de proceso reducido que no hereda tokens/API keys de la aplicación.

Para empezar a enviar shares hacen falta, una sola vez:

1. Hardware compatible y un minero obtenido y verificado por el operador desde su fuente oficial.
2. `NEON_MINER_BIN` con ruta absoluta a ese ejecutable.
3. `NEON_MINING_WALLET_ADDRESS` con una dirección pública de pago compatible (ETC `0x…` o BTC si se usa el esquema de pago BTC del pool).
4. `NEON_MINING_POOL=etc`, `NEON_MINING_AUTOSTART=true` y un nombre de worker válido.
5. Reiniciar el servidor; desde entonces el supervisor intenta arrancar el minero al iniciar el proceso.

Si falta una condición, el estado será `BLOCKED_CONFIGURATION` y no lanzará nada. El supervisor no descarga software, no genera claves, no usa frases semilla ni firma transacciones. No se debe utilizar la dirección SOL para pagos ETC/BTC.

## Endpoints

- `GET /api/neon-orb/autonomy/overview` — estado local integrado de daemon, observador de wallets, minería y políticas económicas.
- `GET /api/neon-orb/mining/worker` — estado local de supervisor, sin revelar la dirección completa.
- `POST /api/neon-orb/mining/worker/start` — inicio manual protegido por `NEON_ADMIN_TOKEN`.
- `POST /api/neon-orb/mining/worker/stop` — parada protegida por `NEON_ADMIN_TOKEN`.

El estado del worker es telemetría local; no prueba rentabilidad ni pago. Para confirmar ingresos, verifica los shares/pagos del pool y las transacciones de pago en la cadena.

## Límites económicos

El descubrimiento y la planificación pueden ser automáticos. Las banderas `NEON_ALLOW_SPENDING`, `NEON_ALLOW_SIGNING` y `NEON_ALLOW_WITHDRAWALS` siguen en `false`. No se ha habilitado la firma automática, la custodia de claves ni los retiros: permitirlos globalmente a un agente que investiga la web sería exponer las credenciales y fondos a instrucciones maliciosas o errores del modelo. La minería consume electricidad, desgasta hardware y puede producir pérdidas; no hay beneficio garantizado.

## Seguridad de credenciales

El minero recibe solo variables de entorno básicas para el runtime y GPU, no los tokens de NEON ORB ni credenciales de proveedores. No guardes claves privadas, frases semilla ni contraseñas en `.env` para este flujo. Usa solo direcciones públicas de pago.
