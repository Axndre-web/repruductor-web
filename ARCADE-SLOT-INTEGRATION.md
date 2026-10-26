# Integración Arcade 100 Power Hot

- El gabinete se monta automáticamente en `#slot-zone` al cargar el DOM.
- Los estilos del gabinete están integrados en `style.css`; `public/style.css` se mantiene sincronizado para el servidor Express.
- `core/slot-engine.js` y `UI/arcade-slot-machine.js` son las fuentes de desarrollo; sus copias servidas están en `public/core/` y `public/UI/`.
- La interfaz consulta `GET /healthz` y `GET /api/economy/accounting` en el mismo origen cada 15 segundos para mostrar la disponibilidad real del backend.
- Las tiradas usan exclusivamente créditos virtuales locales (`localStorage`, clave `neon_arcade_demo_credits_v1`). No debitan ni acreditan el ledger financiero, la billetera, PayPal, Stripe o Solana. Los jackpots visibles son ilustrativos y no representan fondos disponibles.
- El ledger económico se consulta solo en modo lectura. Se mantienen intactas las variables de entorno, las claves, la identidad/gobernanza y los módulos del motor autónomo.

## Verificación

Ejecutar `npm test`. El módulo requiere un navegador moderno con soporte para módulos ES y `fetch` del mismo origen. Para que el estado del puente sea real, servir el sitio desde el servidor de la aplicación; abrir el HTML como `file://` no permite verificar los endpoints.
