import { db } from "@/lib/db";

/** Configuración global (singleton). Si no existe la crea con valores por defecto. */
export async function getConfig() {
  let cfg = await db.evalConfig.findFirst();
  if (!cfg) {
    cfg = await db.evalConfig.create({ data: { numFinalQuestions: 10 } });
  }
  return cfg;
}

/** Intento actual del usuario (el más reciente). */
export async function getCurrentAttempt(userId: string) {
  return db.attempt.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });
}

/** Siguiente número de intento del usuario. */
export async function nextAttemptNumber(userId: string): Promise<number> {
  const count = await db.attempt.count({ where: { userId } });
  return count + 1;
}

/** Barajado Fisher-Yates in situ. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Genera las preguntas de una Prueba de Evaluación para un intento:
 * - N = número configurado por el administrador (numFinalQuestions).
 * - Los códigos de defecto NO se repiten: 1 sola pregunta por código.
 * - Los defectos y la variante de la pregunta se escogen al azar sobre
 *   el catálogo completo (los 40 defectos con su banco de hasta 5 preguntas).
 */
export async function generatePruebaQuestions(attemptId: string, numQuestions: number) {
  const defects = await db.defect.findMany({
    where: { questions: { some: {} } },
    include: { questions: { orderBy: { variant: "asc" } } },
  });
  if (defects.length === 0) {
    throw new Error("No hay defectos con preguntas configuradas");
  }

  const n = Math.max(1, Math.min(numQuestions, defects.length));
  const picked = shuffle([...defects]).slice(0, n);

  await db.finalAnswer.createMany({
    data: picked.map((d, i) => {
      const q = d.questions[Math.floor(Math.random() * d.questions.length)];
      return {
        attemptId,
        questionId: q.id,
        defectId: d.id,
        orderIndex: i + 1,
      };
    }),
  });
}

/** Devuelve las preguntas de una Prueba de Evaluación ya generadas (sin revelar la correcta). */
export async function getPruebaQuestions(attemptId: string) {
  const rows = await db.finalAnswer.findMany({
    where: { attemptId },
    orderBy: { orderIndex: "asc" },
    include: {
      question: { select: { text: true, optionA: true, optionB: true, optionC: true } },
      defect: { select: { code: true, name: true, displayName: true, severity: true, modelPath: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    orderIndex: r.orderIndex,
    selected: r.selected,
    answeredAt: r.answeredAt,
    defectCode: r.defect.code,
    defectName: r.defect.name,
    defectDisplayName: r.defect.displayName,
    defectSeverity: r.defect.severity,
    modelPath: r.defect.modelPath,
    text: r.question.text,
    optionA: r.question.optionA,
    optionB: r.question.optionB,
    optionC: r.question.optionC,
  }));
}
