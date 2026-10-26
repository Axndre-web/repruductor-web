# NEON ORB — sincronización persistente y arranque automático

## Qué queda automatizado

- El servidor carga `.env` al iniciar mediante `server/load-env.js`; el servicio de inicio automático usa el directorio del proyecto como `WorkingDirectory`, por lo que la configuración existente se mantiene disponible sin copiar credenciales a otro archivo.
- Un observador residente de servidor arranca con NEON ORB y actualiza los balances públicos cada 60 segundos por defecto (configurable con `NEON_WALLET_OBSERVE_INTERVAL_MS`, entre 15 y 300 segundos), incluso cuando el panel está cerrado. El panel también consulta automáticamente `/api/neon-orb/wallet/observed/local` al abrirse y vuelve a sincronizar cada 15 segundos mientras la pestaña está visible.
- Ese endpoint solo admite conexiones loopback (`127.0.0.1`, `localhost` o `::1`) y solicitudes del mismo origen del panel. Devuelve exclusivamente saldos públicos observados y no modifica la ruta original `/api/neon-orb/wallet/observed`, que continúa protegida por `NEON_ADMIN_TOKEN`.
- Phantom intenta restaurar un permiso previo con `connect({ onlyIfTrusted: true })`; las wallets EVM usan `eth_accounts`, que no abre una solicitud de autorización. Si la extensión no conserva o no concede el permiso, hace falta una autorización explícita una vez.
- NEON ORB no almacena claves privadas, frases semilla, contraseñas ni secretos de wallet en el navegador. No firma ni envía transacciones.

## Activar el inicio con el ordenador

Instala las dependencias y ejecuta una vez, desde la carpeta raíz del proyecto:

```bash
npm install
npm run autostart:install
```

El instalador registra un servicio/entrada de inicio **para el usuario actual**:

- Windows: carpeta de Inicio del usuario.
- Linux: unidad `systemd --user`.
- macOS: agente `LaunchAgent` del usuario.

El servicio inicia `node server.js` con el directorio del proyecto como carpeta de trabajo. El servidor queda disponible en `http://127.0.0.1:3000` (o el puerto configurado). Por diseño, no abre automáticamente el navegador.

Para retirar el inicio automático:

```bash
npm run autostart:uninstall
```

La instalación automática requiere este paso inicial explícito porque el sistema operativo no debe modificarse en silencio. Si el equipo usa Linux sin un gestor `systemd --user` disponible, el comando lo indicará y habrá que configurar el inicio de sesión del sistema manualmente.

## Credenciales y privacidad

- Conserva el `.env` existente en el directorio del proyecto y restringe sus permisos al usuario del sistema operativo.
- No copies secretos al frontend ni los pegues en el panel.
- El endpoint automático expone únicamente saldos de direcciones públicas configuradas. Como se ejecuta en loopback, los datos pueden ser visibles para procesos y usuarios que tengan acceso local a la sesión; protege la cuenta del sistema y bloquea el equipo cuando no lo uses.
- No configures `NEON_ALLOW_LAN_ACCESS=true` salvo que hayas preparado HTTPS, autenticación y controles de red adecuados.
