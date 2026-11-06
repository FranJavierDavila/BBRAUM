import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getConfig, getCurrentAttempt } from "@/lib/eval-server";

/** GET /api/eval/state — configuración e intento de Prueba de Evaluación en curso. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const config = await getConfig();
  const attempt = await getCurrentAttempt(session.userId);

  const base = {
    config: {
      numFinalQuestions: config.numFinalQuestions,
      allowTheoryDuringTest: config.allowTheoryDuringTest,
      qrEvaluation: config.qrEvaluation,
    },
  };

  if (!attempt) {
    return NextResponse.json({ ...base, attempt: null });
  }

  const [total, answered] = await Promise.all([
    db.finalAnswer.count({ where: { attemptId: attempt.id } }),
    db.finalAnswer.count({ where: { attemptId: attempt.id, selected: { not: null } } }),
  ]);

  return NextResponse.json({
    ...base,
    attempt: {
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
      finishedAt: attempt.finishedAt,
      finalScore: attempt.finalScore,
      total,
      answered,
    },
  });
}
