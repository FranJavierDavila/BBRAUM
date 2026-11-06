import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { existsSync } from "fs";
import path from "path";

const CONTENT_FIELDS = [
  "description",
  "detail",
  "causes",
  "risks",
  "detection",
  "action",
  "prevention",
  "regulation",
] as const;

/** GET /api/admin/defect-content — lista resumida de todos los defectos. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede acceder a los contenidos" }, { status: 403 });
  }

  const defects = await db.defect.findMany({
    orderBy: { order: "asc" },
    select: {
      code: true,
      name: true,
      category: true,
      severity: true,
      modelPath: true,
      description: true,
      detail: true,
      causes: true,
      risks: true,
      detection: true,
      action: true,
      prevention: true,
      regulation: true,
      _count: { select: { media: true } },
    },
  });

  return NextResponse.json({
    defects: defects.map((d) => ({
      code: d.code,
      name: d.name,
      category: d.category,
      severity: d.severity,
      modelPath: d.modelPath,
      description: d.description,
      detail: d.detail,
      causes: d.causes,
      risks: d.risks,
      detection: d.detection,
      action: d.action,
      prevention: d.prevention,
      regulation: d.regulation,
      hasContent: Boolean(d.causes || d.risks || d.detection || d.action || d.prevention || d.regulation),
      mediaCount: d._count.media,
    })),
  });
}

/** PUT /api/admin/defect-content — actualiza la plantilla teórica de un defecto. */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede editar los contenidos" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) {
    return NextResponse.json({ error: "Falta el código del defecto" }, { status: 400 });
  }

  const defect = await db.defect.findUnique({ where: { code } });
  if (!defect) {
    return NextResponse.json({ error: "Código de defecto no encontrado" }, { status: 404 });
  }

  // Campos de texto: string no vacío o null
  const data: Record<string, string | null> = {};
  for (const field of CONTENT_FIELDS) {
    const value = body[field];
    if (value === undefined) continue; // no enviado → no se toca
    if (value === null || value === "") {
      data[field] = field === "description" || field === "detail" ? defect[field] : null;
      continue;
    }
    if (typeof value !== "string") {
      return NextResponse.json({ error: `El campo ${field} debe ser texto` }, { status: 400 });
    }
    const trimmed = value.trim();
    if (field === "description" || field === "detail") {
      if (trimmed.length < 5) {
        return NextResponse.json({ error: `El campo ${field} no puede quedar vacío` }, { status: 400 });
      }
    }
    if (trimmed.length > 20000) {
      return NextResponse.json({ error: `El campo ${field} excede la longitud máxima (20000)` }, { status: 400 });
    }
    data[field] = trimmed;
  }

  // Modelo 3D: debe apuntar a un GLB existente en /public/models
  if (typeof body.modelPath === "string" && body.modelPath.trim()) {
    const modelPath = body.modelPath.trim();
    if (!modelPath.startsWith("/models/") || !modelPath.toLowerCase().endsWith(".glb")) {
      return NextResponse.json({ error: "La ruta del modelo debe ser un .glb dentro de /models/" }, { status: 400 });
    }
    const abs = path.join(process.cwd(), "public", modelPath);
    if (!existsSync(abs)) {
      return NextResponse.json({ error: "El archivo de modelo indicado no existe en el servidor" }, { status: 400 });
    }
    data.modelPath = modelPath;
  }

  const updated = await db.defect.update({ where: { code }, data });

  return NextResponse.json({
    ok: true,
    defect: {
      code: updated.code,
      modelPath: updated.modelPath,
      causes: updated.causes,
      risks: updated.risks,
      detection: updated.detection,
      action: updated.action,
      prevention: updated.prevention,
      regulation: updated.regulation,
    },
  });
}
