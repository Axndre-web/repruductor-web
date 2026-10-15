# Neon Orb: integración nativa incremental

## Qué cambia
- `core/neon-orb-core.js` proporciona una identidad de runtime residente en el proceso Node, uptime y telemetría operacional con eventos recientes acotados.
- `server.js` expone `GET /api/neon-orb/core` para que la interfaz y otros componentes puedan consultar el núcleo.
- `core/orb-work-bridge.js` registra en el núcleo los eventos de trabajo que ya pasan por el puente y conserva el asiento en el ledger unificado.

## Límites intencionales
- La telemetría refleja eventos reportados por el sistema; no inventa trabajo, ingresos, nodos conectados ni saldos.
- La ruta de telemetría es de solo lectura. La ejecución económica existente y sus controles de autorización siguen siendo los responsables de autorizar operaciones.
- El historial de eventos de esta fachada vive en memoria y está limitado a 64 eventos. No reemplaza la memoria persistente ni el ledger.
- Las credenciales y los secretos no se exponen en la respuesta de telemetría.

## Verificación
Con el servidor iniciado, consulta `GET /api/neon-orb/core`. Para verificar el registro de trabajo, usa el flujo existente que emite `neon:orb-work-completed`; el puente registra el evento y mantiene el registro económico original.
