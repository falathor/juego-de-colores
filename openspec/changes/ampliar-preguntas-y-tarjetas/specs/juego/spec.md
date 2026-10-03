## ADDED Requirements

### Requirement: Catálogo ampliado a 98 preguntas
El catálogo SHALL contener las 48 preguntas aprobadas anteriores y exactamente
50 nuevas aprobadas, repartidas en las ocho categorías, con IDs nuevos, fuentes
consultadas y fecha ISO. SHALL conservar el borrador previo y aumentar contentVersion.

#### Scenario: Actualización de contenido
- GIVEN el catálogo 1.0.0 con 48 aprobadas y un borrador
- WHEN se incorpora la ampliación
- THEN hay 98 aprobadas, 99 entradas totales y las entradas previas no cambian.

### Requirement: Tarjetas de solución centradas
La solución SHALL mostrar una tarjeta grande por color con fondo de la paleta,
nombre en negrita centrado horizontal y verticalmente, texto con contraste
mínimo de 4,5:1 y borde visible para blanco. El grupo SHALL centrarse y envolver
entre una y cuatro tarjetas sin desbordar a 320 px, en todos los modos.

#### Scenario: Revelación de varios colores
- GIVEN una pregunta con entre uno y cuatro colores
- WHEN se revela la solución
- THEN aparecen todas las tarjetas centradas, con el nombre en el centro;
  cada tarjeta mide al menos 140 × 170 px si el espacio disponible lo permite.
- WHEN la solución aún no se ha revelado
- THEN no aparece ninguna tarjeta de solución.
