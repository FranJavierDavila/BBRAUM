import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  getConfig, getCurrentAttempt, nextAttemptNumber,
  generatePruebaQuestions, getPruebaQuestions,
} from "@/lib/eval-server";

/** POST /api/eval/prueba/start — comienza (o retoma) una Prueba de Evaluación.
 *  Genera tantas preguntas como indique el administrador (numFinalQuestions),
 *  escogidas al azar sobre los 40 defectos, sin repetir código (1 pregunta por código). */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const config = await getConfig();

  let attempt = await getCurrentAttempt(session.userId);
  if (attempt && attempt.status !== "IN_PROGRESS") {
    attempt = null; // COMPLETED / ABANDONED / histórico → nueva prueba
  }

  if (!attempt) {
    attempt = await db.attempt.create({
      data: {
        userId: session.userId,
        attemptNumber: await nextAttemptNumber(session.userId),
        status: "IN_PROGRESS",
      },
    });
  }

  // Genera la batería si el intento activo todavía no tiene preguntas
  // (intento nuevo o intento heredado sin batería asignada)
  const existing = await db.finalAnswer.count({ where: { attemptId: attempt.id } });
  if (existing === 0) {
    await generatePruebaQuestions(attempt.id, config.numFinalQuestions);
  }

  const questions = await getPruebaQuestions(attempt.id);

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
    },
    questions,
    answeredCount: questions.filter((q) => q.selected !== null).length,
    total: questions.length,
  });
}
