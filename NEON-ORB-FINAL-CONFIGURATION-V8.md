# Neon Orb V8 — configuración operativa

## Identidad y configuración
- Neon Orb sigue siendo la identidad del runtime, el daemon y los registros económicos.
- El `.env` de esta entrega conserva los valores del entorno aportado y añade un token de administración aleatorio de 256 bits. No publiques ni compartas ese archivo.
- Las rutas mutables requieren `Authorization: Bearer <NEON_ADMIN_TOKEN>` y fallan cerradas si el token no está configurado o es débil.
- El daemon inicia en segundo plano y descubre fuentes públicas cada hora. Remotive queda cacheado al menos seis horas, siguiendo su recomendación de no superar cuatro consultas al día.

## Fuentes conectadas
- Arbeitnow: API pública de anuncios de empleo; no es un procesador de pagos.
- Remotive: API pública de trabajos remotos; se conserva el enlace y la atribución a Remotive.
- Jobicy: API pública de trabajos remotos; se conserva la URL canónica y se cachea la respuesta.
- Gitcoin y HackerOne: catálogo de oportunidades de recompensa, revisión manual; no se ejecutan acciones de seguridad ni se envían informes automáticamente.
- Upwork y Toloka: requieren cuenta y condiciones de acceso; no se simula conexión de trabajador.

Los resultados de feeds públicos se guardan como `LEAD_ONLY_REQUIRES_HUMAN_REVIEW`. No se transforman en contratos, ingresos, pagos ni tareas aceptadas. Las APIs públicas de anuncios de empleo no proporcionan por sí mismas un endpoint de ejecución de trabajo o de cobro.

## Endpoints útiles
- `GET /api/neon-orb/work-sources`: catálogo y estado de integración.
- `GET /api/neon-orb/work-opportunities?q=developer&remote=true&limit=30`: consulta actualizada de anuncios.
- `GET /api/neon-orb/work-leads`: pistas conservadas por el daemon.
- `GET /api/neon-orb/daemon`: estado del daemon y contabilidad.
- `GET /api/neon-orb/mining/status?pool=etc`: telemetría del pool; requiere una dirección pública ETC/BTC compatible para métricas de cuenta.
- `GET /api/neon-orb/wallet/observed`: saldos observados de las direcciones configuradas.

## Economía y minería
- El modo de ejecución permanece `READ_VERIFY_ONLY` y los permisos de gasto, firma y retirada están desactivados.
- El descubrimiento está activo, pero no hay autoaplicaciones ni ejecución de tareas de terceros: los anuncios requieren contrato, cuenta, criterios de aceptación y mecanismo de pago propios.
- El pool configurado es 2Miners ETC, solo para telemetría. No se configura una wallet de minería automáticamente, porque la dirección Solana no sirve como dirección ETC/BTC. La dirección BTC no se inventa ni se rellena con un ejemplo.
- Los precios de mercado y las cotizaciones de intercambio son indicativos hasta que una operación se ejecute y se confirme on-chain.

## Validación
Suite automatizada: 36 pruebas aprobadas en esta revisión. Se comprobaron sintaxis JS, compilación Python, fuentes laborales normalizadas, telemetría, contabilidad y verificaciones de liquidación. No se pudo demostrar un contrato remunerado ni un pago real desde este entorno.
