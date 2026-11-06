# NEON ORB — separación de entorno creador y publicación pública (V4)

## Entorno privado del creador

- URL local: `http://127.0.0.1:3000`.
- El proceso Node/Express y los módulos existentes continúan siendo la instancia operativa. Esta actualización no sustituye el runtime ni cambia sus rutas de negocio.
- Mantener `HOST=127.0.0.1` y `NEON_ALLOW_LAN_ACCESS=false` salvo que exista una necesidad de red local evaluada y protegida.
- Las operaciones administrativas que usan `adminRequired` requieren `NEON_ADMIN_TOKEN` de al menos 32 caracteres y cabecera `Authorization: Bearer …`. No se incluye el token en la interfaz ni se devuelve desde endpoints.
- Para funciones de lectura y agente local se mantienen los controles de loopback y mismo origen existentes.
- `.env` se conserva localmente. No se imprime, serializa ni sincroniza al frontend. Los endpoints de readiness devuelven estados y nombres de variables ausentes, nunca sus valores.

## Entorno público GitHub Pages

- Publicar exclusivamente el contenido de `github-pages-sync/`.
- Se considera una presentación pública de solo lectura: radio, reproductor, temas, navegación y vistas informativas estáticas.
- No tiene runtime Node, daemon, acceso a `.env`, acceso al puerto 3000 del ordenador del creador ni permisos para administrar el agente.
- No se debe añadir un proxy público que reenvíe las peticiones de visitantes al localhost del creador.
- Los campos de credenciales no se publican. Cuando una vista necesite representar un secreto, mostrar únicamente `****` o un estado `CONFIGURADO`/`PENDIENTE`; nunca el valor ni fragmentos del mismo.
- No publicar `.env`, `.env.*` (salvo plantillas `.env.example` que no contengan valores), `keypair*`, archivos de wallet, bases de datos, logs, certificados o backups.

## Validación previa a publicar

Desde la raíz del proyecto:

```bash
npm run verify:public
npm test
```

`verify:public` inspecciona `public/` y `github-pages-sync/` buscando archivos privados y patrones comunes de material secreto. Es una comprobación defensiva, no sustituye una revisión manual ni un escáner de secretos del repositorio.

## Credenciales y semillas

- No introducir frases semilla, claves privadas, códigos 2FA ni contraseñas en NEON ORB, chats, formularios del panel, frontend, Git o logs.
- No se muestran semillas parcialmente enmascaradas: ni siquiera los últimos caracteres. La representación pública es `****`.
- Si una credencial real estuvo alguna vez dentro de una carpeta publicada o un repositorio remoto, revocarla/rotarla; borrar el archivo en un commit posterior no elimina el historial.
- Para blockchain, usar direcciones públicas para observación y una wallet externa para firma. La firma, transferencias y retiros requieren confirmación explícita del titular.

## Alcance

Esta entrega conserva el comportamiento y módulos del runtime existente. No afirma que proveedores externos estén autenticados ni que pagos, trabajos o transacciones hayan sido completados. La conectividad real depende de credenciales válidas, permisos del proveedor y disponibilidad de red.
