import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCurrentAttempt } from "@/lib/eval-server";

/** POST /api/eval/prueba/answer — responde una pregunta de la Prueba de Evaluación.
 *  Body: { finalAnswerId: string, selected: "A"|"B"|"C" } */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const finalAnswerId = String((body as { finalAnswerId?: string }).finalAnswerId || "");
  const selected = String((body as { selected?: string }).selected || "").toUpperCase();

  if (!["A", "B", "C"].includes(selected)) {
    return NextResponse.json({ error: "Opción seleccionada no válida" }, { status: 400 });
  }

  const attempt = await getCurrentAttempt(session.userId);
  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "No hay una Prueba de Evaluación activa" }, { status: 400 });
  }

  const row = await db.finalAnswer.findUnique({
    where: { id: finalAnswerId },
    include: { question: true },
  });
  if (!row || row.attemptId !== attempt.id) {
    return NextResponse.json({ error: "Pregunta de la prueba no encontrada" }, { status: 404 });
  }
  if (row.selected !== null) {
    return NextResponse.json({ error: "Esta pregunta ya ha sido respondida" }, { status: 409 });
  }

  const isCorrect = selected === row.question.correct;
  await db.finalAnswer.update({
    where: { id: row.id },
    data: { selected, isCorrect, answeredAt: new Date() },
  });

  const total = await db.finalAnswer.count({ where: { attemptId: attempt.id } });
  const answered = await db.finalAnswer.count({
    where: { attemptId: attempt.id, selected: { not: null } },
  });

  return NextResponse.json({
    isCorrect,
    correctOption: row.question.correct,
    explanation: row.question.explanation,
    progress: { answered, total },
  });
}
