import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** GET /api/eval/defects — listado del catálogo (código + nombres) para la tabla de Teoría. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const defects = await db.defect.findMany({
      orderBy: [{ order: "asc" as const }, { code: "asc" as const }],
      select: { code: true, name: true, displayName: true, severity: true },
    });
    return NextResponse.json({ defects });
  } catch (error) {
    console.error("GET /api/eval/defects", error);
    return NextResponse.json({ error: "No se pudo cargar el catálogo" }, { status: 500 });
  }
}
