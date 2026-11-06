# B. Braun · Sistema de Evaluación de Inspección Visual (botellas de suero)

Aplicación de formación en control de calidad para la inspección visual de botellas de suero: catálogo de 40 defectos con ficha técnica estructurada, visor 3D del envase, pruebas de evaluación con modelos 3D por pregunta, panel de administración y sistema de acceso por códigos QR.

Versión: **v1.4**

## Demo pública (GitHub Pages)

Una **demo estática** de la v1.4 está publicada en: **https://franjavierdavila.github.io/BBRAUM/**

Incluye la Teoría completa (40 defectos con la ficha de 7 apartados), el visor 3D y una
autoevaluación de demostración (los resultados no se registran). No incluye acceso con
usuario, panel de administración ni exportación: eso requiere el servidor interno.

## Características

- **Teoría** — Catálogo de 40 códigos de defecto (D001–D040). Cada ficha sigue la estructura validada de 7 apartados numerados y siempre visibles: 1 · Defecto, 2 · Descripción breve, 3 · Riesgos para el paciente, 4 · Causas habituales, 5 · Actuación correcta, 6 · Guía para su detección durante la inspección, 7 · Prevención y buenas prácticas (con nota normativa al pie).
- **Visor 3D** — three.js 0.186 con iluminación de entorno PBR (RoomEnvironment + PMREM), tone mapping ACESFilmic, fondo degradado de estudio, OrbitControls y maximizado. Los modelos GLB comprimidos con Draco se decodifican con decodificadores locales en `public/draco/` (funciona sin Internet).
- **Prueba de Evaluación** — Batería configurable (1–40 preguntas, el administrador la ajusta), un modelo 3D por pregunta con respuesta inmediata, progreso y resultado con umbral de superación.
- **Panel de administración** — Gestión de contenidos (los 7 apartados editables por defecto), configuración de la prueba (nº de preguntas, permitir o no consultar la Teoría durante la prueba), registros de intentos con filtro y exportación CSV/Excel, y pestaña de **Códigos QR**: URL base configurable, PNG por código, ZIP descargable y hoja de etiquetas A4 imprimible. Escaneando el QR se abre la ficha del defecto directamente.
- **Acceso** — Login/registro con consentimiento RGPD/LOPDGDD, sesiones firmadas (cookie HttpOnly), roles administrador/evaluado.

## Tecnologías

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Prisma (SQLite) · three.js · bcryptjs · qrcode · jszip · SheetJS (xlsx)

## Puesta en marcha (desarrollo)

Requisitos: [Bun](https://bun.sh) (o Node.js 20+ con npm) — no hace falta base de datos instalada, se usa SQLite.

```bash
cp .env.example .env          # y ajusta la ruta absoluta en DATABASE_URL
bun install
bun run db:generate           # cliente Prisma
bun run db:push               # crea db/custom.db a partir del esquema
bun scripts/seed.ts           # 40 defectos + 200 preguntas + admin
bun scripts/add-demo-user.ts  # usuario demo inspector1
bun run dev                   # http://localhost:3000
```

Opcional: `bun scripts/apply-content.ts` y `bun scripts/seed-media.ts` (contenido/media adicional).

**Credenciales de demostración:** `admin / admin` (administrador) · `inspector1 / test1234` (evaluado). Cámbialas antes de cualquier uso real.

## Producción

```bash
bun run build                 # compila el standalone y copia .next/static + public
PORT=3000 HOSTNAME=0.0.0.0 \
DATABASE_URL="file:$PWD/datos/bbraun.db" \
AUTH_SECRET="<secreto>" NODE_ENV=production node .next/standalone/server.js
```

> Nota Next 16: el build standalone **no incluye** `.next/static`; el script `build` ya lo copia. Si lo lanzas a mano sin copiarlo, la página se carga pero queda en blanco (los chunks dan 404). Al arrancar con `node server.js` directamente, Prisma exige `DATABASE_URL` como ruta **absoluta** en el entorno.

## Estructura

```
src/app/                  Rutas App Router (login, evaluación, admin, APIs)
src/components/eval/      UI del sistema: eval-view, defect-view (7 apartados),
                          model-viewer (visor three.js), admin-view, test-view…
src/lib/                  Autenticación, QR, utilidades
prisma/schema.prisma      Modelos: User, Defect, Question, Attempt, FinalAnswer, EvalConfig…
scripts/                  seed.ts (40 defectos + 200 preguntas), add-demo-user.ts,
                          apply-content.ts, seed-media.ts
public/models/            Modelos 3D GLB (suero.glb con compresión Draco)
public/draco/             Decodificadores Draco locales
```

## Notas

- Proyecto interno de formación (Departamento de Calidad). Uso interno.
- La base de datos (SQLite) se crea localmente con los seeds; no se versiona.
- El paquete de despliegue autocontenido (con Node.js portable para Windows, instrucciones IIS/HTTPS y manual funcional) se distribuye aparte como ZIP.
