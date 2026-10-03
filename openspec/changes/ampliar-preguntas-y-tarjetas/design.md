# Diseño

Especificación afectada: `openspec/specs/juego/spec.md`, requisitos de catálogo
y nueva presentación de soluciones. Se conserva el motor y las instantáneas.

## Aceptación
- Hay exactamente 50 aprobadas nuevas y 98 en total, en las ocho categorías.
- Las 49 entradas previas (incluido el borrador) conservan contenido e IDs.
- Cada nueva pregunta tiene revisión factual, URL real y fecha ISO.
- La solución muestra una tarjeta por color, centradas como grupo.
- Cada tarjeta usa el color de la paleta, mide al menos 140 × 170 px cuando
  hay espacio y contiene su nombre en negrita centrado en ambos ejes.
- Se admiten 1–4 tarjetas, envueltas sin desbordar a 320 px.
- El texto alcanza 4,5:1 para los once colores; blanco tiene borde visible.
- La solución sigue oculta antes de revelar y se aplica en los tres modos.

## Implementación y pruebas
Consultar fuentes, incorporar JSON versionado, adaptar `colorTags` reutilizando
tokens de radio, sombra y paleta. Elegir texto oscuro o blanco calculando
luminancia en una utilidad de presentación. Pruebas de catálogo, conservación,
contraste y DOM/layout con Chrome; capturas de 1, 2 y 4 tarjetas en escritorio
y móvil. Ejecutar las regresiones de juego y validar OpenSpec.

## Riesgos
Las fuentes pueden cambiar; solo se aprueban afirmaciones contrastadas. Las
partidas existentes conservarán sus preguntas, pero usarán la presentación nueva.
La verificación móvil es emulación de anchura, no dispositivos reales.
