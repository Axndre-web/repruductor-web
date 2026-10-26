# NEON PLAYER X — unificación de interfaz

## Alcance

- `public/` es la raíz servida por Express; los archivos equivalentes fuera de `public/` se mantienen sincronizados para facilitar el desarrollo.
- Se conservó `style.css` como hoja global y se incorporó `UI/styles.css` para los componentes de arcade, sin sustituir reglas existentes.
- Se fusionó la versión más completa de `UI/styles-economy.css` (incluye las reglas de Account Readiness) y se replicó en ambas ubicaciones.
- Se sincronizaron `UI/account-readiness.js`, `UI/neon-orb-companion.js` y `UI/neon-orb-companion.css` en ambas ubicaciones.
- El service worker usa una caché versionada nueva para invalidar recursos antiguos y precarga los módulos/estilos usados por la interfaz.
- Se añadieron pruebas para detectar divergencias entre las copias, referencias locales rotas y omisiones en la caché.

## Validación

Ejecutar `npm test`. La suite valida consistencia estática y lógica de componentes; no reemplaza una prueba visual en navegadores reales ni verifica servicios externos.

## Límites

Los módulos de servidor, secretos, claves y archivos de datos privados no se copian a `public/`. La carpeta pública debe contener únicamente recursos que el navegador necesita descargar.
