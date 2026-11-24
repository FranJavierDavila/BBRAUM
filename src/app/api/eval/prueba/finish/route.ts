import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCurrentAttempt } from "@/lib/eval-server";
import { computeScore } from "@/lib/eval-utils";

/** POST /api/eval/prueba/finish — cierra la Prueba de Evaluación y calcula la puntuación 0-10. */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const attempt = await getCurrentAttempt(session.userId);
  if (!attempt) return NextResponse.json({ error: "No hay ninguna prueba iniciada" }, { status: 400 });

  const rows = await db.finalAnswer.findMany({ where: { attemptId: attempt.id } });
  if (rows.length === 0) {
    return NextResponse.json({ error: "La prueba no tiene preguntas generadas" }, { status: 400 });
  }

  const unanswered = rows.filter((r) => r.selected === null);
  if (unanswered.length > 0) {
    return NextResponse.json(
      { error: `Quedan ${unanswered.length} preguntas sin responder de la prueba` },
      { status: 400 }
    );
  }

  const correct = rows.filter((r) => r.isCorrect).length;
  const total = rows.length;
  const score = computeScore(correct, total);

  await db.attempt.update({
    where: { id: attempt.id },
    data: { status: "COMPLETED", finishedAt: new Date(), finalScore: score },
  });

  // Detalle por pregunta para el resumen final
  const detail = await db.finalAnswer.findMany({
    where: { attemptId: attempt.id },
    orderBy: { orderIndex: "asc" },
    include: {
      defect: { select: { code: true, name: true } },
      question: { select: { correct: true, explanation: true } },
    },
  });

  return NextResponse.json({
    score,
    correct,
    total,
    detail: detail.map((d) => ({
      orderIndex: d.orderIndex,
      defectCode: d.defect.code,
      defectName: d.defect.name,
      isCorrect: d.isCorrect,
      selected: d.selected,
      correctOption: d.question.correct,
      explanation: d.question.explanation,
    })),
  });
}
