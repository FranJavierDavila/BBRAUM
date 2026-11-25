# Cómo editar la base de datos en local

Guía práctica para `bbraun.db`, la base de datos de **Evaluación de Inspección Visual (BBRAUN)**. Vale para la copia descargada del panel («Copia» → «Descargar copia») y para la base de datos de tu instalación local (`aplicacion/datos-ficheros/bbraun.db`).

## Antes de empezar: hay tres formas de editarla

| Forma | Qué usar | Cuándo |
| --- | --- | --- |
| **1. Desde la propia aplicación** (recomendada) | Panel de administración → Contenidos / Códigos QR / Usuarios | Para casi todo: textos, nombres, severidad, preguntas, material, QR |
| **2. Editando la BD directamente** | **DB Browser for SQLite** (gratuito, oficial: https://sqlitebrowser.org) | Cambios en lote que el panel no cubre (p. ej. sustituir un texto en los 40 defectos de una vez) |
| **3. Cargador de material** | `herramientas/cargador-material/` del paquete (§11.1 de la guía de despliegue) | Cargar en lote modelos GLB, textos y preguntas preparados en JSON |

Empieza por la forma 1: la aplicación valida lo que guardas y gestiona los ficheros por ti. Las formas 2 y 3 son para trabajo en lote.

## Forma 1 — Editar desde la propia aplicación (sin SQL)

1. Arranca tu instalación local (`iniciar-servidor.bat`) y entra como `admin`.
2. Edita lo que necesites en **Contenidos** (defectos y sus 7 apartados), **Códigos QR**, **Credenciales** o **Registros**.
3. Abre la pestaña **«Copia»** → **«Descargar copia»**: obtienes un ZIP con la base de datos y todo tu material.
4. En el acceso **online**: panel → **«Copia»** → **«Restaurar copia»** con ese ZIP.

Consejo: haz tus ediciones en **un solo sitio** (p. ej. siempre en local) antes de volcarlas online, porque la restauración **sustituye** el contenido del destino por el de la copia.

## Forma 2 — Editar la base de datos con DB Browser

### Preparación

1. Instala **DB Browser for SQLite**: https://sqlitebrowser.org (gratuito y oficial, funciona en Windows).
2. **Cierra la aplicación** (ventana de consola incluida). La base de datos no debe abrirse nunca mientras la app esté en marcha.
3. Trabaja **sobre una copia**: copia `aplicacion/datos-ficheros/bbraun.db` a otra carpeta y edita esa copia. Conserva siempre el último ZIP de copia que descargaste: es tu red de seguridad.
4. Si junto a la base de datos ves archivos `bbraun.db-wal` o `bbraun.db-shm`, la aplicación está (o estuvo) en marcha: ciérrala correctamente antes de editar.

### Edición paso a paso

1. Abre DB Browser → **«Abrir base de datos»** → selecciona la copia de `bbraun.db`.
2. Pestaña **«Examinar datos»** → elige la tabla en el desplegable → edita las celdas como en una hoja de cálculo.
3. Pulsa **«Escribir cambios»** (botón azul) para guardar en el fichero.
4. Para consultas o cambios en lote usa la pestaña **«Ejecutar SQL»**.
5. Cuando termines: **cierra DB Browser** (así libera el fichero).

### Qué contiene cada tabla

| Tabla | Qué guarda | ¿Editar a mano? |
| --- | --- | --- |
| `Defect` | Los 40 defectos: `code` (D001…D040), `name`, `displayName`, `category`, `severity` (MENOR/MAYOR/CRITICO), `modelPath` (modelo 3D), `order`, y los textos de la ficha: `description`, `detail`, `causes`, `risks`, `detection`, `action`, `prevention`, `regulation` | **Sí** — es la tabla principal de contenidos |
| `Question` | Las preguntas del examen: `defectId`, `variant` (1–5), `text`, `optionA`, `optionB`, `optionC`, `correct` ("A"/"B"/"C"), `explanation`. Cada defecto tiene 5 variantes | **Sí** — respeta `variant` 1–5 y `correct` en mayúscula |
| `DefectMedia` | Material de cada ficha: `defectId`, `type` (IMAGE/VIDEO/AUDIO/EMBED), `url`, `title`, `caption`, `section`, `orderIndex` | **Sí** — la `url` debe existir como fichero (ver abajo) |
| `User` | Usuarios del sistema | **Contraseñas NO**: van cifradas, cámbialas desde el panel (Credenciales) |
| `EvalConfig` | Ajustes generales: número de preguntas finales, teoría durante el examen, evaluación por QR | Mejor desde el panel (Configuración) |
| `Attempt`, `FinalAnswer` | Registros de exámenes realizados | **No** — son datos de uso real; se consultan desde el panel |
| `_prisma_migrations` | Interno del sistema | **Nunca tocar** |

### Reglas de oro al editar a mano

- **No cambies nunca** los valores de `id` (identificadores largos tipo `clxyz...`) ni los `defectId` que los referencian: son los enlaces entre tablas.
- **No renombres tablas ni columnas**, y no añadas columnas nuevas.
- Si creas un defecto nuevo, usa un `code` libre (p. ej. `D041`) y un `id` nuevo e irrepetible.
- Si añades material: el fichero va en la carpeta de datos y la fila de `DefectMedia` apunta a él (ver siguiente apartado).

### Dónde van los ficheros de material (imágenes, vídeos, audio, GLB)

La base de datos solo guarda **referencias**; los ficheros viven en la carpeta de datos:

- En tu instalación local: `aplicacion/datos-ficheros/uploads/…`
- En el ZIP de copia: dentro de la carpeta `ficheros/…`

La regla: si una fila de `DefectMedia` tiene `url = /uploads/defects/D002/foto.jpg`, el fichero debe existir en:

```
aplicacion/datos-ficheros/uploads/defects/D002/foto.jpg      (instalación local)
ficheros/defects/D002/foto.jpg                               (dentro del ZIP de copia)
```

El campo `section` de `DefectMedia` sitúa el material en la ficha: `header`, `description`, `risks`, `causes`, `action`, `detection`, `prevention` o `regulation`; si lo dejas vacío aparece en la **galería del pie** de la ficha.

### Ejemplos SQL útiles (pestaña «Ejecutar SQL»)

Cambiar un texto en un defecto concreto:

```sql
UPDATE Defect SET detection = 'Nuevo texto de detección…' WHERE code = 'D017';
```

Sustituir una palabra en los 40 defectos de una vez:

```sql
UPDATE Defect SET causes = REPLACE(causes, 'clamps', 'pinzas');
```

Ver las 5 preguntas de un defecto:

```sql
SELECT variant, text, correct FROM Question
  WHERE defectId = (SELECT id FROM Defect WHERE code = 'D003')
  ORDER BY variant;
```

Añadir una imagen a la galería del pie de una ficha (además, copia el fichero a la carpeta de datos como se explica arriba):

```sql
INSERT INTO DefectMedia (id, defectId, type, url, title, section, orderIndex, createdAt)
VALUES ('cl-foto-nueva-001',
        (SELECT id FROM Defect WHERE code = 'D002'),
        'IMAGE', '/uploads/defects/D002/foto-nueva.jpg',
        'Foto de contraluz', NULL, 10, datetime('now'));
```

Corregir la respuesta correcta de una pregunta:

```sql
UPDATE Question SET correct = 'C', explanation = 'Nuevo motivo…'
  WHERE defectId = (SELECT id FROM Defect WHERE code = 'D010') AND variant = 2;
```

## Después de editar: comprobar y volcar al acceso online

1. Copia la base de datos editada a `aplicacion/datos-ficheros/bbraun.db` (con la app **cerrada**; guarda la anterior como `bbraun.db.copia-antes`).
2. Arranca la aplicación y revisa fichas, examen y material: si algo no te gusta, vuelve a poner la copia anterior.
3. Si todo va bien: entra como `admin` → **«Copia»** → **«Descargar copia»**.
4. En el acceso online: **«Copia»** → **«Restaurar copia»** con ese ZIP.

No hace falta construir el ZIP a mano: la propia aplicación lo genera con la estructura correcta. La restauración online valida el ZIP y la base de datos antes de aplicar nada (desde v1.4.10), así que una copia dañada se rechaza con un mensaje claro y el acceso online queda como estaba.

## Recordatorio final

Edita en un solo sitio (normalmente en local), comprueba en la aplicación, descarga la copia y restaurala online. Y antes de cualquier edición directa, un ZIP de copia descargado te devuelve todo tal estaba en un minuto.
