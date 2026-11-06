import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** GET /api/admin/records/export — libro Excel (.xlsx) con los registros (solo admin).
 *  Hoja "Registros": una fila por respuesta de Prueba de Evaluación.
 *  Hoja "Resumen": una fila por intento con su nota y resumen por usuario. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede exportar los registros" }, { status: 403 });
  }

  const attempts = await db.attempt.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      user: { select: { username: true, email: true } },
      finalAnswers: {
        orderBy: { orderIndex: "asc" },
        include: { defect: { select: { code: true, name: true, severity: true } } },
      },
    },
  });

  const fmt = (d: Date | null) =>
    d ? new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

  // ---------- Hoja 1: Registros (detalle por pregunta) ----------
  const detalle: (string | number | null)[][] = [];
  for (const a of attempts) {
    if (a.finalAnswers.length === 0) continue;
    for (const fa of a.finalAnswers) {
      detalle.push([
        a.user.username,
        a.user.email,
        a.attemptNumber,
        fmt(a.startedAt),
        fa.defect.code,
        fa.defect.name,
        fa.defect.severity,
        fa.orderIndex,
        fa.selected ?? "",
        fa.selected === null ? "Sin responder" : fa.isCorrect ? "Acierto" : "Fallo",
        a.status === "COMPLETED" ? "Finalizada" : "En curso",
        a.finalScore ?? null,
        fmt(a.finishedAt),
      ]);
    }
  }

  const wsDetalle = XLSX.utils.aoa_to_sheet([
    ["Usuario", "Email", "Intento", "Inicio", "Código", "Defecto", "Severidad", "Nº pregunta", "Opción marcada", "Resultado", "Estado prueba", "Nota (0-10)", "Fin"],
    ...detalle,
  ]);
  wsDetalle["!cols"] = [
    { wch: 14 }, { wch: 26 }, { wch: 8 }, { wch: 17 }, { wch: 9 }, { wch: 34 },
    { wch: 10 }, { wch: 11 }, { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 11 }, { wch: 17 },
  ];
  wsDetalle["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: detalle.length, c: 12 } }) };

  // ---------- Hoja 2: Resumen (por intento) ----------
  const resumen: (string | number)[][] = [];
  for (const a of attempts) {
    const answered = a.finalAnswers.filter((fa) => fa.selected !== null).length;
    resumen.push([
      a.user.username,
      a.attemptNumber,
      fmt(a.startedAt),
      a.status === "COMPLETED" ? "Finalizada" : "En curso",
      answered,
      a.finalScore ?? "",
      fmt(a.finishedAt),
    ]);
  }
  const wsResumen = XLSX.utils.aoa_to_sheet([
    ["Usuario", "Intento", "Inicio", "Estado", "Preguntas respondidas", "Nota final (0-10)", "Fin"],
    ...resumen,
  ]);
  wsResumen["!cols"] = [
    { wch: 14 }, { wch: 8 }, { wch: 17 }, { wch: 12 }, { wch: 21 }, { wch: 17 }, { wch: 17 },
  ];

  // ---------- Hoja 3: Usuarios ----------
  const users = await db.user.findMany({
    select: { username: true, email: true, role: true, createdAt: true, _count: { select: { attempts: true } } },
    orderBy: { username: "asc" },
  });
  const wsUsers = XLSX.utils.aoa_to_sheet([
    ["Usuario", "Email", "Rol", "Alta", "Nº de intentos"],
    ...users.map((u) => [u.username, u.email, u.role === "ADMIN" ? "Administrador" : "Usuario", fmt(u.createdAt), u._count.attempts]),
  ]);
  wsUsers["!cols"] = [{ wch: 14 }, { wch: 26 }, { wch: 15 }, { wch: 17 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsDetalle, "Registros");
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen por intento");
  XLSX.utils.book_append_sheet(wb, wsUsers, "Usuarios");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const stamp = new Date().toISOString().slice(0, 10);
  const nombre = `registros-inspeccion-visual-${stamp}.xlsx`;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${nombre}"`,
    },
  });
}
