import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isUploadId, TMP_ROOT } from "@/lib/chunked-uploads";
import { appendFile, mkdir, readFile, readdir, rm, stat, writeFile } from "fs/promises";
import path from "path";

/**
 * POST /api/admin/chunks — almacén temporal para subidas por trozos.
 *
 * El cliente envía cada trozo con uploadId + index + filename + file (binario,
 * pequeño: compatible con proxies que limitan el tamaño de petición). Cuando
 * termina, envía done=1 y obtiene un token que entrega al POST final
 * (/api/admin/models o /api/admin/media), donde se aplica la validación
 * correspondiente. Los temporales se borran al consumirlos o a las 2 horas.
 */

const MAX_TOTAL = 64 * 1024 * 1024; // el mayor límite admitido (vídeo 64 MB)
const MAX_CHUNK = 2 * 1024 * 1024; // seguridad por petición individual
const TMP_MS = 2 * 60 * 60 * 1000;

async function cleanupOld(): Promise<void> {
  try {
    const now = Date.now();
    for (const d of await readdir(TMP_ROOT)) {
      const st = await stat(path.join(TMP_ROOT, d));
      if (now - st.mtimeMs > TMP_MS) await rm(path.join(TMP_ROOT, d), { recursive: true, force: true });
    }
  } catch {
    /* el almacén aún no existe */
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede subir ficheros" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida: se esperaba multipart/form-data" }, { status: 400 });
  }

  const uploadId = String(form.get("uploadId") || "").trim();
  if (!isUploadId(uploadId)) {
    return NextResponse.json({ error: "Identificador de subida no válido" }, { status: 400 });
  }
  const dir = path.join(TMP_ROOT, uploadId);
  const blob = path.join(dir, "blob");
  const metaFile = path.join(dir, "meta.json");

  // — Finalización: devuelve el token para el POST final —
  if (String(form.get("done") || "") !== "") {
    try {
      const meta = JSON.parse(await readFile(metaFile, "utf8")) as { filename?: string; received?: number };
      const size = (await stat(blob)).size;
      if (!meta.filename || !size) {
        return NextResponse.json({ error: "Subida incompleta: no se han recibido trozos" }, { status: 400 });
      }
      return NextResponse.json({ ok: true, token: uploadId, size, filename: meta.filename });
    } catch {
      return NextResponse.json({ error: "Subida incompleta: no se han recibido trozos" }, { status: 400 });
    }
  }

  // — Trozo individual —
  const index = parseInt(String(form.get("index") || ""), 10);
  if (!Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "Índice de trozo no válido" }, { status: 400 });
  }
  const filename = String(form.get("filename") || "").trim();
  if (!filename) {
    return NextResponse.json({ error: "Falta el nombre del fichero" }, { status: 400 });
  }
  const chunk = form.get("file");
  if (!(chunk instanceof File) || chunk.size === 0) {
    return NextResponse.json({ error: "Falta el contenido del trozo" }, { status: 400 });
  }
  if (chunk.size > MAX_CHUNK) {
    return NextResponse.json({ error: "Trozo demasiado grande; reduce el tamaño de trozo" }, { status: 400 });
  }

  await mkdir(dir, { recursive: true });

  // Orden estricto: cada trozo debe llegar justo después del anterior
  // (evita duplicados o huecos si algo reintenta por su cuenta)
  let received = 0;
  try {
    const meta = JSON.parse(await readFile(metaFile, "utf8")) as { received?: number };
    received = meta.received ?? 0;
  } catch {
    received = 0;
  }
  if (index !== received) {
    return NextResponse.json(
      { error: `Trozo fuera de orden: se esperaba el ${received}` },
      { status: 409 }
    );
  }

  const data = Buffer.from(await chunk.arrayBuffer());
  if (received === 0) {
    await writeFile(blob, data);
    await writeFile(metaFile, JSON.stringify({ filename, received: 1 }));
  } else {
    await appendFile(blob, data);
    await writeFile(metaFile, JSON.stringify({ filename, received: received + 1 }));
  }
  const size = (await stat(blob)).size;
  if (size > MAX_TOTAL) {
    await rm(dir, { recursive: true, force: true });
    return NextResponse.json({ error: "El fichero acumulado excede el límite de 64 MB" }, { status: 400 });
  }

  if (index % 8 === 0) await cleanupOld();
  return NextResponse.json({ ok: true, received: received + 1, size });
}
