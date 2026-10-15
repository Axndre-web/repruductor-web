# Neon Orb: integración de configuración local

Neon Orb lee la configuración local mediante `server/load-env.js` y el archivo `.env` existente. El endpoint `GET /api/neon-orb/runtime-readiness` resume capacidades y bloqueos efectivos sin devolver valores secretos, dirección de la billetera ni URL del RPC.

## Modo efectivo

El daemon puede descubrir oportunidades públicas y mantener el registro económico. Las ofertas descubiertas son pistas, no contratos ni ingresos. La contabilidad solo debe reconocer importes respaldados por evidencia de liquidación verificada.

La configuración actual mantiene bloqueados el gasto, la firma y los retiros si `NEON_ALLOW_SPENDING`, `NEON_ALLOW_SIGNING` o `NEON_ALLOW_WITHDRAWALS` no están en `true`. La autorización conversacional no cambia por sí sola estas barreras del entorno. No se cambia automáticamente ninguna de esas variables ni se ejecutan pagos, transacciones, firmas o retiros como parte del arranque.

## Cuentas y proveedores

La presencia de credenciales de PayPal o Stripe se muestra como un booleano; no demuestra autenticación ni aprobación comercial. Las variables de API que no existen en `.env` se informan como faltantes en `GET /api/neon-orb/account-readiness`. Las cuentas externas, KYC y webhooks requieren completar los flujos oficiales del proveedor.

## Comprobación

- `GET /healthz`: disponibilidad del servidor.
- `GET /api/neon-orb/account-readiness`: estado de preparación de integraciones.
- `GET /api/neon-orb/runtime-readiness`: capacidades y bloqueos derivados del entorno.
- `GET /api/neon-orb/work-leads`: oportunidades detectadas; no son ingresos.

Todos los endpoints de estado son de solo lectura y deben servirse detrás de HTTPS en producción.
