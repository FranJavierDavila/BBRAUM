import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json({ error: "Introduce usuario y contraseña" }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { OR: [{ username }, { email: username }] },
    });
    if (!user) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }

    await setSessionCookie({
      userId: user.id,
      username: user.username,
      role: user.role === "ADMIN" ? "ADMIN" : "USER",
    });
    return NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error("Error en login:", e);
    return NextResponse.json({ error: "Error interno al iniciar sesión" }, { status: 500 });
  }
}
