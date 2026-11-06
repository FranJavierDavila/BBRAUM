import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getConfig } from "@/lib/eval-server";

/** GET /api/admin/config — cualquier usuario autenticado (para mostrar parámetros). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const config = await getConfig();
  return NextResponse.json({
    numFinalQuestions: config.numFinalQuestions,
    allowTheoryDuringTest: config.allowTheoryDuringTest,
    qrEvaluation: config.qrEvaluation,
    qrBaseUrl: config.qrBaseUrl ?? "",
    updatedAt: config.updatedAt,
  });
}

/** PUT /api/admin/config — solo administrador.
 *  Body: { numFinalQuestions?, allowTheoryDuringTest?, qrEvaluation?, qrBaseUrl? }
 *  - numFinalQuestions: preguntas de cada Prueba de Evaluación (1..40), 1 por código sin repetir.
 *  - allowTheoryDuringTest: si es false, durante una prueba en curso no se puede salir a Teoría.
 *  - qrEvaluation: si es false, las fichas abiertas desde un QR no muestran autoevaluación.
 *  - qrBaseUrl: base URL usada al generar los QR (vacío = origen de la petición). */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede modificar la configuración" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const b = body as {
    numFinalQuestions?: number;
    allowTheoryDuringTest?: boolean;
    qrEvaluation?: boolean;
    qrBaseUrl?: string;
  };

  const config = await getConfig();
  const data: {
    numFinalQuestions?: number;
    allowTheoryDuringTest?: boolean;
    qrEvaluation?: boolean;
    qrBaseUrl?: string | null;
  } = {};

  if (b.numFinalQuestions !== undefined) {
    const n = Number(b.numFinalQuestions);
    if (!Number.isInteger(n) || n < 1 || n > 40) {
      return NextResponse.json(
        { error: "El número de preguntas debe ser un entero entre 1 y 40" },
        { status: 400 }
      );
    }
    data.numFinalQuestions = n;
  }

  if (b.allowTheoryDuringTest !== undefined) {
    data.allowTheoryDuringTest = Boolean(b.allowTheoryDuringTest);
  }

  if (b.qrEvaluation !== undefined) {
    data.qrEvaluation = Boolean(b.qrEvaluation);
  }

  if (b.qrBaseUrl !== undefined) {
    const raw = String(b.qrBaseUrl ?? "").trim();
    if (raw === "") {
      data.qrBaseUrl = null; // vacío → se deduce del origen de cada petición
    } else if (!/^https?:\/\/[^\s]+$/i.test(raw)) {
      return NextResponse.json(
        { error: "La URL base debe comenzar por http:// o https://" },
        { status: 400 }
      );
    } else {
      data.qrBaseUrl = raw.replace(/\/+$/, ""); // sin barra final
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No hay cambios que guardar" }, { status: 400 });
  }

  const updated = await db.evalConfig.update({ where: { id: config.id }, data });

  return NextResponse.json({
    numFinalQuestions: updated.numFinalQuestions,
    allowTheoryDuringTest: updated.allowTheoryDuringTest,
    qrEvaluation: updated.qrEvaluation,
    qrBaseUrl: updated.qrBaseUrl ?? "",
    ok: true,
  });
}
