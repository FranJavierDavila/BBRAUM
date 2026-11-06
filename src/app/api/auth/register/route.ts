import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const consent = Boolean(body.consent);

    // Validaciones
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: "El nombre de usuario debe tener entre 3 y 30 caracteres (letras, números, . _ -)" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Introduce un correo electrónico válido" }, { status: 400 });
    }
    if (password.length < 4) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 4 caracteres" }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json(
        { error: "Debes aceptar el tratamiento de tus datos personales (RGPD) para registrarte" },
        { status: 400 }
      );
    }

    // Comprobar si el usuario ya existe en la base de datos
    const existing = await db.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      const field = existing.username === username ? "nombre de usuario" : "correo electrónico";
      return NextResponse.json(
        { error: `Ya existe un usuario registrado con ese ${field}` },
        { status: 409 }
      );
    }

    // Almacenar nuevo usuario
    const hash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { username, email, password: hash, role: "USER", consentAt: new Date() },
    });

    await setSessionCookie({ userId: user.id, username: user.username, role: "USER" });
    return NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error("Error en registro:", e);
    return NextResponse.json({ error: "Error interno al registrar el usuario" }, { status: 500 });
  }
}
