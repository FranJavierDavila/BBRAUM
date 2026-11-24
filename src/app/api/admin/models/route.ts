import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { takeUpload } from "@/lib/chunked-uploads";
import { readdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_GLB = 32 * 1024 * 1024; // 32 MB

/** GET /api/admin/models — lista de modelos GLB disponibles en /public/models. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede consultar los modelos" }, { status: 403 });
  }

  const dir = path.join(process.cwd(), "public", "models");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith(".glb"));
  } catch {
    files = [];
  }
  files.sort((a, b) => a.localeCompare(b));

  return NextResponse.json({
    models: files.map((f) => ({ path: `/models/${f}`, name: f })),
  });
}

/** POST /api/admin/models — sube un nuevo modelo .glb al servidor. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede subir modelos" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida: se esperaba multipart/form-data" }, { status: 400 });
  }

  // El fichero llega directo (subida local) o por trozos vía /api/admin/chunks (uploadToken)
  const token = String(form.get("uploadToken") || "").trim();
  let fileName = "";
  let fileSize = 0;
  let buf: Buffer;
  if (token) {
    const up = await takeUpload(token);
    if ("error" in up) {
      return NextResponse.json({ error: up.error }, { status: 400 });
    }
    fileName = up.filename;
    fileSize = up.size;
    buf = up.buf;
  } else {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Falta el archivo .glb" }, { status: 400 });
    }
    fileName = file.name;
    fileSize = file.size;
    buf = Buffer.from(await file.arrayBuffer());
  }
  if (!fileName.toLowerCase().endsWith(".glb")) {
    return NextResponse.json({ error: "Solo se aceptan archivos .glb" }, { status: 400 });
  }
  if (fileSize > MAX_GLB) {
    return NextResponse.json({ error: "El modelo excede el límite de 32 MB" }, { status: 400 });
  }

  // Validar cabecera glTF (magic "glTF")
  if (buf.length < 4 || buf.readUInt32LE(0) !== 0x46546c67) {
    return NextResponse.json({ error: "El archivo no es un GLB válido (cabecera glTF ausente)" }, { status: 400 });
  }

  const base = fileName.slice(0, -4).replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 60) || "modelo";
  const name = `${base}-${crypto.randomBytes(3).toString("hex")}.glb`;
  await writeFile(path.join(process.cwd(), "public", "models", name), buf);

  return NextResponse.json({ ok: true, model: { path: `/models/${name}`, name } });
}
