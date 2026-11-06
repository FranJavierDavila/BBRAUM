import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** GET /api/eval/defect/[code] — ficha completa del defecto para el repaso de Teoría. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { code } = await params;
  const normalized = code.trim().toUpperCase();

  const defect = await db.defect.findUnique({
    where: { code: normalized },
    include: {
      media: {
        orderBy: [{ orderIndex: "asc" as const }, { createdAt: "asc" as const }],
        select: { id: true, type: true, url: true, title: true, caption: true, section: true },
      },
    },
  });
  if (!defect) {
    return NextResponse.json({ error: "Código de defecto no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    defect: {
      code: defect.code,
      name: defect.name,
      displayName: defect.displayName,
      category: defect.category,
      description: defect.description,
      detail: defect.detail,
      severity: defect.severity,
      modelPath: defect.modelPath,
      causes: defect.causes,
      risks: defect.risks,
      detection: defect.detection,
      action: defect.action,
      prevention: defect.prevention,
      regulation: defect.regulation,
      media: defect.media,
    },
  });
}
