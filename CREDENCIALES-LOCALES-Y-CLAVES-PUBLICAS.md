# Credenciales locales y claves públicas

Este paquete conserva las claves/direcciones públicas en `PUBLIC-KEYS.env`. Son identificadores públicos y no permiten firmar por sí solos.

Por seguridad, el ZIP no incorpora `.env`, `keypair.js` ni `keypair.json`: esos archivos pueden contener tokens de administración, secretos de sesión o material de firma. **Al extraer este ZIP encima de la carpeta original, los archivos locales que no estén dentro del ZIP no se borran**; conserva tu `.env` y tus archivos de claves en el equipo y fuera de Git. Si necesitas recuperar o rotar una credencial, hazlo desde el proveedor correspondiente y guárdala en el gestor de secretos del servidor.

NEON ORB no necesita leer los valores privados: los adaptadores del backend los consumen en servidor y solo exponen estados/telemetría saneados. El agente puede coordinar y diagnosticar esas integraciones sin ver ni copiar secretos.

Para activar el modelo local, configura Ollama o un endpoint OpenAI-compatible en loopback y revisa `.env.example`. El agente marca explícitamente el modo degradado cuando el modelo no está disponible.
