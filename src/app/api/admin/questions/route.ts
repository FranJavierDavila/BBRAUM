import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** GET /api/admin/questions?code=D001 — el banco de variantes de preguntas del
 *  defecto (hasta 5). Es la fuente de TODO: el repaso de Teoría saca una
 *  variante al azar de aquí y la Prueba de Evaluación (test final) toma una
 *  variante al azar de cada defecto incluido en la prueba. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede ver las preguntas" }, { status: 403 });
  }
  const code = (req.nextUrl.searchParams.get("code") ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Falta el código del defecto" }, { status: 400 });
  }
  const defect = await db.defect.findUnique({
    where: { code },
    include: { questions: { orderBy: { variant: "asc" } } },
  });
  if (!defect) {
    return NextResponse.json({ error: "Defecto no encontrado" }, { status: 404 });
  }
  return NextResponse.json({
    code: defect.code,
    questions: defect.questions.map((q) => ({
      id: q.id,
      variant: q.variant,
      text: q.text,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      correct: q.correct,
      explanation: q.explanation,
    })),
  });
}

/** PUT /api/admin/questions — crea o actualiza una variante del banco.
 *  Body: { code, variant (1..5), text, optionA, optionB, optionC, correct (A|B|C), explanation } */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede editar las preguntas" }, { status: 403 });
  }

  let body: {
    code?: string;
    variant?: number;
    text?: string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    correct?: string;
    explanation?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON no válido" }, { status: 400 });
  }

  const code = (body.code ?? "").trim().toUpperCase();
  const variant = Number(body.variant);
  const text = (body.text ?? "").trim();
  const optionA = (body.optionA ?? "").trim();
  const optionB = (body.optionB ?? "").trim();
  const optionC = (body.optionC ?? "").trim();
  const correct = (body.correct ?? "").trim().toUpperCase();
  const explanation = (body.explanation ?? "").trim();

  if (!code) {
    return NextResponse.json({ error: "Falta el código del defecto" }, { status: 400 });
  }
  if (!Number.isInteger(variant) || variant < 1 || variant > 5) {
    return NextResponse.json({ error: "La variante debe ser un número del 1 al 5" }, { status: 400 });
  }
  if (!text || !optionA || !optionB || !optionC) {
    return NextResponse.json(
      { error: "El enunciado y las tres opciones son obligatorios" },
      { status: 400 },
    );
  }
  if (!["A", "B", "C"].includes(correct)) {
    return NextResponse.json({ error: "La opción correcta debe ser A, B o C" }, { status: 400 });
  }

  const defect = await db.defect.findUnique({ where: { code } });
  if (!defect) {
    return NextResponse.json({ error: "Defecto no encontrado" }, { status: 404 });
  }

  const data = { text, optionA, optionB, optionC, correct, explanation };
  const saved = await db.question.upsert({
    where: { defectId_variant: { defectId: defect.id, variant } },
    update: data,
    create: { defectId: defect.id, variant, ...data },
  });

  return NextResponse.json({
    ok: true,
    question: {
      id: saved.id,
      variant: saved.variant,
      text: saved.text,
      optionA: saved.optionA,
      optionB: saved.optionB,
      optionC: saved.optionC,
      correct: saved.correct,
      explanation: saved.explanation,
    },
  });
}

/** DELETE /api/admin/questions — quita una variante del banco.
 *  Body: { code, variant }. Falla si algún examen realizado la referencia. */
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede quitar preguntas" }, { status: 403 });
  }

  let body: { code?: string; variant?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON no válido" }, { status: 400 });
  }
  const code = (body.code ?? "").trim().toUpperCase();
  const variant = Number(body.variant);
  if (!code || !Number.isInteger(variant)) {
    return NextResponse.json({ error: "Faltan el código o la variante" }, { status: 400 });
  }

  const defect = await db.defect.findUnique({ where: { code } });
  if (!defect) {
    return NextResponse.json({ error: "Defecto no encontrado" }, { status: 404 });
  }
  const question = await db.question.findUnique({
    where: { defectId_variant: { defectId: defect.id, variant } },
  });
  if (!question) {
    return NextResponse.json({ error: "Esa variante no existe en el banco" }, { status: 404 });
  }

  try {
    await db.question.delete({ where: { id: question.id } });
  } catch {
    return NextResponse.json(
      {
        error:
          "No se puede quitar: algún examen realizado utiliza esta pregunta. Los registros se conservan íntegros; si de verdad necesitas retirarla, exporta una copia y edítala en local.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
