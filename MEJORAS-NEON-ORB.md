# Neon Player X — integración y revisión

## Cambios incluidos
- Añadido un panel flotante de conversación para Neon Orb, conectado a `/api/neon-orb/status` y `/api/neon-orb/think`.
- El panel presenta el estado del runtime, mantiene la conversación solo en memoria de la pestaña y no guarda el texto del chat en `localStorage`.
- El texto recibido se representa con `textContent` para evitar interpretar respuestas como HTML.
- Se incluye un diseño adaptable para escritorio y móvil, navegación por teclado y avisos de error comprensibles.
- La protección de administración ahora falla cerrada en todos los entornos: si `NEON_ADMIN_TOKEN` no existe o tiene menos de 24 caracteres, las rutas administrativas no se habilitan.
- Añadidas pruebas para comprobar la integración visual y la configuración de seguridad.

## Instalación
Requiere Node.js 20 o superior.

1. Conserva una copia de seguridad del proyecto original.
2. Instala dependencias: `npm install`.
3. Configura `NEON_ADMIN_TOKEN` con un secreto aleatorio de al menos 24 caracteres antes de usar rutas administrativas.
4. Inicia: `npm start`.
5. Abre `http://localhost:3000`.
6. Ejecuta las pruebas: `npm test`.

## Límites deliberados
Neon Orb puede explicar y consultar las capacidades que el servidor ya expone. Este panel no concede permisos nuevos para gastar dinero, operar carteras, minar, enviar transacciones ni ejecutar tareas externas. Una intención propuesta por el runtime no equivale a una acción ejecutada. Los saldos y liquidaciones deben seguir dependiendo de verificaciones de sus fuentes.

## Seguridad y archivos conservados
No se han eliminado archivos del proyecto. El archivo ZIP de salida conserva los archivos existentes, incluidos archivos de configuración privados. No publiques el ZIP ni subas `.env`, claves privadas, frases semilla o tokens a repositorios. Si alguno de esos secretos estuvo expuesto, rótalo. La carpeta `data/` puede contener estado local sensible y debe protegerse en las copias de seguridad.

## Resultado de las pruebas
Las pruebas automatizadas se ejecutaron con Node.js 22 y finalizaron correctamente tras los cambios.
