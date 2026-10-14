## Aceptación
- Exactamente 2.000 preguntas aprobadas, 200 en cada una de diez categorías.
- Las categorías nuevas son Videojuegos y Mitos y leyendas; Animación conserva
  animación y anime, mientras las preguntas sobre juegos pasan a Videojuegos.
- Cada categoría contiene las tres dificultades, al menos 50 de cada nivel.
- Se conservan IDs y contenido previo, salvo la categoría de juegos reclasificados.
- No se añaden preguntas de banderas; como máximo 5 % del catálogo trata banderas.
- Videojuegos incluye LoL y variedad de juegos clásicos y actuales; Naturaleza
  incluye animales y la nueva categoría incluye criaturas legendarias.
- Cada pregunta acota versión, parte y estado cuando procede, tiene explicación,
  fuente verificable y entre uno y cuatro colores distintos de la paleta.
- No hay IDs o enunciados duplicados ni variaciones que pregunten el mismo hecho.
- Los filtros funcionan para las diez categorías y las tres dificultades, tanto
  en partidas presenciales como online, y el catálogo coincide entre web y Worker.

## Implementación
El documento de sala crece por encima del límite de 128 KiB de un valor KV en
Durable Objects. Guardar su JSON en bloques UTF-8 acotados, con índice y escritura
transaccional, y leer también el formato anterior. Ordenar primero el mazo
inmutable para reescribir únicamente los bloques que cambian en cada transición.
Probar rollback cuando falla un bloque intermedio y recuperar una sala de 2.000.

Inventario editorial compacto con hechos y fuentes, expansión determinista a JSON,
validación estructural y de cobertura, comprobación editorial y conservación de
entradas anteriores. Actualizar conteos de interfaz a partir de los datos.

## Pruebas
Conservación salvo reclasificación, 200 por categoría, niveles, paleta, fuentes,
duplicados, banderas y variedad de videojuegos. Pruebas de motor y de filtros en
los nuevos grupos, y publicación del mismo catálogo en servicio y frontend.
Las comprobaciones remotas que escriben usan un Worker `-test` con Durable Objects
independientes; producción se comprueba por sus recursos públicos y `/health`.

## Riesgos
Los colores dependen de adaptaciones, ejemplares o versiones. No usar como hechos
universales lo que solo corresponde a un diseño concreto ni aprobar sin revisar.
