import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { takeUpload } from "@/lib/chunked-uploads";
import { UPLOADS_DIR } from "@/lib/uploads-dir";
import { db } from "@/lib/db";
import AdmZip from "adm-zip";
import { readdir, readFile, writeFile, rm, mkdir } from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";
import os from "os";

/**
 * Copia de seguridad íntegra (v1.4.8): permite editar todo en una instalación
 * (por ejemplo en local), descargar una copia completa y restaurarla en otra
 * (el acceso online), o protegerse antes de una actualización.
 *
 *  - GET  → ZIP con la base de datos (bbraun.db), TODOS los ficheros subidos
 *           (carpeta de datos: material de apoyo, modelos GLB propios…) bajo
 *           «ficheros/» y los modelos incluidos con la aplicación bajo
 *           «modelos-base/».
 *  - POST → restaura ese ZIP: sustituye los ficheros de la carpeta de datos y
 *           copia todas las tablas de la BD subida dentro de la BD en uso (con
 *           ATTACH, sin tocar el esquema). Solo administrador.
 */

/** Ruta del fichero SQLite a partir de DATABASE_URL (file:/ruta/bbraun.db) */
function dbPath(): string {
  const url = process.env.DATABASE_URL || "";
  return url.startsWith("file:") ? url.slice(5) : url.replace(/^file:/, "");
}

