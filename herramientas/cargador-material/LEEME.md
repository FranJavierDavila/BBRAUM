# Cargador de material — modelos GLB, textos, recursos y preguntas

Carga en lote, **en local**, todo el material real de los 40 defectos sin tocar código:

| Material | Dónde lo pones | Formato |
|---|---|---|
| Modelos 3D GLB (~12 MB) | `material/modelos/` | un fichero por defecto: `D001.glb`, `D002.glb`… |
| Textos de la ficha (7 apartados, nombre, familia, severidad) | `material/textos.csv` | editable en Excel |
| Recursos gráficos (imágenes, vídeos, audios) | `material/recursos/` + `material/media.csv` | archivos + tabla en Excel |
| Preguntas (autoevaluación y Prueba de Evaluación) | `material/preguntas.csv` | editable en Excel |

## Flujo de trabajo

Desde la carpeta **aplicacion/** del paquete (o la raíz del proyecto):

```bash
# 1) Genera las plantillas con tus datos actuales (textos.csv queda con los
#    40 defectos; preguntas.csv con las 200 preguntas; media.csv con lo cargado)
node herramientas/cargador-material/cargar-material.mjs --plantillas

# 2) Copia tus GLB a material/modelos/ con el nombre del código
#    (D001.glb, D002.glb, …) y tus imágenes/vídeos/audios a material/recursos/
#
# 3) Edita los CSV con Excel (se abren directamente: separador «;», UTF-8)
#    y revisa el plan — NO escribe nada todavía:
node herramientas/cargador-material/cargar-material.mjs

# 4) Cuando la revisión esté limpia, aplica:
node herramientas/cargador-material/cargar-material.mjs --ejecutar
```

Los cambios quedan **integrados en la base de datos** y en `public/models` y
`public/uploads`; se ven al momento en la aplicación (si el servidor está
apagado, arranca con `iniciar-servidor.bat` / `iniciar-servidor.sh` como siempre).

## Cómo rellenar los CSV

Reglas comunes: **celda vacía = «no tocar»** (puedes ir cargando por partes) y
guión `-` = «dejar vacío». La columna `codigo` es la única obligatoria.

**textos.csv** — `codigo;nombre;display_name;categoria;severidad;descripcion;detalle;riesgos;causas;accion;deteccion;prevencion;regulacion`
- `severidad`: MENOR | MAYOR | CRITICO.
- Los 8 últimos campos son los apartados de la ficha: descripción, detalle, riesgos, causas, acción, detección, prevención y regulación.

**preguntas.csv** — `codigo;variante;pregunta;opcionA;opcionB;opcionC;correcta;explicacion`
- `variante`: número entero (1…20); distinta variante = más preguntas en el banco del defecto.
- `correcta`: A | B | C. Aquí las celdas vacías NO valen (una pregunta incompleta se rechaza).

**media.csv** — `codigo;tipo;archivo_o_url;titulo;apartado;orden;texto`
- `tipo`: imagen | video | audio | enlace. Para `enlace`, en `archivo_o_url` va la URL completa (YouTube, intranet…); para los demás, el **nombre del fichero** dentro de `material/recursos/`.
- `apartado`: ficha | descripcion | riesgos | causas | accion | deteccion | prevencion | regulacion | (vacío = galería del pie de la ficha).
- `orden`: número para ordenar dentro del apartado. `texto` = pie de foto / descripción corta.
- Ojo: las filas de `media.csv` definen **todo el material de los defectos que aparezcan en el fichero** (si cargas material nuevo de un defecto, incluye también sus recursos anteriores o desaparecerán).

## Notas

- Tamaño: 40 GLB de ~12 MB ≈ 480 MB en `public/models`. Haz copia de la base de datos (`datos/bbraun.db`) y de `public/` antes de cargas grandes.
- La revisión (`sin --ejecutar`) valida códigos, tipos, apartados y la existencia de los ficheros; si algo falla, no se aplica nada.
- Para volver atrás: copia de seguridad previa de `datos/bbraun.db` (guía de backups en `INSTRUCCIONES-DESPLIEGUE.md`).
- Ejecuta el comando desde la carpeta `aplicacion/` para que encuentre la base de datos por defecto; si la tienes en otra ruta: `--bd datos/bbraun.db`.
