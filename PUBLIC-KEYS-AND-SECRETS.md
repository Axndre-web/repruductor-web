# Claves públicas y secretos de NEON PLAYER X

- `PUBLIC-KEYS.env` contiene únicamente direcciones/identificadores públicos de wallets detectados en la configuración local. Se conserva en el paquete para que NEON ORB pueda reconocerlos como identidades públicas.
- `.env` permanece en la instalación local y no se distribuye: mezcla identificadores públicos con tokens, secretos de sesión y permisos operativos.
- `keypair.json` y `keypair.js` no se distribuyen porque su nombre/formato no permite garantizar que contengan exclusivamente material público. No se eliminan de tu instalación original.
- El runtime local continúa leyendo `.env`; no copies `PUBLIC-KEYS.env` encima de `.env`.
- Nunca se debe enviar una clave privada, frase semilla, JWT, token administrativo o secreto de proveedor al navegador, a GitHub Pages ni a registros.
- Las conexiones se muestran como verificadas solo después de una comprobación real del proveedor. La mera presencia de una credencial no demuestra conectividad.
