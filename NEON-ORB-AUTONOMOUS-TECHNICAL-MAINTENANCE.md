# NEON ORB — mantenimiento técnico autónomo residente

NEON ORB dispone ahora de un ciclo técnico residente separado de la interfaz pública. La interfaz de NEON PLAYER X permanece intacta; el estado se consulta desde el plano privado del servidor.

## Qué hace

- Arranca con el servidor y espera dos minutos antes del primer ciclo.
- Por defecto vuelve a ejecutarse cada 24 horas (configurable entre 6 horas y 7 días).
- Usa el proveedor configurado en `NEON_AGENT_BASE_URL` (por defecto Ollama en loopback).
- Audita el proyecto, inspecciona rutas permitidas, puede investigar documentación/repositorios públicos y ejecuta la suite fija.
- Puede aplicar como máximo un cambio de código por ciclo.
- Antes de modificar, crea una copia de seguridad; después comprueba sintaxis y ejecuta la suite completa en una copia desechable. Si falla, revierte el archivo.
- Si una mejora es amplia o requiere permisos, gasto, credenciales o despliegue, deja una propuesta aislada en `agent-workspace/proposals/`.

## Estado y ejecución manual

- `GET /api/neon-orb/agent/maintenance` — estado resumido, sin valores secretos.
- `GET /api/neon-orb/control/status` — estado integrado del ecosistema.
- `POST /api/neon-orb/agent/maintenance/run` — ciclo manual, requiere `NEON_ADMIN_TOKEN`.

## Configuración

```dotenv
NEON_AGENT_MAINTENANCE_ENABLED=true
NEON_AGENT_MAINTENANCE_INTERVAL_MS=86400000
NEON_AGENT_BASE_URL=http://127.0.0.1:11434/v1/chat/completions
NEON_AGENT_MODEL=qwen2.5-coder:7b
```

Se puede desactivar con `NEON_AGENT_MAINTENANCE_ENABLED=false`.

## Límites deliberados

El modelo no puede leer `.env`, archivos de claves privadas, semillas ni tokens; no puede ejecutar shell arbitrario, firmar/transmitir transacciones, retirar fondos, mover dinero ni enviar candidaturas. Los proveedores existentes pueden seguir usando credenciales desde el backend mediante sus adaptadores: no es necesario revelar esos valores al modelo. Las direcciones y claves públicas siguen siendo datos públicos y pueden mantenerse en la configuración operativa. Las operaciones financieras continúan sometidas a los gobernadores, verificadores y controles existentes.

El ciclo no se ejecutará con capacidad de inferencia real si el proveedor local/remoto no está disponible. En ese caso el estado queda como degradado/esperando modelo; no se simula que se haya investigado o modificado código.
