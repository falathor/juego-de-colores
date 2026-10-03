## ADDED Requirements

### Requirement: Catálogo ampliado a 198 preguntas
El catálogo SHALL añadir exactamente cien preguntas aprobadas a la versión
1.1.0, con IDs nuevos, fuentes revisadas y fecha ISO, repartidas entre las ocho
categorías. SHALL conservar sus 99 entradas previas y usar contentVersion 1.2.0.

#### Scenario: Ampliación publicada
- GIVEN el catálogo anterior con 98 aprobadas y un borrador
- WHEN se añade y publica la ampliación
- THEN la web sirve 198 aprobadas y 199 entradas, sin modificar las anteriores.
