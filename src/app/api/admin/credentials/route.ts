import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, setSessionCookie } from "@/lib/auth";
import * as bcrypt from "bcryptjs";

/** PUT /api/admin/credentials — el administrador cambia sus credenciales.
 *  Body: { currentPassword, newUsername?, newPassword? } */
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede cambiar sus credenciales" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const currentPassword = String((body as { currentPassword?: string }).currentPassword || "");
  const newUsername = String((body as { newUsername?: string }).newUsername || "").trim();
  const newPassword = String((body as { newPassword?: string }).newPassword || "");

  const admin = await db.user.findUnique({ where: { id: session.userId } });
  if (!admin) return NextResponse.json({ error: "Administrador no encontrado" }, { status: 404 });

  const ok = await bcrypt.compare(currentPassword, admin.password);
  if (!ok) {
    return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 401 });
  }

  const data: { username?: string; password?: string } = {};

  if (newUsername && newUsername !== admin.username) {
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(newUsername)) {
      return NextResponse.json({ error: "El nuevo usuario debe tener 3-30 caracteres (letras, números, . _ -)" }, { status: 400 });
    }
    const dup = await db.user.findUnique({ where: { username: newUsername } });
    if (dup) return NextResponse.json({ error: "Ese nombre de usuario ya está en uso" }, { status: 409 });
    data.username = newUsername;
  }

  if (newPassword) {
    if (newPassword.length < 4) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 4 caracteres" }, { status: 400 });
    }
    data.password = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No hay cambios que guardar" }, { status: 400 });
  }

  const updated = await db.user.update({ where: { id: admin.id }, data });

  // Refrescar la cookie de sesión con el nuevo nombre de usuario
  await setSessionCookie({
    userId: updated.id,
    username: updated.username,
    role: "ADMIN",
  });

  return NextResponse.json({ ok: true, username: updated.username });
}
