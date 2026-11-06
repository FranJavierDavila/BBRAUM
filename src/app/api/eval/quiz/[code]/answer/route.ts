import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** POST /api/eval/quiz/[code]/answer — corrige una autoevaluación de Teoría (sin guardar nada).
 *  Body: { questionId: string, selected: "A"|"B"|"C" } */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const questionId = String((body as { questionId?: string }).questionId || "");
  const selected = String((body as { selected?: string }).selected || "").toUpperCase();

  if (!["A", "B", "C"].includes(selected)) {
    return NextResponse.json({ error: "Opción seleccionada no válida" }, { status: 400 });
  }

  const { code } = await params;
  const normalized = code.trim().toUpperCase();
  const defect = await db.defect.findUnique({ where: { code: normalized } });
  if (!defect) {
    return NextResponse.json({ error: "Código de defecto no encontrado" }, { status: 404 });
  }

  const question = await db.question.findUnique({ where: { id: questionId } });
  if (!question || question.defectId !== defect.id) {
    return NextResponse.json({ error: "Pregunta no encontrada para este defecto" }, { status: 404 });
  }

  return NextResponse.json({
    isCorrect: selected === question.correct,
    correctOption: question.correct,
    explanation: question.explanation,
  });
}