/** Recorre un árbol de directorios y devuelve las rutas de los ficheros. */
async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(abs)));
    else if (e.isFile()) out.push(abs);
  }
  return out;
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede descargar la copia" }, { status: 403 });
  }

  try {
    // Asegura que todo el contenido WAL está en el fichero principal antes de leerlo
    await db.$queryRawUnsafe("PRAGMA wal_checkpoint(FULL)");

    const zip = new AdmZip();
    const dbFile = dbPath();
    if (dbFile && existsSync(dbFile)) {
      zip.addFile("bbraun.db", await readFile(dbFile));
    }

    const ficheros = await walk(UPLOADS_DIR);
    for (const abs of ficheros) {
      const rel = path.relative(UPLOADS_DIR, abs).split(path.sep).join("/");
      zip.addFile(`ficheros/${rel}`, await readFile(abs));
    }

    // NOTA: los modelos incluidos con la aplicación (public/models) NO se
    // exportan: forman parte del paquete y están presentes en cualquier
    // instalación; incluirlos multiplicaba el tamaño de la copia (~30 MB) y
    // las respuestas grandes se cortan al atravesar el servidor intermedio.
    // El POST sigue aceptando «modelos-base/» de copias antiguas.

    zip.addFile(
      "LEEME-copia.txt",
      Buffer.from(
        "Copia de seguridad íntegra de Evaluación de Inspección Visual (BBRAUN).\n" +
          "- bbraun.db: base de datos completa (defectos, textos, preguntas, registros, usuarios).\n" +
          "- ficheros/: material subido (imágenes, vídeos, audio y modelos GLB propios).\n\n" +
          "Restauración: Panel de administración → Copia → «Restaurar copia».\n",
        "utf8",
      ),
    );

    const buf = zip.toBuffer();
    const fecha = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="bbraun-copia-${fecha}.zip"`,
        "Content-Length": String(buf.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("backup export:", err);
    return NextResponse.json({ error: "No se pudo generar la copia de seguridad" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede restaurar la copia" }, { status: 403 });
  }

  let buf: Buffer | null = null;
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Solicitud inválida: se esperaba el ZIP de copia" }, { status: 400 });
  }
  // El fichero llega directo (multipart) o por trozos vía /api/admin/chunks (uploadToken)
  const token = String(form.get("uploadToken") || "").trim();
  if (token) {
    const up = await takeUpload(token);
    if ("error" in up) return NextResponse.json({ error: up.error }, { status: 400 });
    buf = up.buf;
  } else {
    const file = form.get("file");
    if (file instanceof File && file.size > 0) buf = Buffer.from(await file.arrayBuffer());
  }
  if (!buf) {
    return NextResponse.json({ error: "Falta el archivo ZIP de la copia" }, { status: 400 });
  }

  let zip: AdmZip;
  try {
    zip = new AdmZip(buf);
  } catch {
    return NextResponse.json({ error: "El archivo no es un ZIP válido" }, { status: 400 });
  }
  const entries = zip.getEntries();
  const dbEntry = entries.find((e) => e.entryName === "bbraun.db" || e.entryName.endsWith("/bbraun.db"));
  if (!dbEntry) {
    return NextResponse.json({ error: "El ZIP no contiene bbraun.db: no parece una copia de esta aplicación" }, { status: 400 });
  }

  try {
    // 1) Ficheros: sustituye por completo la carpeta de datos con «ficheros/»
    const ficheros = entries.filter((e) => !e.isDirectory && e.entryName.startsWith("ficheros/"));
    await rm(UPLOADS_DIR, { recursive: true, force: true });
    await mkdir(UPLOADS_DIR, { recursive: true });
    let escritos = 0;
    for (const e of ficheros) {
      const rel = e.entryName.slice("ficheros/".length);
      if (!rel || rel.includes("..") || rel.includes("\0")) continue;
      const abs = path.resolve(UPLOADS_DIR, rel);
      if (!abs.startsWith(path.resolve(UPLOADS_DIR) + path.sep)) continue; // anti path-traversal
      await mkdir(path.dirname(abs), { recursive: true });
      await writeFile(abs, e.getData());
      escritos++;
    }

    // 2) Modelos base incluidos en la copia (si el destino no los tiene)
    let modelos = 0;
    const baseModels = path.join(process.cwd(), "public", "models");
    for (const e of entries.filter((x) => !x.isDirectory && x.entryName.startsWith("modelos-base/"))) {
      const rel = e.entryName.slice("modelos-base/".length);
      if (!rel || rel.includes("..")) continue;
      const abs = path.join(baseModels, rel);
      if (existsSync(abs) && statSync(abs).isFile()) continue; // no sobrescribir los del build
      await mkdir(path.dirname(abs), { recursive: true });
      await writeFile(abs, e.getData());
      modelos++;
    }

    // 3) Base de datos: vuelca las tablas de la copia dentro de la BD en uso
    //    (ATTACH + copia tabla a tabla; el esquema de la instalación en uso manda)
    const tmp = path.join(os.tmpdir(), `bbraun-restore-${Date.now()}.db`);
    await writeFile(tmp, dbEntry.getData());
    const safeTmp = tmp.replace(/'/g, "''");
    await db.$queryRawUnsafe(`ATTACH DATABASE '${safeTmp}' AS copia`);
    const tablas = (await db.$queryRawUnsafe(
      "SELECT name FROM copia.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )) as Array<{ name: string }>;

    // Orden topológico por claves foráneas: los padres antes que los hijos para
    // INSERTAR (y al revés para VACIAR), respetando las restricciones FK.
    const nombres = tablas.map((t) => t.name);
    const padres: Record<string, string[]> = {};
    for (const n of nombres) {
      const fks = (await db.$queryRawUnsafe(`PRAGMA foreign_key_list("${n.replace(/"/g, '""')}")`)) as Array<{ table: string }>;
      padres[n] = fks.map((f) => f.table).filter((p) => nombres.includes(p));
    }
    const orden: string[] = [];
    const pendiente = new Set(nombres);
    while (pendiente.size > 0) {
      const listos = [...pendiente].filter((t) => padres[t].every((p) => !pendiente.has(p)));
      if (listos.length === 0) break; // ciclo: se continúa en el orden dado
      for (const t of listos) { orden.push(t); pendiente.delete(t); }
    }
    for (const t of pendiente) orden.push(t);

    let copiadas = 0;
    const fallos: string[] = [];
    for (const nombre of [...orden].reverse()) {
      try {
        await db.$queryRawUnsafe(`DELETE FROM main."${nombre.replace(/"/g, '""')}"`);
      } catch (e) {
        console.error("restore vaciado:", nombre, e);
      }
    }
    for (const nombre of orden) {
      const q = `"${nombre.replace(/"/g, '""')}"`;
      try {
        await db.$queryRawUnsafe(`INSERT INTO main.${q} SELECT * FROM copia.${q}`);
        copiadas++;
      } catch (e) {
        fallos.push(nombre);
        console.error("restore tabla:", nombre, e);
      }
    }
    await db.$queryRawUnsafe("DETACH DATABASE copia");
    await rm(tmp, { force: true });

    return NextResponse.json({
      ok: true,
      tablas: copiadas,
      fallos,
      ficheros: escritos,
      modelosBase: modelos,
      aviso: fallos.length
        ? `Se restauraron ${copiadas} tablas; ${fallos.length} no coinciden con el esquema actual (${fallos.join(", ")}).`
        : undefined,
    });
  } catch (err) {
    console.error("backup restore:", err);
    return NextResponse.json({ error: "No se pudo restaurar la copia de seguridad" }, { status: 500 });
  }
}
