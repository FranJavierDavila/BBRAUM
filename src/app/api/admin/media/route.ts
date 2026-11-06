import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

/** Límites de subida configurados para el despliegue interno */
const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif"];
const VIDEO_EXT = ["mp4", "webm", "ogg", "mov", "m4v"];
const MAX_IMAGE = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO = 64 * 1024 * 1024; // 64 MB
const MAX_EMBED_URL = 2048;

/** GET /api/admin/media?code=D001 — material de apoyo de un defecto (ordenado). */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede consultar el material" }, { status: 403 });
  }
  const code = (req.nextUrl.searchParams.get("code") || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Falta el código del defecto" }, { status: 400 });

  const defect = await db.defect.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      name: true,
      media: {
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
        select: { id: true, type: true, url: true, title: true, caption: true, createdAt: true },
      },
    },
  });
  if (!defect) return NextResponse.json({ error: "Código de defecto no encontrado" }, { status: 404 });

  return NextResponse.json({
    defect: { code: defect.code, name: defect.name },
    media: defect.media,
  });
}

/** POST /api/admin/media — añade material de apoyo (archivo IMAGE/VIDEO o enlace EMBED). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede añadir material" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida: se esperaba multipart/form-data" }, { status: 400 });
  }

  const code = String(form.get("code") || "").trim().toUpperCase();
  const type = String(form.get("type") || "").trim().toUpperCase();
  const title = String(form.get("title") || "").trim();
  const caption = String(form.get("caption") || "").trim() || null;

  if (!code) return NextResponse.json({ error: "Falta el código del defecto" }, { status: 400 });
  if (!["IMAGE", "VIDEO", "EMBED"].includes(type)) {
    return NextResponse.json({ error: "Tipo de material no válido (IMAGE, VIDEO o EMBED)" }, { status: 400 });
  }
  if (!title) return NextResponse.json({ error: "El material necesita un título" }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: "El título es demasiado largo (máx. 200)" }, { status: 400 });

  const defect = await db.defect.findUnique({ where: { code }, select: { id: true } });
  if (!defect) return NextResponse.json({ error: "Código de defecto no encontrado" }, { status: 404 });

  let url = "";

  if (type === "EMBED") {
    const raw = String(form.get("url") || "").trim();
    if (!raw) return NextResponse.json({ error: "Falta la URL del contenido incrustado" }, { status: 400 });
    if (raw.length > MAX_EMBED_URL) {
      return NextResponse.json({ error: "La URL es demasiado larga" }, { status: 400 });
    }
    if (!/^https?:\/\//i.test(raw)) {
      return NextResponse.json({ error: "La URL debe comenzar por http:// o https://" }, { status: 400 });
    }
    url = raw;
  } else {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Falta el archivo a subir" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const isImage = type === "IMAGE" && IMAGE_EXT.includes(ext);
    const isVideo = type === "VIDEO" && VIDEO_EXT.includes(ext);
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: `Formato no permitido para ${type}: extensiones aceptadas ${type === "IMAGE" ? IMAGE_EXT.join(", ") : VIDEO_EXT.join(", ")}` },
        { status: 400 }
      );
    }
    const max = isImage ? MAX_IMAGE : MAX_VIDEO;
    if (file.size > max) {
      return NextResponse.json(
        { error: `El archivo excede el límite de ${Math.round(max / (1024 * 1024))} MB` },
        { status: 400 }
      );
    }

    const dir = path.join(process.cwd(), "public", "uploads", "defects", code);
    await mkdir(dir, { recursive: true });
    const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    url = `/uploads/defects/${code}/${name}`;
  }

  const last = await db.defectMedia.findFirst({
    where: { defectId: defect.id },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  const media = await db.defectMedia.create({
    data: {
      defectId: defect.id,
      type,
      url,
      title,
      caption,
      orderIndex: (last?.orderIndex ?? 0) + 1,
    },
    select: { id: true, type: true, url: true, title: true, caption: true },
  });

  return NextResponse.json({ ok: true, media });
}
