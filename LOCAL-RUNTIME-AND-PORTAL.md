# NEON ORB — Portal exterior y runtime local

## Arquitectura

- **Runtime privado:** Node.js/Express en `http://127.0.0.1:3000`. Este proceso mantiene el agente, telemetría y conectores con salida a internet.
- **Portal exterior:** el navegador llama a rutas `/api/neon-orb/*` del servidor local. El servidor consulta únicamente destinos HTTPS incluidos en `server/network-sandbox.js`, con timeout, límite de tamaño, validación DNS y bloqueo de direcciones privadas. No es un proxy genérico ni acepta URLs arbitrarias.
- **Frontend GitHub Pages:** solo presenta las vistas estáticas que se copien a `github-pages-sync/`. No puede arrancar Node, acceder a `.env`, ejecutar el daemon local ni actuar como puente hacia el equipo del usuario. Para telemetría remota se necesitaría desplegar un backend HTTPS separado y protegido.

## Arranque local

1. Instala Node.js 22 o superior.
2. En la carpeta del proyecto ejecuta `npm install`.
3. Si no existe `.env`, copia `.env.example` a `.env`. No reemplaces un `.env` que ya contenga configuración propia.
4. Mantén `PORT=3000`, `HOST=127.0.0.1`, `NEON_ALLOW_LAN_ACCESS=false`.
5. Ejecuta `npm start` y abre `http://127.0.0.1:3000`.
6. Comprueba `http://127.0.0.1:3000/healthz` y después usa **Portal / Agujero Negro** dentro de Ecosystem Bridge.

## Credenciales, identidad y billeteras

- `.env` es solo para claves API de proveedores y tokens de administración. Está excluido de Git por `.gitignore`; nunca copiarlo a `public/` ni a `github-pages-sync/`.
- Usa claves API con permisos mínimos, revócalas si se filtran y no reutilices contraseñas. Para `NEON_ADMIN_TOKEN`, genera un secreto aleatorio de al menos 32 caracteres y mantenlo solo en `.env` local.
- **No introduzcas ni guardes frases semilla, claves privadas, archivos keystore descifrados, códigos 2FA ni contraseñas en NEON ORB, el navegador, los registros o GitHub.** Las frases semilla deben permanecer fuera del agente, preferiblemente en respaldo físico seguro.
- La billetera se observa mediante direcciones públicas o conexión de wallet del navegador. La firma y el envío de transacciones deben realizarse en la wallet titular con confirmación humana.
- Nunca permitas que un agente se apropie de identidad, suplante a una persona, complete verificaciones KYC en su nombre o acepte contratos sin aprobación expresa.

## Alcance operativo

La búsqueda web y de ofertas consulta fuentes públicas integradas. Los resultados son pistas; no garantizan exactitud, contratación ni ingresos. El portal no accede a redes clandestinas, no evita CAPTCHA, no descarga/ejecuta código remoto y no realiza acciones financieras.

## GitHub Pages

Publica únicamente el contenido estático de `github-pages-sync/`. Las funciones que dependen de `/api/*` estarán no disponibles si no existe un backend propio. No publiques `.env`, `keypair`, bases de datos, logs ni archivos privados.
