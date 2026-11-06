# NEON ORB — Coordinación privada del ecosistema

## Objetivo
NEON ORB actúa como coordinador técnico de NEON PLAYER X sin sustituir ni eliminar los subsistemas existentes. La interfaz pública del reproductor permanece intacta. El espacio operativo independiente se sirve desde `private/neon-orb-console.html` mediante `/orb-private` y no está dentro de `public/`.

## Acceso y privacidad
- Solo loopback (`127.0.0.1` / `localhost`) y petición same-origin.
- No se publica un enlace en la interfaz principal.
- `Cache-Control: no-store` y `X-Robots-Tag: noindex, nofollow, noarchive`.
- La consola consulta estados agregados existentes; no recibe valores de secretos, claves privadas, tokens, frases semilla, direcciones privadas ni URLs RPC con credenciales.
- La configuración `.env` local se conserva como configuración privada. `.env` continúa excluido de Git. Nunca copiarlo a `public/`, al navegador, a logs o a repositorios.

## Alcance de coordinación
La consola agrega el estado del runtime, agente, supervisor de autonomía, red, motor económico, contabilidad, radio, worker de minería y preparación de proveedores. La vista se actualiza cada 30 segundos y no altera la UI del reproductor.

## Límites de autonomía
NEON ORB puede investigar fuentes públicas permitidas, observar telemetría, diagnosticar y proponer mejoras dentro de los permisos existentes. No se concede ejecución arbitraria de comandos, exploración de redes privadas, scraping contrario a las reglas de un servicio, creación automática de cuentas, firma o difusión de transacciones, pagos ni retiros. Las credenciales se usan únicamente en adaptadores del servidor y solo para el proveedor y propósito configurados. Las claves públicas pueden mantenerse para observación e identificación pública; nunca se confunden con secretos.

## Integridad y recuperación
- No se borraron ni migraron los datos existentes.
- Los motores y registros económicos existentes siguen siendo las fuentes de verdad de sus respectivos dominios.
- Las modificaciones del agente siguen sujetas a rutas permitidas, backup y suite fija de pruebas.
- Mantener snapshots/backup fuera de `public/` y con permisos de sistema restrictivos.
- No tratar una variable configurada como prueba de autenticación, autorización, liquidación o ingreso real.

## Uso
Iniciar con `npm start` y abrir `http://127.0.0.1:3000/orb-private` en el mismo equipo. La ruta devuelve 403 si se intenta acceder desde LAN u otro origen.
