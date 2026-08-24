# Uso de ForgeAI en español latino

Esta compilación de **ForgeAI** funciona de forma local en el teléfono y añade respaldo de conversaciones en ZIP, conexión opcional con GitHub y español latino como idioma predeterminado.

## Exportar conversaciones en ZIP

En la pantalla de chat, abre el menú de tres puntos y entra en **Exportar/Importar**. Selecciona **Exportar todo como respaldo ZIP**. ForgeAI crea un archivo ZIP con un respaldo JSON de las conversaciones y un archivo `LEEME.txt`, y luego abre la hoja de compartir de Android para guardarlo o enviarlo a la aplicación que prefieras.

El ZIP se crea primero dentro de la caché privada de la aplicación. La exportación no modifica tus conversaciones originales.

## Conectar GitHub desde la APK

Entra en **Ajustes** y desplázate a la sección **GitHub**. Selecciona **Conectar** y pega un token personal de acceso *fine-grained* creado en tu cuenta de GitHub. Para reducir permisos, el token debe limitarse a los repositorios que quieras usar y contar únicamente con el permiso **Contents: Read and write**.

Después de validar el token, selecciona un repositorio y usa **Subir respaldo**. Antes de crear el archivo, ForgeAI muestra una confirmación porque el respaldo de conversaciones saldrá del teléfono. Si aceptas, la aplicación crea un JSON y lo sube a la ruta `forgeai-backups/` del repositorio elegido mediante un commit.

> El token se guarda exclusivamente en el almacenamiento seguro del dispositivo. No se incluye en el código fuente, en el APK ni en los archivos de respaldo. ForgeAI no escribe en GitHub sin confirmación explícita.

## Recomendaciones de seguridad

No compartas tu token de GitHub. Si deja de ser necesario, revócalo desde GitHub y actualiza la conexión en ForgeAI. Si usas un repositorio público, recuerda que todo archivo de respaldo subido será visible para cualquier persona que tenga acceso al repositorio.

## Idioma

La interfaz inicia en **español latino**. Puedes cambiar el idioma desde **Ajustes > Idioma** si lo necesitas. Los avisos de exportación, importación, ZIP y GitHub se muestran en español latino.
