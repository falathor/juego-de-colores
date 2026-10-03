# Validación de la entrega

Fecha: 3 de octubre de 2026.

## Comprobaciones realizadas

- **27/27 pruebas de lógica y catálogo** con `node tests/run.mjs`, sin paquetes
  del proyecto. Incluyen un flujo con cuatro equipos y restauración en cada turno.
- **13/13 comprobaciones de navegador** con Playwright externo y Chrome de
  escritorio. Partidas completas en los tres modos, respuestas ocultas,
  teclado para seleccionar, límite de selección, recarga de turnos y resultados,
  empate, nombres interpretados como texto, marcador físico, anulación y
  agotamiento, filtros, corrupción y fallo de `localStorage`.
- Carga por HTTP en raíz y `/juego-de-colores/`, con partida completada en la
  subcarpeta. CSS, módulos y JSON se cargan con rutas relativas.
- Sin errores de consola en los flujos de navegador comprobados ni descargas
  externas de fuentes, imágenes, librerías o servicios durante el juego.
- Viewports de 1280 × 900 y 320 × 740. Sin desplazamiento horizontal en inicio,
  configuración, pregunta, selección y solución a 320 px. Once opciones con etiqueta,
  tres columnas móviles, controles de al menos 44 px y foco de teclado visible.
- Viewport de 640 × 450 como aproximación del espacio CSS disponible al ampliar
  al 200 % una ventana de 1280 × 900. No equivale a probar el zoom nativo en
  todos los navegadores.
- Inspección visual de capturas de inicio de escritorio, selección móvil y
  resultado de equipos. Capturas e informe del navegador en `artifacts/`, sin
  incluirlos en Git ni en los recursos necesarios para publicar.
- Contraste calculado: texto principal 14,58:1; secundario 5,22:1; botón
  principal 7,81:1; selección 8,56:1; acierto 7,09:1; error 6,83:1 y aviso
  7,68:1. Las etiquetas de la paleta usan superficies neutras.
- Tarjetas de solución centradas para uno, dos, tres y cuatro colores: 180 × 220 px
  en escritorio y 150 × 185 px en móvil; nombres en negrita centrados en ambos
  ejes y borde visible. Comprobados los once fondos de la paleta; contraste de
  texto mínimo calculado **4,91:1**. Capturas adicionales `tarjetas-*.png` en
  `artifacts/` usan datos ficticios para comprobar la presentación.
- **OpenSpec: 4/4 elementos válidos**, cambios `crear-juego`,
  `ampliar-preguntas-y-tarjetas`, `publicar-github-pages` y especificación
  `juego`, mediante `openspec validate --all` usando la CLI externa.

## Contenido y tamaño

98 preguntas aprobadas: trece en España y series y doce en cada una de las
otras seis categorías. La versión 1.1.0 incorpora exactamente 50 nuevas;
se ha comparado con el catálogo anterior y sus 49 entradas permanecen intactas.
Cada pregunta aprobada
incluye referencia consultada y fecha de revisión. Hay un borrador adicional
excluido de las partidas. No se han comprobado las respuestas simplemente
mediante el validador de JSON: se consultaron fuentes durante la preparación.

HTML + CSS + cinco módulos JS: **57.868 bytes** (aprox. 57,9 KB, sin comprimir).
Catálogo: **67.921 bytes** (aprox. 67,9 KB, sin comprimir).
Ambos cumplen el presupuesto orientativo de 100 KB por bloque.
Las pruebas y documentación no se descargan durante una partida.

## Pendiente de comprobación externa

Safari en iOS y Chrome en Android **no se han probado en dispositivos reales**.
La emulación de ancho en Chrome no verifica esos motores ni el comportamiento
de sus teclados, áreas seguras o almacenamiento. Tampoco se ha auditado con un
lector de pantalla ni se ha realizado una certificación completa de accesibilidad.

No hay sincronización entre dispositivos ni soporte garantizado de recarga
sin conexión.

## Publicación

- Repositorio público: https://github.com/falathor/juego-de-colores.
- Web HTTPS: https://falathor.github.io/juego-de-colores/.
- GitHub Pages configurado desde la raíz de `main`; despliegue inicial correcto.
- Las actualizaciones se publican mediante `git push origin main`.
- **13/13 comprobaciones remotas correctas** con el ejecutor de navegador y
  Chrome de escritorio: 98 preguntas, los tres modos, recarga, puntuación,
  filtros, anulación, privacidad de turnos y tarjetas a 320 px, sin errores de
  consola. También se ejecutaron **27/27 pruebas** desde la web publicada.
  Los resultados detallados están en `artifacts/browser-results.json`.
