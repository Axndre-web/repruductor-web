# NEON ORB — Coordinación central NEON PLAYER X

## Objetivo y alcance aplicado

NEON ORB actúa como coordinador central de observación y operación gobernada. Los motores especializados conservan su propiedad sobre sus datos y operaciones; el coordinador agrega estados, inventario, sincronización y mantenimiento sin reemplazar sus fuentes de verdad.

### A — Arquitectura interna
- Inventario ampliado de 24 componentes del núcleo, economía, seguridad, Web3, red, medios e interfaz.
- Diagnóstico agregado en `GET /api/neon-orb/ecosystem`.
- Comparación SHA-256 de copias de despliegue para detectar divergencias sin mostrar contenidos.
- La raíz del proyecto es la fuente canónica para los activos web versionados; `public/` y `github-pages-sync/` son destinos de publicación.

### B — NEON ORB como cerebro coordinador
- Consolida runtime, daemon, supervisor de autonomía, minería, red, radio, contabilidad, proveedores y módulos.
- Distingue `AVAILABLE`, `MISSING`, `NOT_CONFIGURED` y `CONFIGURED_UNVERIFIED`.
- No marca un agente como activo solo porque exista configuración; la interfaz evita presentar configuración como conexión verificada.
- Las decisiones de ejecución siguen sujetas a permisos y controles de cada subsistema.

### C — Economía
- Se conserva el ledger y los motores existentes; no se migra ni se reinicia su información.
- La contabilidad agregada se observa desde `calculateEconomicAccounting()`.
- Los importes pendientes no se convierten en ingresos verificados por el coordinador.
- No se habilitan firmas, swaps, pagos ni movimientos automáticos de fondos.

### D — Ecosistema externo
- La configuración de credenciales no se interpreta como handshake exitoso.
- Los proveedores siguen mostrando `CONFIGURED_UNVERIFIED` hasta que exista una comprobación real del adaptador correspondiente.
- La topología UI se actualiza desde endpoints same-origin y presenta como pendientes los estados no verificados.
- Se sincronizan los activos web canónicos con `public/` y `github-pages-sync/` sin propagar archivos de secretos.

### F — Interfaz
- Centro de control responsive con estado de sincronización de despliegue.
- El panel compara hashes y muestra el número de copias sincronizadas.
- Se actualizan las hojas de estilo, HTML, módulos UI y service worker de los destinos de publicación.
- Los estados visuales no deben inferir conectividad a partir de una configuración o de una mera presencia de archivo.

## Secretos, claves y privacidad

- `.env`, keypairs, claves privadas, certificados y estado privado quedan fuera de copias de mantenimiento y paquetes de publicación.
- Las direcciones públicas y demás identificadores públicos siguen disponibles en los módulos que ya los exponen; no se mezclan con secretos de firma.
- Las credenciales se leen únicamente en servidor. El diagnóstico devuelve presencia/configuración, nunca valores.
- Para rotar secretos, se actualiza el almacén local privado; no se sincronizan secretos hacia `public/` ni GitHub Pages.

## Mantenimiento y recuperación

- `POST /api/neon-orb/maintenance/backup` crea una instantánea local sin secretos.
- `POST /api/neon-orb/maintenance/rollback` requiere admin token, identificador válido y rutas explícitas incluidas en el manifiesto; crea una copia de recuperación antes de restaurar.
- Las copias se guardan en `data/orb-backups/` con permisos restrictivos.
- No hay edición automática de código ni ejecución arbitraria. El agente puede diagnosticar y proponer; las modificaciones requieren autorización y pruebas.

## Verificación

Pruebas dirigidas ejecutadas: `eco-coordinator`, `unified-control-center`, `connection-coordinator` y `ui-sync`.

La suite completa conserva fallos preexistentes no relacionados con esta intervención: comprobación estática de patrones del `server.js`, falso positivo del escáner de secretos en un fixture de pruebas, y cualquier prueba indicada en el informe de ejecución. No declarar producción validada hasta resolver esos fallos y probar con las credenciales rotadas y proveedores reales.

## Resultado de validación de esta entrega

- `npm test`: **116/116 pruebas correctas**.
- Comprobación sintáctica: `server.js`, `server/eco-coordinator.js` y `UI/unified-control-center.js` correctos.
- Sincronización de seis grupos de activos críticos: `SYNCHRONIZED`.
- Inventario del coordinador: 24 módulos disponibles.
- Estado global: `OPERATIONAL_WITH_WARNINGS`, debido a que los proveedores externos aún requieren configuración/verificación y el runtime de inferencia está en fallback local. No se declara conectividad externa ni producción completa sin handshakes reales.
