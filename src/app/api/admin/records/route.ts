import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** GET /api/admin/records — registro de actividad de todos los usuarios (solo admin).
 *  Devuelve una fila por pregunta respondida de las Pruebas de Evaluación. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede consultar los registros" }, { status: 403 });
  }

  const attempts = await db.attempt.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      user: { select: { username: true, email: true } },
      finalAnswers: {
        orderBy: { orderIndex: "asc" },
        include: {
          defect: { select: { code: true, name: true } },
        },
      },
    },
  });

  const rows: Array<{
    username: string;
    email: string;
    attemptNumber: number;
    startedAt: string;
    defectCode: string;
    defectName: string;
    isCorrect: boolean | null;
    finalScore: number | null;
    finishedAt: string | null;
    status: string;
  }> = [];

  for (const a of attempts) {
    for (const fa of a.finalAnswers) {
      rows.push({
        username: a.user.username,
        email: a.user.email,
        attemptNumber: a.attemptNumber,
        startedAt: a.startedAt.toISOString(),
        defectCode: fa.defect.code,
        defectName: fa.defect.name,
        isCorrect: fa.selected === null ? null : fa.isCorrect,
        finalScore: a.finalScore,
        finishedAt: a.finishedAt ? a.finishedAt.toISOString() : null,
        status: a.status,
      });
    }
  }

  // Resumen por usuario
  const users = await db.user.findMany({
    select: { id: true, username: true, email: true, role: true, createdAt: true, _count: { select: { attempts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    rows,
    users: users.map((u) => ({
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      attempts: u._count.attempts,
    })),
    totalAttempts: attempts.length,
  });
}
