# Plan de integración de ForgeAI

## Alcance confirmado

ForgeAI conservará su motor local, sus conversaciones y su gestión de modelos. La ampliación añade exportación en ZIP, una conexión personal a GitHub y español latino como idioma predeterminado de la interfaz. Las operaciones de repositorio no se ejecutarán automáticamente: toda escritura en GitHub requerirá una confirmación explícita dentro de la aplicación.

## Exportación ZIP

El proyecto ya utiliza almacenamiento de archivos y la hoja de compartir de Android. Se añadirá un módulo nativo Android basado en `java.util.zip` para crear archivos ZIP en el almacenamiento temporal de la aplicación. La capa TypeScript preparará un paquete de exportación con conversaciones en JSON y Markdown; después abrirá la hoja de compartir para guardar o enviar el ZIP. El módulo validará las rutas de entrada y rechazará intentos de incluir contenido fuera del directorio de exportación.

## Conexión con GitHub

La primera versión utilizará un token personal de acceso con permisos mínimos, en lugar de incluir un secreto OAuth dentro de la APK. El token se guardará únicamente en el almacén seguro del dispositivo mediante `react-native-keychain`; no aparecerá en registros, archivos de exportación ni mensajes de error. La aplicación comprobará la identidad con `GET /user`, permitirá listar repositorios y leer su contenido, y pedirá confirmación antes de crear o actualizar archivos mediante la API de contenidos de GitHub. Para repositorios privados, el token deberá tener acceso únicamente a los repositorios elegidos y permiso de contenido de lectura/escritura.

## Español latino

ForgeAI ya cuenta con un sistema de traducciones tipado y carga diferida. Se añadirá la variante `es_419`, se establecerá como idioma inicial y se incorporará al selector. Los textos de GitHub y ZIP se crearán directamente en español latino; los textos existentes se traducirán respetando las claves, los marcadores `{{…}}` y los mensajes de accesibilidad.

## Validación

Se añadirán pruebas unitarias para el empaquetado de exportación, la validación de rutas y las solicitudes GitHub sin secretos. La entrega incluirá comprobación de tipos, pruebas del proyecto y compilación de Android. Las operaciones reales de lectura o escritura contra la cuenta de GitHub quedarán inactivas hasta que la persona usuaria ingrese su propio token desde la aplicación.

## Referencias técnicas

GitHub recomienda tokens personales de acceso de granularidad fina cuando una persona usa la API REST para sus propios repositorios. La autenticación se envía con `Authorization: Bearer`, y la API de contenidos permite leer directorios y crear o actualizar archivos codificados en Base64. Las escrituras deben realizarse de forma serial para evitar conflictos entre operaciones simultáneas.[1] [2]

[1]: https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api "Autenticación para la API REST de GitHub"
[2]: https://docs.github.com/en/rest/repos/contents "API REST de contenidos de repositorio de GitHub"
