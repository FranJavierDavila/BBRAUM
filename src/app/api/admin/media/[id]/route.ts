import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

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
