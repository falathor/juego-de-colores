# Diseño e implementación

La especificación fuente es `ESPECIFICACION-JUEGO-COLORES.md`.
`openspec/specs/juego/spec.md` concreta sus requisitos verificables.

1. Separar catálogo, motor inmutable, almacenamiento y DOM.
2. Persistir instantáneas versionadas de preguntas y resultados. El marcador
   se deriva de rondas consolidadas; nunca se incrementa como efecto de renderizar.
3. Modelar fases: pregunta, neutral, respuesta, lista para revelar, resultado,
   final. Cada operación exige la fase esperada y es inocua si se repite.
4. Mezclar mediante Fisher–Yates dos grupos: nuevas y previamente vistas.
   Guardar el orden completo para permitir sustituciones tras anular.
5. Usar elementos nativos, etiquetas, foco y una región de avisos compartida.
6. Validar catálogo y restauraciones antes de utilizarlos; guardar en memoria
   cuando falla el almacenamiento persistente.

## Pruebas
Ejecutor ES modules de navegador y Node, sin paquetes: conjuntos, límites,
turnos privados, puntuación, doble acción, anulación, agotamiento, filtros,
validación, restauración y fallos de almacenamiento. Comprobar por HTTP raíz
y subcarpeta y recorrer las pantallas en navegador de escritorio si disponible.

## Riesgos y supuestos
Las respuestas son públicas y la privacidad es casual. El historial es local,
sin sincronización. Los dispositivos iOS/Android requieren validación física
cuando no estén disponibles. La dificultad inicial tiene predominio fácil;
las propuestas ambiguas se reformulan sin reciclar sus IDs para otros temas.
