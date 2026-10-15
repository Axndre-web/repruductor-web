# NEON ORB: CYBER POWER SLOTS

## Alcance

El módulo arcade usa exclusivamente `DEMO_CREDITS`. Sus saldos e historial se mantienen separados del ledger económico, la identidad de Neon Orb y cualquier billetera. Los créditos no representan dinero, no se pueden retirar y no se envían transacciones on-chain.

## Persistencia

- `localStorage`: guarda el saldo, las últimas 20 tiradas y una identidad local de dispositivo.
- API Node del proyecto (puerto configurado por `PORT`, normalmente 3000):
  - `GET /api/arcade/state?deviceId=...` recupera saldo e historial del ledger demo aislado.
  - `POST /api/arcade/state` sincroniza una instantánea de saldo.
  - `POST /api/arcade/spin` guarda una tirada demo y su resultado.
- Puente Python NEON-LIM (puerto `NEON_BRIDGE_PORT`; el frontend prueba 8787 y 8765): `GET/POST /arcade/state` utiliza `neon-arcade-demo.state.json`, separado del archivo de estado del runtime.

Si no existe un saldo, es inválido o es cero al cargar, se asignan 100 créditos de cortesía. Esta recarga es deliberadamente una regla de demostración, no un mecanismo de saldo monetario.

## Archivos espejados

Las versiones de `index.html`, `style.css`, `core/slot-engine.js` y `UI/arcade-slot-machine.js` están sincronizadas entre la raíz y `public/`, para soportar tanto un servidor estático desde la raíz como Express sirviendo `public/`.

## Verificación

Ejecutar `npm test`. Las pruebas de `tests/arcade-demo-ledger.test.mjs` verifican saldo inicial, persistencia, reinicio de cortesía y validación. La disponibilidad real del puente Python depende de que el proceso esté iniciado y acepte conexiones locales.
