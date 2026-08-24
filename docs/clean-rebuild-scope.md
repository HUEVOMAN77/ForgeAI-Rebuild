# Alcance de la reconstrucción limpia

Esta rama parte exactamente de `a-ghorbani/pocketpal-ai` en el commit `d937cd7bda49d76fe151b3bf2883eb9577675aa3`.

La implementación se limitará a tres cambios funcionales: exportación manual de respaldos ZIP, respaldo manual a GitHub con un token personal almacenado en el dispositivo y español latino como idioma predeterminado.

No se modificarán las dependencias, la inicialización ni la configuración nativa existentes de PocketPal. Cualquier archivo de plataforma que sea estrictamente necesario para registrar una función ZIP se mantendrá como un añadido mínimo y será auditado frente a la base original.
