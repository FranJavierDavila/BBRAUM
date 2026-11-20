#!/usr/bin/env node
/**
 * ============================================================================
 * CARGADOR DE MATERIAL — B. Braun · Evaluación de Inspección Visual (v1.4.3)
 * ============================================================================
 * Carga en lote, en local, el material real de los 40 defectos:
 *   - Modelos 3D GLB (p. ej. ~12 MB cada uno)      → material/modelos/D001.glb …
 *   - Textos de la ficha (7 apartados)             → material/textos.csv
 *   - Recursos gráficos (imagen/vídeo/audio/enlace)→ material/recursos/* + media.csv
 *   - Preguntas de autoevaluación y prueba         → material/preguntas.csv
 *
 * USO (desde la carpeta aplicacion/ del paquete, o desde la raíz del proyecto):
 *   node herramientas/cargador-material/cargar-material.mjs --plantillas
 *         → genera los CSV de partida (textos, preguntas y media con tus datos actuales)
 *   node herramientas/cargador-material/cargar-material.mjs
 *         → revisa el material y muestra el PLAN (no escribe nada)
 *   node herramientas/cargador-material/cargar-material.mjs --ejecutar
 *         → aplica los cambios a la base de datos y copia los ficheros
 *
 * Opciones:
 *   --material <ruta>   carpeta de material (por defecto: ./material)
 *   --bd <ruta.db>      base de datos SQLite (por defecto: DATABASE_URL, luego
 *                       ./datos/bbraun.db y luego ./db/custom.db)
 *   --dry-run           sinónimo de no pasar --ejecutar
 *
 * Sin dependencias externas: usa el cliente Prisma que ya trae la aplicación.
 * ============================================================================
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// ----------------------------------------------------------------------------
// Utilidades de línea de comandos
// ----------------------------------------------------------------------------
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--ejecutar") out.ejecutar = true;
    else if (a === "--plantillas") out.plantillas = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--material") out.material = argv[++i];
    else if (a === "--bd") out.bd = argv[++i];
    else if (a === "--ayuda" || a === "--help" || a === "-h") out.ayuda = true;
    else out._.push(a);
  }
  return out;
}

const args = parseArgs(process.argv);

if (args.ayuda) {
  console.log(fs.readFileSync(new URL("./LEEME.md", import.meta.url), "utf8"));
  process.exit(0);
}

const die = (msg) => { console.error(`\nERROR: ${msg}\n`); process.exit(2); };

// ----------------------------------------------------------------------------
// Resolución de rutas: base de datos y carpeta de material
// ----------------------------------------------------------------------------
function resolveDbUrl() {
  if (args.bd) return "file:" + path.resolve(args.bd);
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const cand of ["datos/bbraun.db", "db/custom.db", "../db/custom.db"]) {
    if (fs.existsSync(cand)) return "file:" + path.resolve(cand);
  }
  return null;
}

const dbUrl = resolveDbUrl();
if (!dbUrl) die("No se ha encontrado la base de datos. Usa --bd <ruta.db> (p. ej. --bd datos/bbraun.db).");
process.env.DATABASE_URL = dbUrl;

const MATERIAL_DIR = path.resolve(args.material || "material");

// ----------------------------------------------------------------------------
// Lector CSV: separador «;», UTF-8 con BOM, campos entrecomillados con "" de escape
// ----------------------------------------------------------------------------
function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // BOM
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ";") {
      row.push(field); field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some(c => c !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some(c => c !== "")) rows.push(row);
  return rows;
}

function readCsv(file, expectedCols) {
  if (!fs.existsSync(file)) return { rows: [], missing: true };
  const raw = fs.readFileSync(file, "utf8");
  const table = parseCsv(raw);
  if (!table.length) return { rows: [], missing: false };
  const header = table[0].map(h => h.trim().toLowerCase());
  const missing = expectedCols.filter(c => !header.includes(c));
  const rows = table.slice(1).map((r, idx) => {
    const o = { __line: idx + 2 };
    expectedCols.forEach((c, i) => { o[c] = (r[i] ?? "").trim(); });
    return o;
  });
  return { rows, missing: missing.length > 0, missingCols: missing, header };
}

// Celda vacía = «no tocar»; el guión «-» = «dejar vacío / limpiar»
const isSet = (v) => v !== "" && v !== undefined;
const toClear = (v) => v === "-";
const clean = (v) => (v === "-" ? "" : v);

// ----------------------------------------------------------------------------
// Mapas de tipos y apartados
// ----------------------------------------------------------------------------
const TIPO_MAP = { imagen: "IMAGE", video: "VIDEO", audio: "AUDIO", enlace: "EMBED" };
const APARTADO_MAP = {
  "": null,
  ficha: "header",
  descripcion: "description",
  riesgos: "risks",
  causas: "causes",
  accion: "action",
  deteccion: "detection",
  prevencion: "prevention",
  regulacion: "regulation",
};
const SEV = ["MENOR", "MAYOR", "CRITICO"];

// ----------------------------------------------------------------------------
// Conexión Prisma (se importa tras fijar DATABASE_URL)
// ----------------------------------------------------------------------------
async function getPrisma() {
  const mod = await import("@prisma/client");
  return new mod.PrismaClient();
}

function slugify(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "recurso";
}

// ----------------------------------------------------------------------------
// MODO --plantillas: genera los CSV de partida con los datos actuales
// ----------------------------------------------------------------------------
async function generarPlantillas(prisma) {
  fs.mkdirSync(MATERIAL_DIR, { recursive: true });
  fs.mkdirSync(path.join(MATERIAL_DIR, "modelos"), { recursive: true });
  fs.mkdirSync(path.join(MATERIAL_DIR, "recursos"), { recursive: true });

  const defects = await prisma.defect.findMany({
    orderBy: [{ order: "asc" }, { code: "asc" }],
    include: { questions: { orderBy: { variant: "asc" } }, media: { orderBy: { orderIndex: "asc" } } },
  });

  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  // textos.csv — celdas vacías = «no tocar»; los textos ampliados se dejan vacíos a propósito
  let t = "\uFEFFcodigo;nombre;display_name;categoria;severidad;descripcion;detalle;riesgos;causas;accion;deteccion;prevencion;regulacion\n";
  for (const d of defects) {
    t += [d.code, d.name, d.displayName || "", d.category, d.severity, d.description, d.detail,
          "", "", "", "", "", ""].map(q).join(";") + "\n";
  }
  fs.writeFileSync(path.join(MATERIAL_DIR, "textos.csv"), t, "utf8");

  // preguntas.csv — banco actual completo, listo para editar o ampliar
  let p = "\uFEFFcodigo;variante;pregunta;opcionA;opcionB;opcionC;correcta;explicacion\n";
  for (const d of defects) {
    for (const question of d.questions) {
      p += [d.code, question.variant, question.text, question.optionA, question.optionB,
            question.optionC, question.correct, question.explanation].map(q).join(";") + "\n";
    }
  }
  fs.writeFileSync(path.join(MATERIAL_DIR, "preguntas.csv"), p, "utf8");

  // media.csv — material actual (urls externas) o referencia a recursos/
  let m = "\uFEFFcodigo;tipo;archivo_o_url;titulo;apartado;orden;texto\n";
  const INV_TIPO = { IMAGE: "imagen", VIDEO: "video", AUDIO: "audio", EMBED: "enlace" };
  const INV_SEC = { header: "ficha", description: "descripcion", risks: "riesgos", causes: "causas",
                    action: "accion", detection: "deteccion", prevention: "prevencion", regulation: "regulacion" };
  for (const d of defects) {
    for (const mm of d.media) {
      m += [d.code, INV_TIPO[mm.type] || mm.type, mm.url, mm.title,
            mm.section ? (INV_SEC[mm.section] || mm.section) : "", mm.orderIndex, mm.caption || ""]
            .map(q).join(";") + "\n";
    }
  }
  fs.writeFileSync(path.join(MATERIAL_DIR, "media.csv"), m, "utf8");

  console.log(`\nPlantillas generadas en ${MATERIAL_DIR}:`);
  console.log(`  - textos.csv     (${defects.length} defectos; vacío = no tocar; «-» = dejar vacío)`);
  console.log(`  - preguntas.csv  (${defects.reduce((n, d) => n + d.questions.length, 0)} preguntas actuales)`);
  console.log(`  - media.csv      (${defects.reduce((n, d) => n + d.media.length, 0)} recursos actuales)`);
  console.log("  - modelos/       (deja aquí los GLB con el nombre del código: D001.glb, D002.glb, …)");
  console.log("  - recursos/      (imágenes, vídeos y audios que referencias en media.csv)");
  console.log("\nEdita los CSV con Excel (se abre directamente; separador «;») y después ejecuta:");
  console.log("  node herramientas/cargador-material/cargar-material.mjs            (revisión)");
  console.log("  node herramientas/cargador-material/cargar-material.mjs --ejecutar (aplicar)");
  await prisma.$disconnect();
}

// ----------------------------------------------------------------------------
// MODO normal: leer material, validar y aplicar
// ----------------------------------------------------------------------------
async function main() {
  const prisma = await getPrisma();

  // ---- 1) Leer CSVs
  const COL_T = ["codigo","nombre","display_name","categoria","severidad","descripcion","detalle","riesgos","causas","accion","deteccion","prevencion","regulacion"];
  const COL_P = ["codigo","variante","pregunta","opciona","opcionb","opcionc","correcta","explicacion"];
  const COL_M = ["codigo","tipo","archivo_o_url","titulo","apartado","orden","texto"];

  const textos = readCsv(path.join(MATERIAL_DIR, "textos.csv"), COL_T);
  const preguntas = readCsv(path.join(MATERIAL_DIR, "preguntas.csv"), COL_P);
  const media = readCsv(path.join(MATERIAL_DIR, "media.csv"), COL_M);

  // ---- 2) Modelos GLB: material/modelos/<CODIGO>.glb
  const modelosDir = path.join(MATERIAL_DIR, "modelos");
  const glbFiles = fs.existsSync(modelosDir)
    ? fs.readdirSync(modelosDir).filter(f => f.toLowerCase().endsWith(".glb"))
    : [];

  if (textos.missing && preguntas.missing && media.missing && !glbFiles.length) {
    die(`No hay material que cargar en ${MATERIAL_DIR}.\nGenera las plantillas primero:\n  node herramientas/cargador-material/cargar-material.mjs --plantillas`);
  }

  const errores = [];
  const codesValidos = new Set((await prisma.defect.findMany({ select: { code: true } })).map(d => d.code));
  const defLookup = (code, linea, fichero) => {
    const c = (code || "").toUpperCase();
    if (!c) { errores.push(`${fichero} línea ${linea}: falta el código`); return null; }
    if (!codesValidos.has(c)) { errores.push(`${fichero} línea ${linea}: el código «${c}» no existe en el sistema (códigos D001…D040)`); return null; }
    return c;
  };

  if (textos.missing) errores.push(`textos.csv: cabecera incorrecta; faltan o difieren las columnas: ${textos.missingCols.join(", ")}`);
  if (preguntas.missing) errores.push(`preguntas.csv: cabecera incorrecta; faltan o difieren las columnas: ${preguntas.missingCols.join(", ")}`);
  if (media.missing) errores.push(`media.csv: cabecera incorrecta; faltan o difieren las columnas: ${media.missingCols.join(", ")}`);

  // ---- 3) Validar textos
  const textosOps = [];
  if (!textos.missing) for (const r of textos.rows) {
    const code = defLookup(r.codigo, r.__line, "textos.csv");
    if (!code) continue;
    const patch = {};
    if (isSet(r.nombre)) patch.name = r.nombre;
    if (isSet(r.display_name)) patch.displayName = toClear(r.display_name) ? null : r.display_name;
    if (isSet(r.categoria)) patch.category = r.categoria;
    if (isSet(r.severidad)) {
      const s = r.severidad.toUpperCase();
      if (!SEV.includes(s)) { errores.push(`textos.csv línea ${r.__line}: severidad «${r.severidad}» no válida (MENOR|MAYOR|CRITICO)`); continue; }
      patch.severity = s;
    }
    for (const [col, field] of [["descripcion","description"],["detalle","detail"],["riesgos","risks"],["causas","causes"],["accion","action"],["deteccion","detection"],["prevencion","prevention"],["regulacion","regulation"]]) {
      if (isSet(r[col])) patch[field] = clean(r[col]);
    }
    if (Object.keys(patch).length) textosOps.push({ code, patch });
  }

  // ---- 4) Validar preguntas
  const preguntasOps = [];
  if (!preguntas.missing) for (const r of preguntas.rows) {
    const code = defLookup(r.codigo, r.__line, "preguntas.csv");
    if (!code) continue;
    const variant = parseInt(r.variante, 10);
    if (!variant || variant < 1 || variant > 20) { errores.push(`preguntas.csv línea ${r.__line}: variante «${r.variante}» no válida (entero 1…20)`); continue; }
    if (!r.pregunta || !r.opciona || !r.opcionb || !r.opcionc) { errores.push(`preguntas.csv línea ${r.__line}: faltan pregunta/opciones (vacío = no se admite aquí; para borrar usa un CSV sin esa fila y --limpiar-preguntas)`); continue; }
    const correcta = (r.correcta || "").toUpperCase();
    if (!["A", "B", "C"].includes(correcta)) { errores.push(`preguntas.csv línea ${r.__line}: correcta «${r.correcta}» no válida (A|B|C)`); continue; }
    preguntasOps.push({ code, variant, data: { text: r.pregunta, optionA: r.opciona, optionB: r.opcionb, optionC: r.opcionc, correct: correcta, explanation: r.explicacion || "" } });
  }

  // ---- 5) Validar media y preparar copias a public/uploads
  const uploadsDir = path.resolve("public/uploads");
  const mediaOps = [];
  if (!media.missing) for (const r of media.rows) {
    const code = defLookup(r.codigo, r.__line, "media.csv");
    if (!code) continue;
    const tipo = TIPO_MAP[(r.tipo || "").toLowerCase()];
    if (!tipo) { errores.push(`media.csv línea ${r.__line}: tipo «${r.tipo}» no válido (imagen|video|audio|enlace)`); continue; }
    if (!r.archivo_o_url) { errores.push(`media.csv línea ${r.__line}: falta archivo_o_url`); continue; }
    let section = APARTADO_MAP[(r.apartado || "").toLowerCase()];
    if (section === undefined) { errores.push(`media.csv línea ${r.__line}: apartado «${r.apartado}» no válido (ficha|descripcion|riesgos|causas|accion|deteccion|prevencion|regulacion|vacío=galería)`); continue; }
    const orden = parseInt(r.orden, 10) || 0;
    if (tipo === "EMBED" || r.archivo_o_url.startsWith("/")) {
      // Enlaces externos y rutas ya integradas en el sistema (ida y vuelta de --plantillas): no se copia nada
      mediaOps.push({ code, tipo, url: r.archivo_o_url, title: r.titulo || "Recurso", caption: r.texto || null, section, orden, file: null });
    } else {
      const src = path.join(MATERIAL_DIR, "recursos", r.archivo_o_url);
      if (!fs.existsSync(src)) { errores.push(`media.csv línea ${r.__line}: el archivo «${r.archivo_o_url}» no está en material/recursos/`); continue; }
      const ext = path.extname(r.archivo_o_url).toLowerCase();
      const destName = `${code}-${slugify(r.titulo || path.basename(r.archivo_o_url, ext))}${ext}`;
      mediaOps.push({ code, tipo, url: `/uploads/${destName}`, title: r.titulo || path.basename(r.archivo_o_url, ext), caption: r.texto || null, section, orden, file: { src, dest: path.join(uploadsDir, destName) } });
    }
  }

  // ---- 6) Preparar copia de modelos a public/models
  const modelsDir = path.resolve("public/models");
  const modeloOps = [];
  for (const f of glbFiles) {
    const code = f.slice(0, -4).toUpperCase();
    if (!codesValidos.has(code)) { errores.push(`modelos/: «${f}» no corresponde a ningún código (usa D001.glb … D040.glb)`); continue; }
    modeloOps.push({ code, src: path.join(modelosDir, f), dest: path.join(modelsDir, `${code}.glb`), url: `/models/${code}.glb`, size: fs.statSync(path.join(modelosDir, f)).size });
  }

  // ---- 7) Informe / PLAN
  const plan = () => {
    console.log(`\nBase de datos:  ${dbUrl}`);
    console.log(`Material:       ${MATERIAL_DIR}\n`);
    console.log(`PLAN${args.ejecutar ? " (modo --ejecutar)" : " (revisión; añade --ejecutar para aplicar)"}`);
    console.log(`  Textos a actualizar:   ${textosOps.length} fila(s)`);
    console.log(`  Preguntas a guardar:   ${preguntasOps.length} fila(s)`);
    console.log(`  Recursos a registrar:  ${mediaOps.length} fila(s)${mediaOps.length ? ` (${mediaOps.filter(m => m.file).length} fichero(s) se copiarán a public/uploads)` : ""}`);
    console.log(`  Modelos GLB a cargar:  ${modeloOps.length} fichero(s)${modeloOps.length ? ` — ${(modeloOps.reduce((n, m) => n + m.size, 0) / 1e6).toFixed(1)} MB en total` : ""}`);
    if (errores.length) {
      console.log(`\nERRORES (${errores.length}) — corrígelos en los CSV antes de ejecutar:`);
      for (const e of errores) console.log("  ✗ " + e);
    }
    console.log("");
  };
  plan();

  if (!args.ejecutar) {
    if (errores.length) process.exit(1);
    console.log("Revisión completada sin errores. Repite el comando con --ejecutar para aplicar los cambios.\n");
    await prisma.$disconnect();
    return;
  }
  if (errores.length) { console.error("Hay errores en el material; no se ha aplicado nada. Corrígelos y vuelve a lanzar.\n"); process.exit(1); }

  // ---- 8) Aplicar
  let nTextos = 0, nPreguntas = 0, nMedia = 0, nModelos = 0;
  for (const op of textosOps) {
    await prisma.defect.update({ where: { code: op.code }, data: op.patch });
    nTextos++;
  }
  for (const op of preguntasOps) {
    await prisma.question.upsert({
      where: { defectId_variant: { defectId: (await prisma.defect.findUnique({ where: { code: op.code } })).id, variant: op.variant } },
      update: op.data,
      create: { defectId: (await prisma.defect.findUnique({ where: { code: op.code } })).id, variant: op.variant, ...op.data },
    });
    nPreguntas++;
  }
  // media.csv = fuente de verdad de los defectos que aparecen en él
  const codesEnMedia = [...new Set(mediaOps.map(m => m.code))];
  for (const code of codesEnMedia) {
    const d = await prisma.defect.findUnique({ where: { code } });
    await prisma.defectMedia.deleteMany({ where: { defectId: d.id } });
  }
  for (const op of mediaOps) {
    if (op.file) { fs.mkdirSync(uploadsDir, { recursive: true }); fs.copyFileSync(op.file.src, op.file.dest); }
    const d = await prisma.defect.findUnique({ where: { code: op.code } });
    await prisma.defectMedia.create({ data: { defectId: d.id, type: op.tipo, url: op.url, title: op.title, caption: op.caption, section: op.section, orderIndex: op.orden } });
    nMedia++;
  }
  for (const op of modeloOps) {
    fs.mkdirSync(modelsDir, { recursive: true });
    fs.copyFileSync(op.src, op.dest);
    await prisma.defect.update({ where: { code: op.code }, data: { modelPath: op.url } });
    nModelos++;
  }

  console.log(`APLICADO ✔  textos: ${nTextos} · preguntas: ${nPreguntas} · recursos: ${nMedia} · modelos GLB: ${nModelos}`);
  console.log("Los cambios son visibles al momento en la aplicación. Si el servidor estaba apagado, arráncalo con normalidad.");
  await prisma.$disconnect();
}

try {
  if (args.plantillas) { const p = await getPrisma(); await generarPlantillas(p); }
  else await main();
} catch (e) {
  console.error("\nERROR inesperado:", e.message, "\n");
  process.exit(2);
}
