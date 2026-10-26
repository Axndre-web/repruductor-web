# NEON ORB — plano unificado de autonomía

NEON ORB es el agente administrador técnico de NEON PLAYER X. La radio, la búsqueda web, GitHub, empleo, auditoría estática, propuestas de código, pruebas aisladas y telemetría se coordinan desde el mismo servidor y la misma interfaz. No se crea un segundo producto ni otro puerto.

## Control compartido
- `GET /api/neon-orb/control/status`: estado unificado del agente, red y radio.
- `GET /api/neon-orb/radio/control`: intención actual de radio para sincronizar el reproductor principal.
- `POST /api/neon-orb/radio/control`: acción `play`/`pause` y estación 0–11; requiere `Authorization: Bearer <NEON_ADMIN_TOKEN>`.
- El agente puede solicitar reproducción o pausa mediante su herramienta integrada `control_integrated_radio`. La UI aplica la intención al reproductor existente.

## Radio y navegador
La señal se reproduce en la página principal de NEON PLAYER X. La política de reproducción automática la aplica el navegador: si bloquea el inicio sin interacción previa, el usuario debe pulsar el botón ▶. El agente no puede eludir esa política. No se aceptan URLs de audio arbitrarias: se usan las estaciones predefinidas y el proxy existente.

## Autonomía de ingeniería
El agente puede investigar, leer archivos permitidos, analizar estáticamente, ejecutar únicamente la suite fija de pruebas en una copia temporal y guardar propuestas nuevas en `agent-workspace/proposals`. Para tareas de implementación, el agente puede editar rutas de código permitidas (`server/`, `core/`, `UI/`, `public/UI/`, `tests/` y archivos concretos de la UI principal). Cada edición guarda una copia de seguridad, ejecuta la suite fija en una copia temporal sin secretos y revierte automáticamente el cambio si las pruebas fallan. No se ejecuta shell arbitrario ni se modifican `.env`, archivos de dependencias o configuración de paquetes. No firma ni transmite transacciones.

## Configuración y arranque
Conserva el `.env` existente. Configura `NEON_ADMIN_TOKEN` con al menos 32 caracteres y un proveedor compatible con Chat Completions (Ollama local es la opción predeterminada). Ejecuta `npm install`, `npm test` y `npm start`. El servidor conserva `PORT`/`HOST` configurados y comprueba endpoints al arrancar.

## Límites honestos
La autonomía efectiva depende de que el modelo configurado esté disponible y de sus capacidades. La telemetría compartida y las intenciones de radio son en memoria del proceso; se reinician al reiniciar el servidor. La búsqueda y el empleo dependen de APIs públicas y sus límites. La auditoría estática no sustituye una revisión profesional ni un análisis dinámico autorizado.


## Control Center unificado (actualización UI)

La interfaz añade una vista adaptable con accesos a los módulos existentes y una holografía SVG esquemática de nodos. Consulta telemetría local cada 5 segundos; los nodos sin confirmación se marcan como pendientes. El mapa no representa geolocalización física. Véase `CONTROL-CENTER-RESPONSIVE-HOLOGRAFIA.md`.
