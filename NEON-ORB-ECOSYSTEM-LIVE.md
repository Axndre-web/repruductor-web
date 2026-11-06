# NEON ORB — Ecosistema observable y oportunidades públicas

## Qué incorpora esta entrega
- Consola responsive de telemetría que consulta los endpoints locales existentes (`/api/neon-orb/control/status`, `/api/neon-orb/network/status` y `/api/neon-orb/mining/status`).
- Buscador de oportunidades públicas usando `/api/neon-orb/work-opportunities`; las ofertas son pistas, no ingresos confirmados. La solicitud y aceptación siguen siendo manuales.
- Panel informativo de cripto/donaciones en modo no custodial. Esta entrega no expone claves privadas, no firma transacciones y no envía fondos.
- Fuentes de investigación enlazadas a servicios públicos legítimos. No se integra acceso a dark web, mercados clandestinos, credenciales ajenas ni evasión de controles.

## Límites técnicos verificables
- GitHub Pages sirve archivos estáticos y no ejecuta Node/Express ni `/api/*`. Para telemetría y búsqueda dinámica, despliega el backend `server.js` en un host Node.js y configura el mismo origen o un proxy HTTPS/CORS restringido.
- El panel distingue API no disponible de actividad confirmada; no inventa hashrate, balances, trabajos, donaciones ni transacciones.
- Las métricas de minería existentes son de observación de pools. No significan que el equipo esté minando.
- Para recibir donaciones, configura direcciones públicas por red en el backend y valida red/activo antes de mostrarlas. Nunca guardes seed phrases o claves privadas en el frontend ni en Git.
- Las acciones financieras y pagos deben requerir consentimiento humano explícito, revisión de red, límites y verificación de liquidación.

## Publicación
1. Mantén copia de seguridad del repositorio y `.env`.
2. Despliega la carpeta completa del proyecto en un entorno Node compatible (`npm install`, `npm test`, `npm start`).
3. Publica `github-pages-sync/` únicamente como frontend estático si mantienes GitHub Pages.
4. Configura la URL HTTPS del backend mediante el proxy de tu hosting; no publiques secretos.
5. Comprueba en producción cada endpoint y la consola desde Android, iOS, tablet y escritorio.

## Estado de esta entrega
La interfaz se integra en la base del proyecto y usa APIs ya existentes. La conectividad real externa depende de desplegar el backend y de la disponibilidad/condiciones de cada proveedor; no se afirma que haya ingresos, donaciones ni actividad minera.
