# NEON ORB — corrección de HTTP 404

## Qué se ha corregido

- Se conserva `POST /api/neon-orb/think` y se añade `POST /api/neon-orb/chat` como alias compatible.
- Ambos endpoints usan el mismo runtime residente, validan que el mensaje no esté vacío y responden JSON con `ok: true` cuando la consulta se procesa.
- El cliente reintenta con el alias si recibe un 404 en la ruta principal.
- Si ambas rutas devuelven 404, la interfaz identifica que el servidor activo no está ejecutando esta versión de la API, en lugar de mostrar un error genérico.
- Los archivos editables y los servidos de la interfaz están sincronizados.

## Cómo aplicar la versión

Un HTTP 404 en `/api/neon-orb/think` pese a que la ruta está definida normalmente indica que el navegador está conectado a un proceso antiguo, a otro puerto o a otro servidor que solo está sirviendo los archivos estáticos. La interfaz no puede registrar rutas en un proceso Node que ya está en ejecución: hay que reiniciarlo.

1. Detén el proceso Node anterior que sirve NEON PLAYER X.
2. Extrae esta versión completa en la carpeta del proyecto, conservando tu `.env`.
3. Desde esa carpeta ejecuta `npm install` si todavía no has instalado las dependencias.
4. Ejecuta `npm start` y revisa la dirección/puerto que aparece en la consola.
5. Abre esa dirección y fuerza una recarga del navegador (`Ctrl+F5`).
6. Comprueba `GET /api/neon-orb/status` y envía una consulta sencilla como `Hola, ¿estás disponible?`.

No cambies ni compartas las claves del `.env` para solucionar un 404: ese error es de enrutamiento/versión del servidor, no de autenticación del proveedor de IA.

## Validación

`node --check server.js`, `node --check UI/neon-orb-companion.js` y `npm test` pasan. Las pruebas automatizadas no sustituyen una prueba HTTP en la instalación real; esta debe hacerse tras reiniciar el proceso que sirve la aplicación.
