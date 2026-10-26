# Neon Orb — coordinación de conexiones, permisos y firma

## Flujo añadido

1. El daemon residente sincroniza el inventario de proveedores en cada ciclo.
2. `server/connection-coordinator.js` mantiene solicitudes persistentes, con permisos mínimos, estado, fecha y registro de eventos.
3. `GET /api/neon-orb/connections` expone únicamente nombres de proveedores, capacidades, estados y nombres de variables faltantes; nunca valores de secretos.
4. `POST /api/neon-orb/connections/:id/decision` exige `Authorization: Bearer <NEON_ADMIN_TOKEN>` y registra una decisión local de aprobación o rechazo.
5. El panel Neon Orb consulta ese estado y distingue solicitudes pendientes de conexiones verificadas.

## Límites de veracidad y seguridad

- Una solicitud local o una variable configurada no demuestra que un proveedor haya autenticado la cuenta.
- Para declarar una conexión como verificada, el adaptador de ese proveedor debe completar un handshake real y validar el resultado.
- La aprobación local no autoriza por sí sola pagos, retiros ni transferencias.
- Las firmas de transacciones financieras deben generarse mediante un adaptador de wallet y mostrarse al titular para confirmación explícita en la wallet. No se implementa firma silenciosa ni ejecución financiera autónoma.
- El navegador no permite abrir consentimientos externos sin interacción del usuario; las solicitudes se preparan automáticamente y el consentimiento real depende del proveedor.
- No se realizan altas de cuentas, aceptaciones de contratos, solicitudes de empleo ni transferencias automáticas.

## Endpoints

- `GET /api/neon-orb/connections`: inventario y solicitudes de permiso.
- `POST /api/neon-orb/connections/:id/decision` con JSON `{"decision":"approve"}` o `{"decision":"deny"}`: decisión local protegida por token administrativo.

## Estado de las claves

El paquete conserva los archivos de configuración originales solicitados. El archivo `keypair.js` heredado presenta un error de sintaxis en su primer elemento y no debe cargarse como una clave operativa hasta que se corrija desde la fuente original y se valide su formato. El código no intenta adivinar ni reparar material criptográfico. No se devuelve material de clave por endpoints HTTP.
