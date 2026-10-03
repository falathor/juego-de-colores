## ADDED Requirements

### Requirement: Publicación en GitHub Pages
El proyecto SHALL publicarse en la cuenta indicada por el usuario con la
visibilidad acordada. GitHub Pages SHALL servir la aplicación desde main y
su raíz, con rutas relativas y sin credenciales del entorno en el repositorio.
La documentación SHALL indicar la URL comprobada y el flujo de actualización.

#### Scenario: Juego disponible online
- GIVEN el proyecto subido y GitHub Pages activado
- WHEN se abre la URL HTTPS de la aplicación
- THEN se cargan la interfaz y las 98 preguntas aprobadas y se puede completar
  una partida sin errores de recursos.
