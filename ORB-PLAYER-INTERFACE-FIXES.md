# NEON PLAYER X — reproductor visible y consultas de NEON ORB

## Cambios
- El reproductor multimedia vuelve a estar visible y accesible desde la navegación principal. Se conservan controles, cola, archivos locales, audio/vídeo y estudio multimedia.
- El panel «Administrador del ecosistema» queda oculto en la interfaz de usuario, pero sus módulos siguen montándose dentro del host interno; no se borraron endpoints ni funciones.
- El chat flotante de NEON ORB muestra errores de estado y consulta más útiles, usa tiempos máximos para evitar controles bloqueados y valida que haya contenido en la respuesta.
- Se añade opción de voz en español mediante la síntesis de voz del navegador. Es opcional y se activa con el botón «VOZ ON»; requiere un navegador compatible.
- Los archivos de interfaz de origen y los servidos se mantienen sincronizados. No se cambió `.env` ni se alteraron credenciales.

## Validación
- Suite automatizada completa: 86 pruebas correctas.
- Sintaxis JavaScript de los módulos del asistente comprobada.
- La prueba HTTP en vivo no se pudo ejecutar en este entorno porque no están instaladas las dependencias de servidor (`express`); hay que instalar dependencias y arrancar el servidor para confirmar el comportamiento en el equipo de destino.
