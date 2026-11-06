# NEON ORB — voz y conversación

## Qué incluye esta actualización

- Chat de texto conectado al endpoint privado del agente (`POST /api/neon-orb/agent/chat`).
- Dictado de voz en español mediante Web Speech API cuando el navegador lo soporta.
- Lectura de las respuestas mediante SpeechSynthesis, con selección preferente de voz española.
- Preferencia de lectura en voz alta guardada localmente en el navegador.
- Historial limitado a los últimos 20 mensajes y guardado únicamente en `sessionStorage` (se borra al cerrar la sesión del navegador).
- Estados de escucha, errores de permisos y alternativa de escritura.
- Las copias de UI de raíz, `public/` y `github-pages-sync/` se mantienen sincronizadas.

## Requisito para conversar con calidad de asistente

El navegador no contiene el modelo de lenguaje. NEON ORB envía los mensajes al proveedor configurado en el servidor. Para respuestas elaboradas y herramientas, debe estar disponible un modelo compatible con la API OpenAI Chat Completions y con soporte de llamadas a herramientas.

### Opción local recomendada: Ollama

1. Instala Ollama en el equipo que ejecuta el servidor.
2. Descarga un modelo conversacional que soporte tool calling y que tu equipo pueda ejecutar. Por ejemplo, revisa la compatibilidad actual del modelo antes de elegirlo; no todos los modelos admiten herramientas.
3. En el archivo `.env` privado del servidor configura:

```dotenv
NEON_AGENT_BASE_URL=http://127.0.0.1:11434/v1/chat/completions
NEON_AGENT_MODEL=<nombre-exacto-del-modelo-local>
NEON_AGENT_API_KEY=
```

4. Reinicia `npm start` y consulta `GET /api/neon-orb/agent/status`. La respuesta indica proveedor y modelo, nunca revela la clave.

### Opción proveedor remoto compatible

Configura únicamente en el `.env` privado del servidor:

```dotenv
NEON_AGENT_BASE_URL=https://<host-oficial-del-proveedor>/v1/chat/completions
NEON_AGENT_ALLOWED_HOSTS=<hostname-exacto-del-proveedor>
NEON_AGENT_MODEL=<id-del-modelo>
NEON_AGENT_API_KEY=<clave-privada-del-servidor>
```

El host remoto debe usar HTTPS y coincidir exactamente con `NEON_AGENT_ALLOWED_HOSTS`. No pongas claves en HTML, JavaScript del navegador, repositorios públicos ni archivos `public/`.

## Voz en navegador

- La síntesis de voz suele funcionar en navegadores modernos.
- El reconocimiento de voz depende del navegador y puede enviar audio a un servicio de reconocimiento del propio navegador/proveedor. Requiere permiso explícito de micrófono.
- El micrófono normalmente requiere HTTPS o `localhost` y una interacción del usuario.
- Si el navegador no implementa `SpeechRecognition`/`webkitSpeechRecognition`, el botón aparece deshabilitado y el chat escrito sigue disponible.
- Para escuchar las respuestas, activa `VOZ ON` una vez. El permiso y la disponibilidad dependen del navegador/dispositivo.

## Seguridad y límites

La voz es una interfaz de entrada/salida, no una autorización para ejecutar acciones. Se mantienen los controles del agente, los límites de herramientas y las restricciones económicas y de firma existentes. Nunca dictes contraseñas, frases semilla, claves privadas ni tokens.

La aplicación no puede garantizar que el modelo responda cuando el proveedor esté apagado, sin conexión o sin cuota. En esos casos debe mostrar el error o el modo degradado, sin fingir que el modelo ha respondido.
