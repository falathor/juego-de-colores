# Validación de la entrega

Fecha: 3 de octubre de 2026.

## Comprobaciones realizadas

- **28/28 pruebas de lógica y catálogo** con `node tests/run.mjs`, sin paquetes
  del proyecto. Incluyen un flujo con cuatro equipos y restauración en cada turno.
- **15/15 pruebas online** con `node --test tests/online.test.mjs`: roles,
  privacidad de respuestas, capacidad, caducidad, códigos con ceros, filtros,
  idempotencia, anulación, petición antigua, conservación de confirmaciones
  concurrentes, CORS y autenticación. Los fallos intermedios de persistencia
  fuerzan rollback del documento y alarma; no se conecta a datos de producción.
- **5/5 comprobaciones multijugador**, con tres contextos independientes de
  Chrome, contra Wrangler local y contra el Worker publicado de Cloudflare:
  entrada por código/enlace, roles, respuestas simultáneas ocultas, recarga,
  revelación compartida, puntos sin duplicados, anulación, cierre de ronda con
  ausentes, diez rondas puntuables, empate y cierre de sala. Invitado a 320 px.
- **13/13 comprobaciones de navegador** con Playwright externo y Chrome de
  escritorio. Partidas completas presenciales e individual anterior, respuestas ocultas,
  teclado para seleccionar, límite de selección, recarga de turnos y resultados,
  empate, nombres interpretados como texto, marcador físico, anulación y
  agotamiento, filtros, corrupción y fallo de `localStorage`.
- Carga por HTTP en raíz y `/juego-de-colores/`, con partida completada en la
  subcarpeta. CSS, módulos y JSON se cargan con rutas relativas.
- Sin errores de consola en los flujos comprobados ni descargas externas de
  fuentes, imágenes o librerías. En línea se consulta únicamente el servicio
  de partidas; abrir el inicio no conecta con Cloudflare.
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
- **OpenSpec: 7/7 elementos válidos**, cambios `crear-juego`,
  `ampliar-preguntas-y-tarjetas`, `publicar-github-pages`, `ampliar-catalogo-100` y especificación
  `jugar-en-linea`, `personalizar-nombre` y especificación `juego`, mediante `openspec validate --all`
  usando la CLI externa. Los avisos informativos de archivo de cambios
  anteriores proceden de requisitos ya sincronizados; no hay errores de validación.

## Contenido y tamaño

198 preguntas aprobadas: veinticuatro en cine y animación y veinticinco en cada
una de las otras seis categorías. La versión 1.2.0 incorpora exactamente 100 nuevas;
se ha comparado con el catálogo anterior y sus 99 entradas permanecen intactas.
Una prueba de conservación comprueba la huella de las entradas de ambas versiones anteriores.
Cada pregunta aprobada
incluye referencia consultada y fecha de revisión. Hay un borrador adicional
excluido de las partidas. No se han comprobado las respuestas simplemente
mediante el validador de JSON: se consultaron fuentes durante la preparación.

HTML + CSS + nueve módulos JS: **85.605 bytes** (aprox. 85,6 KB, sin comprimir).
Catálogo: **136.037 bytes** (aprox. 136 KB, sin comprimir).
La aplicación mantiene el presupuesto orientativo de 100 KB. El catálogo supera
ese objetivo inicial al incorporar las cien preguntas solicitadas; permanece como
JSON legible sin añadir dependencias ni una compilación.
Las pruebas y documentación no se descargan durante una partida.

## Pendiente de comprobación externa

Safari en iOS y Chrome en Android **no se han probado en dispositivos reales**.
La emulación de ancho en Chrome no verifica esos motores ni el comportamiento
de sus teclados, áreas seguras o almacenamiento. Tampoco se ha auditado con un
lector de pantalla ni se ha realizado una certificación completa de accesibilidad.

No se garantiza recargar sin conexión. El modo online sincroniza por consulta
cada dos segundos, necesita red y no transfiere automáticamente el anfitrión.
Las salas duran hasta seis horas y están sujetas a las cuotas del servicio.

## Publicación

- Repositorio público: https://github.com/falathor/juego-de-colores.
- Web HTTPS: https://falathor.github.io/juego-de-colores/.
- GitHub Pages configurado desde la raíz de `main`; despliegue inicial correcto.
- Las actualizaciones se publican mediante `git push origin main`.
- Publicación anterior del catálogo (versión 1.2.0): **13/13 comprobaciones remotas correctas** con el ejecutor de navegador y
  Chrome de escritorio: 198 preguntas, los tres modos, recarga, puntuación,
  filtros, anulación, privacidad de turnos y tarjetas a 320 px, sin errores de
  consola. También se ejecutaron **28/28 pruebas** desde la web publicada.
  Los resultados detallados están en `artifacts/browser-results.json`.
- Despliegue del commit `7b665a0` completado correctamente. El catálogo público
  sirve `contentVersion: 1.2.0`, con 198 aprobadas y 199 entradas totales.
- Servicio de salas publicado y comprobado:
  https://colors-online-falathor.colors-online-service.workers.dev.
  Se ha autorizado Wrangler con la cuenta del usuario y publicado el Worker
  con dos Durable Objects SQLite. No se activaron planes de pago.
- Actualización multijugador del commit `7a18605`: despliegue de GitHub Pages
  completado correctamente. **5/5 comprobaciones multijugador remotas** sobre
  la web publicada y su configuración real, sin sustituir módulos del cliente,
  además de **13/13 comprobaciones de navegador presenciales y de compatibilidad**
  y **28/28 pruebas de juego y catálogo** ejecutadas desde la web.
  Se verificaron los módulos públicos y la URL del servicio. Los informes están
  en `artifacts/online-browser-results.json` y `artifacts/browser-results.json`.

## Personalización de nombres

Actualización: 4 de octubre de 2026.

- Acción autenticada para cambiar únicamente el nombre propio, disponible en
  la sala de espera, durante las rondas y en el resultado final.
- Dos pruebas nuevas cubren validación, duplicados, controles, nombres de
  1–24 caracteres, conservación de identidad, rol, respuestas y puntos, y
  asignación automática cuando ya existe un nombre equivalente en minúsculas.
- El ejecutor multijugador incorpora una sexta comprobación: personalización
  por enlace, código y anfitrión, sincronización, nombres como texto y recarga.
  También verifica cambios con una respuesta confirmada y con puntos guardados.
- **6/6 comprobaciones multijugador locales correctas** contra Wrangler,
  además de las **15/15 pruebas online** y **7/7 validaciones OpenSpec**.
