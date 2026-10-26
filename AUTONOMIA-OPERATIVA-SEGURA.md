# NEON PLAYER X + NEON ORB — Capa de autonomía operativa acotada

## Qué incorpora

- `server/autonomy/operations.js`: estado operativo, búsqueda web Brave con endpoint fijo, límite de tiempo/tamaño, HTTPS obligatorio y redirecciones denegadas; auditoría estática local que no lee `.env`, archivos de credenciales ni dependencias instaladas.
- `POST /api/neon-orb/autonomy/search`: búsqueda web de solo lectura; requiere `NEON_ADMIN_TOKEN` válido y `BRAVE_SEARCH_API_KEY` configurada.
- `POST /api/neon-orb/autonomy/audit`: análisis estático local; requiere token de administración.
- `POST /api/neon-orb/autonomy/jobs`: descubre ofertas públicas remotas usando fuentes existentes; requiere token de administración. No presenta ofertas como ingresos ni solicita empleos automáticamente.
- `GET /api/neon-orb/autonomy/status`: estado agregado de tareas, configuración y capacidades sin exponer secretos.
- Panel de telemetría en Wallet que consulta el estado cada cinco segundos y permite iniciar las tareas manualmente.
- Comprobación de estado de autonomía al arrancar el servidor.

## Configuración

1. Usa Node.js 22 o superior e instala dependencias con `npm install`.
2. Conserva tu `.env` local. Añade `BRAVE_SEARCH_API_KEY` con una clave válida de Brave Search API para habilitar búsqueda web. No pegues la clave en el panel ni en el código.
3. Configura `NEON_ADMIN_TOKEN` con un valor aleatorio fuerte de al menos 32 caracteres. El panel lo mantiene solo en memoria de la página actual y no lo guarda en `localStorage`.
4. Arranca con `npm start`; la aplicación conserva el puerto definido por `PORT` y el host definido por `HOST`.
5. Ejecuta `npm test` para todas las pruebas y `npm run audit:local` para el análisis estático desde terminal.

## Límites de seguridad

- No se acepta una URL arbitraria suministrada por el usuario; la búsqueda usa un único endpoint HTTPS predefinido.
- No se siguen redirecciones en el broker de búsqueda ni en las fuentes de empleo incorporadas.
- La búsqueda y las ofertas son operaciones de lectura. No se ejecuta código remoto, no se aplican ofertas, no se firman transacciones y no se mueven fondos.
- La auditoría estática es heurística: puede producir falsos positivos y no encontrar todos los defectos. No sustituye una revisión profesional, un SAST completo ni pruebas dinámicas autorizadas.
- Los hallazgos se limitan a archivos fuente permitidos y excluyen `.env`, directorios de dependencias y nombres/rutas de credenciales conocidos.
- El estado se expone sin claves y con `Cache-Control: no-store`; las operaciones de administración exigen token.
- La protección de red de la aplicación no sustituye el aislamiento de sistema operativo. Para analizar código no confiable, usa un contenedor/VM independiente sin secretos, con límites de CPU/memoria y red restringida.

## Endpoints

- `GET /healthz`
- `GET /api/neon-orb/autonomy/status`
- `POST /api/neon-orb/autonomy/search` — JSON: `{ "query": "...", "count": 8 }`
- `POST /api/neon-orb/autonomy/audit` — JSON opcional: `{ "maxFiles": 2500 }`
- `POST /api/neon-orb/autonomy/jobs` — JSON: `{ "query": "...", "remoteOnly": true, "limit": 12 }`

Para las rutas POST, enviar `Authorization: Bearer <NEON_ADMIN_TOKEN>` y `Content-Type: application/json`.

## Interpretación de resultados

Los resultados web son referencias, no hechos verificados. Las ofertas son pistas públicas y no garantizan contratación ni pago. Los hallazgos son coincidencias de reglas y requieren triage humano. La presencia de una variable de entorno no demuestra autenticación o disponibilidad real del proveedor.
