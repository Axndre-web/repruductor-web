# Integración NEON ORB: CYBER POWER SLOTS

- El gabinete se monta automáticamente en `#slot-zone` al cargar el DOM.
- Los estilos del gabinete están integrados en `style.css`; `public/style.css` se mantiene sincronizado para el servidor Express.
- `core/slot-engine.js` y `UI/arcade-slot-machine.js` son las fuentes de desarrollo; sus copias servidas están en `public/core/` y `public/UI/`.
- La interfaz consulta `GET /healthz` y `GET /api/economy/accounting` en el mismo origen cada 15 segundos para mostrar la disponibilidad real del backend.
- Las tiradas usan exclusivamente créditos virtuales (`DEMO_CREDITS`): `localStorage`, un ledger arcade aislado del servidor y sincronización opcional con el puente Python (`/arcade/state`, puertos probados 8787 y 8765). Un saldo ausente o cero se restablece a 100 créditos de cortesía. No se debita ni acredita el ledger financiero, la billetera, PayPal, Stripe o Solana. Las tarjetas superiores son decorativas y no representan fondos disponibles.
- El ledger económico se consulta solo en modo lectura. Se mantienen intactas las variables de entorno, las claves, la identidad/gobernanza y los módulos del motor autónomo.

## Verificación

Ejecutar `npm test`. El módulo requiere un navegador moderno con soporte para módulos ES y `fetch` del mismo origen. Para comprobar sincronización en servidor, ejecutar `npm install` y `npm start`; para la sincronización Python, iniciar `neon-lim.bridge.py` con el puerto configurado. Abrir el HTML como `file://` no permite verificar los endpoints.
