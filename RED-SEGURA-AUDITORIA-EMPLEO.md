# NEON PLAYER X — Red segura, auditoría estática y oportunidades

## Capacidades

- `GET /api/neon-orb/network/status`: modo de red, lista permitida y últimas tareas.
- `GET /api/neon-orb/network/search?q=...`: consulta de respuestas instantáneas públicas de DuckDuckGo. No es un índice exhaustivo.
- `GET /api/neon-orb/jobs/search?q=...`: consulta de ofertas públicas de Remotive y Arbeitnow. Son pistas, no garantía de empleo o remuneración; no se envían solicitudes.
- `POST /api/neon-orb/security/audit`: análisis estático local, solo lectura; requiere `Authorization: Bearer <NEON_ADMIN_TOKEN>` con token de al menos 32 caracteres.
- `GET /healthz`: salud del servidor. Al arrancar se comprueban estos endpoints y se registra el resultado en consola/telemetría.

## Aislamiento y límites

El cliente de red solo admite HTTPS y hosts de una lista cerrada (`api.duckduckgo.com`, `remotive.com`, `www.arbeitnow.com` y `api.github.com`), rechaza credenciales URL, puertos alternativos, redirecciones, direcciones IP privadas/reservadas, respuestas no JSON y cuerpos superiores a 1 MB; las solicitudes tienen timeout. No existe una ruta que acepte una URL arbitraria del navegador. Las peticiones están limitadas por IP.

La auditoría recorre archivos locales de código admitidos, omite `.env`, archivos de claves y directorios de dependencias/build, limita el tamaño y número de archivos y nunca ejecuta el código inspeccionado. Sus reglas son heurísticas y pueden producir falsos positivos/negativos; no sustituye una auditoría profesional ni análisis dinámico. No incluye escaneo de hosts externos.

## Configuración y seguridad

- Mantener `NEON_ADMIN_TOKEN` aleatorio, largo (32+ caracteres), privado y fuera del control de versiones.
- Mantener claves privadas/seed phrases fuera de la interfaz y no añadir secretos al repositorio.
- La capa de red no firma ni transmite transacciones blockchain, no altera el comportamiento de las wallets, no envía candidaturas ni realiza acciones económicas.
- Las variables nuevas documentadas en `.env.example` son descriptivas y opcionales. La implementación usa límites internos conservadores; no se habilita una lista de hosts configurable por petición.
- El dashboard refresca el estado cada 5 segundos y permite lanzar búsquedas. El botón de auditoría solicita el token en memoria y no lo persiste.

## Pruebas

Ejecutar `npm test`. Las pruebas nuevas cubren rechazo de destinos de red no permitidos y detección estática sin leer secretos. También comprobar `node --check server.js`, `node --check server/network-sandbox.js`, `node --check server/security-audit.js` y `node --check server/network-operations.js`.
