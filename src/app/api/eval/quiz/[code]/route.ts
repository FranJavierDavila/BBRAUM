import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** GET /api/eval/quiz/[code] — autoevaluación de Teoría: 1 pregunta aleatoria
 *  del banco de variantes del defecto (puede variar en cada repaso). */
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
    include: { questions: { orderBy: { variant: "asc" } } },
  });
  if (!defect) {
    return NextResponse.json({ error: "Código de defecto no encontrado" }, { status: 404 });
  }
  if (defect.questions.length === 0) {
    return NextResponse.json(
      { error: "Este defecto todavía no tiene preguntas configuradas" },
      { status: 404 }
    );
  }

  // Variante aleatoria en cada llamada → al repetir el repaso puede tocar una pregunta distinta
  const q = defect.questions[Math.floor(Math.random() * defect.questions.length)];

  return NextResponse.json({
    defect: { code: defect.code, name: defect.name },
    question: {
      id: q.id,
      text: q.text,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
    },
    bankSize: defect.questions.length,
  });
}
