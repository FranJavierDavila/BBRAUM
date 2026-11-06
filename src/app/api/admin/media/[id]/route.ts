import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { MEDIA_SECTION_KEYS } from "@/lib/media-sections";
import { unlink } from "fs/promises";
import path from "path";

/** PATCH /api/admin/media/[id] — cambia el apartado de la ficha donde se muestra el recurso. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede reubicar material" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { section?: string | null } | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
  }

  const raw = body.section ?? null;
  const section = raw === null || raw === "" ? null : String(raw);
  if (section && !MEDIA_SECTION_KEYS.includes(section)) {
    return NextResponse.json({ error: "Apartado de la ficha no válido" }, { status: 400 });
  }

  const media = await db.defectMedia.findUnique({ where: { id }, select: { id: true } });
  if (!media) return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });

  const updated = await db.defectMedia.update({
    where: { id },
    data: { section },
    select: { id: true, section: true },
  });

  return NextResponse.json({ ok: true, media: updated });
}

/** DELETE /api/admin/media/[id] — elimina el material de apoyo y su archivo local si procede. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede eliminar material" }, { status: 403 });
  }

  const { id } = await params;
  const media = await db.defectMedia.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: "Material no encontrado" }, { status: 404 });

  await db.defectMedia.delete({ where: { id } });

  // Si el archivo es local (/uploads/…), eliminarlo del disco de forma segura
  if (media.url.startsWith("/uploads/")) {
    const rel = media.url.replace(/^\/uploads\//, "");
    const uploadsRoot = path.join(process.cwd(), "public", "uploads");
    const abs = path.join(uploadsRoot, rel);
    if (!abs.startsWith(uploadsRoot + path.sep)) {
      return NextResponse.json({ ok: true, fileRemoved: false });
    }
    try {
      await unlink(abs);
    } catch {
      // el archivo ya no existe: no bloquea la operación
    }
    return NextResponse.json({ ok: true, fileRemoved: true });
  }

  return NextResponse.json({ ok: true, fileRemoved: false });
}
