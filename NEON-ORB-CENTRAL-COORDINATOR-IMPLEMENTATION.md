# NEON ORB — Coordinador central del ecosistema

## Alcance incorporado
- Inventario central de 17 módulos internos con existencia, tamaño y fecha de modificación.
- Diagnóstico agregado de runtime, daemon, supervisor, economía, minería, radio y operaciones de red.
- Estado de proveedores diferenciado: `NOT_CONFIGURED` y `CONFIGURED_UNVERIFIED`. Configurar credenciales nunca equivale a tener una conexión verificada.
- Panel de control sincronizado con `/api/neon-orb/ecosystem` y contador de módulos disponibles.
- Copias de seguridad locales con manifiesto, permisos restrictivos y exclusión de `.env`, keypairs, dependencias y carpetas internas sensibles.
- Restauración explícita de hasta 30 rutas incluidas en el manifiesto, protegida por admin token, validación anti traversal y copia de recuperación automática.

## API
- `GET /api/neon-orb/ecosystem`: diagnóstico agregado de solo lectura.
- `GET /api/neon-orb/maintenance/backups`: lista de copias (admin).
- `POST /api/neon-orb/maintenance/backup`: crea copia (admin).
- `POST /api/neon-orb/maintenance/rollback`: restaura rutas seleccionadas (admin), body `{ "backupId": "...", "paths": ["server/archivo.js"] }`.

## Límites de seguridad
El coordinador no ejecuta código arbitrario, no firma transacciones, no mueve fondos, no modifica permisos de proveedores y no considera un proveedor conectado por el mero hecho de tener credenciales configuradas. Las modificaciones automáticas quedan fuera de esta fase: requieren propuesta, revisión, autorización y pruebas. La restauración es por rutas explícitas, nunca una sustitución ciega de todo el proyecto.

## Verificación
`node --check server.js`, `node --check server/eco-coordinator.js` y `node --test tests/eco-coordinator.test.mjs`.
