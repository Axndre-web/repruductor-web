# NEON PLAYER X V5.6 — EVOLUCIÓN FINAL

Base: V5.5.2, construida acumulativamente desde V5.4.

Incluye todo lo anterior y añade: Control Center, historial local de pedidos PayPal confirmados, diagnóstico de checkout, estado de reproducción/recompensas, protección de recompensas cuando la pestaña está oculta, reconexión/persistencia PWA y estructura Web3 conservada.

## Pago
El checkout dinámico usa PayPal JavaScript SDK con EUR y captura inmediata en el flujo cliente actual. Para producción, PayPal recomienda crear/capturar órdenes en servidor y no confiar en importes enviados desde el navegador. Esta V5.6 deja el frontend preparado para conectar posteriormente `/api/orders` y `/api/orders/:id/capture`.

## Seguridad Web3
Phantom es opcional. No se solicitan ni almacenan semillas, claves privadas ni contraseñas.

## Regla de evolución
No se elimina radio, Media Player, tienda, carrito, WhatsApp, PayPal, PWA, icono Doberman, temas, recompensas ni Web3.


## V5.6.1 — NEON ADS NETWORK
- `ads.json` soporta active, text, subtext, link, image, button, priority y target.
- Los anuncios activos se cargan dinámicamente.
- Los enlaces externos usan `noopener noreferrer`.
- Si `ads.json` falla, el resto de la aplicación continúa funcionando.
