# NEON ORB — Agente técnico autónomo (v1)

## Alcance

Esta capa añade un agente de ingeniería que puede mantener una conversación técnica, buscar información pública, inspeccionar archivos de código permitidos, ejecutar la auditoría estática local y lanzar exclusivamente la suite fija `node --test tests/*.test.mjs`. Puede redactar código completo y diffs, guardar propuestas en `agent-workspace/proposals` y aplicar cambios en rutas de código permitidas con copia de seguridad, comprobación de sintaxis JavaScript, suite fija de pruebas en una copia temporal y rollback automático si falla la validación. No ejecuta comandos arbitrarios, no explota objetivos remotos, no gestiona credenciales y no firma ni transmite operaciones blockchain.

## Requisitos del modelo

La inferencia requiere un endpoint compatible con la API de chat completions de OpenAI. La opción local predeterminada es Ollama en `http://127.0.0.1:11434/v1/chat/completions`.

1. Instala Ollama desde su fuente oficial y arráncalo localmente.
2. Descarga un modelo de código adecuado, por ejemplo `qwen2.5-coder:7b` (el tamaño real de modelo debe ajustarse a la RAM/VRAM disponible).
3. Copia los valores de `.env.example` a tu `.env` si quieres configurar el agente. No reemplaces el `.env` actual ni publiques su contenido.
4. Reinicia `npm start` y consulta `GET /api/neon-orb/agent/status`.

Alternativamente, configura `NEON_AGENT_BASE_URL` con un endpoint HTTPS de proveedor compatible, `NEON_AGENT_API_KEY` y `NEON_AGENT_ALLOWED_HOSTS` con el hostname exacto autorizado. Los destinos remotos que no estén en la allowlist se rechazan. Nunca introduzcas claves de proveedor en el navegador.

## Uso

- Panel web: **NEON ORB · AGENTE TÉCNICO** en la sección de operaciones.
- Estado: `GET /api/neon-orb/agent/status` (solo indica configuración, no garantiza que el proveedor responda).
- Conversación: `POST /api/neon-orb/agent/chat`, protegida con `Authorization: Bearer <NEON_ADMIN_TOKEN>`.
- Herramientas disponibles: `search_public_web`, `search_jobs`, `search_github_solutions`, `audit_local_code`, `list_project_files`, `read_project_file`, `run_project_tests`, `save_code_proposal`, `apply_project_file` y `control_integrated_radio`.
- Límites: máximo 5 rondas de herramientas, 8 llamadas por turno, mensaje de 12.000 caracteres, lectura de archivos fuente de hasta 30 KB y timeout fijo de 90 segundos para pruebas.

Ejemplo de petición:

```http
POST /api/neon-orb/agent/chat
Authorization: Bearer <NEON_ADMIN_TOKEN>
Content-Type: application/json
```

```json
{
  "message": "Revisa la autenticación del servidor, ejecuta las pruebas pertinentes y propón un parche seguro con pruebas adicionales."
}
```

## Seguridad y limitaciones

- Las rutas de lectura rechazan `.env`, archivos de claves/semillas, carpetas de dependencias y rutas que escapen del proyecto.
- Los resultados web y los archivos del proyecto se tratan como contenido no confiable; no deben poder redefinir las reglas del agente.
- La herramienta de pruebas ejecuta únicamente el conjunto de pruebas conocido, en una copia temporal que excluye `.env`, claves y datos locales, con `shell:false`, entorno mínimo, timeout y salida limitada. `save_code_proposal` solo crea archivos nuevos dentro de `agent-workspace/proposals`. `apply_project_file` puede editar únicamente `server/`, `core/`, `UI/`, `public/UI/`, `tests/` y archivos concretos (`server.js`, `public/script.js`, `public/index.html`, `public/style.css`); no puede escribir `.env`, archivos de paquetes, dependencias o rutas fuera del proyecto. Conserva una copia de seguridad y revierte si la suite fija falla.
- El agente no tiene shell arbitrario ni permisos de despliegue. Sus ediciones están limitadas a rutas permitidas y pasan validación automática; revisa cambios y copias de seguridad antes de publicar en producción. Los cambios de backend requieren reiniciar el servidor para entrar en vigor.
- Un modelo local no es automáticamente fiable ni equivalente a GPT-6; calidad, latencia y contexto dependen del modelo instalado y del hardware.
- La búsqueda web general usa DuckDuckGo Instant Answer API, no un índice exhaustivo; la búsqueda adicional de GitHub consulta repositorios públicos y sus resultados no están auditados ni verificados. El buscador de empleo consulta fuentes públicas y no postula automáticamente.
- La auditoría es heurística y no sustituye un análisis profesional ni un escáner especializado de contratos.

## Control unificado y radio

- `GET /api/neon-orb/control/status` combina estado del agente, red y radio en un mismo plano de telemetría.
- `GET /api/neon-orb/radio/control` publica la intención actual del reproductor integrado.
- `POST /api/neon-orb/radio/control` solicita `play`/`pause` para una estación predefinida; requiere token de administración.
- El agente puede usar `control_integrated_radio`. El navegador conserva la política de autoplay y puede exigir un clic para iniciar el audio.

## Variables

- `NEON_AGENT_BASE_URL`: endpoint compatible; predeterminado loopback local.
- `NEON_AGENT_MODEL`: nombre del modelo.
- `NEON_AGENT_API_KEY`: opcional localmente; necesaria para proveedor remoto.
- `NEON_AGENT_ALLOWED_HOSTS`: lista exacta de hosts HTTPS remotos autorizados, separada por comas.
- `NEON_ADMIN_TOKEN`: protege las operaciones del agente; mínimo 32 caracteres.
