# NEON ORB — Ecosystem Bridge (v2 · local outbound portal)

## Separación de capas
- `server.js` + `server/`: runtime privado local, agente residente, telemetría y conectores externos.
- `public/`: interfaz que sirve el runtime local en `http://127.0.0.1:3000`.
- `github-pages-sync/`: frontend estático público, sin secretos ni backend.
- `UI/ecosystem-bridge.*`: panel Portal / Agujero Negro, búsquedas web y de ofertas por rutas same-origin.

## Portal exterior
La interfaz llama a `/api/neon-orb/network/search` y `/api/neon-orb/jobs/search`. El backend consulta fuentes permitidas mediante `server/network-sandbox.js`: HTTPS, allowlist finita, DNS público, sin redirecciones, timeout y límite de respuesta. No se admite proxy de URL arbitraria, fetch de direcciones privadas ni ejecución de código descargado.

## Arranque
1. Node.js 22+; `npm install`.
2. Copia `.env.example` a `.env` solo si aún no existe; no sobrescribas configuración propia.
3. Mantén `PORT=3000`, `HOST=127.0.0.1`, `NEON_ALLOW_LAN_ACCESS=false`.
4. `npm start`; abre `http://127.0.0.1:3000`.
5. Comprueba `/healthz` y usa Portal / Agujero Negro.

## GitHub Pages
GitHub Pages sirve solo el frontend. No ejecuta daemon, Node, API, ni puede leer el `.env` local. En la página pública las consultas del portal aparecerán como backend no disponible salvo que se configure otro backend HTTPS, protegido y con CORS exacto.

## Secretos
`.env` queda local y fuera de la copia estática. Nunca guardar ni solicitar al agente seed phrases, claves privadas, contraseñas, 2FA o documentos KYC. Wallets en lectura; la firma/transacción se confirma desde la wallet titular. El agente no suplanta identidades ni acepta contratos sin autorización.
