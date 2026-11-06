import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { defectUrl, findDefectByCode, qrPng, resolveQrBase } from "@/lib/qr";

/** GET /api/admin/qr/D001?size=512 — PNG del QR del defecto (solo administrador). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede generar los códigos QR" }, { status: 403 });
  }

  const { code } = await params;
  const defect = await findDefectByCode(code);
  if (!defect) {
    return NextResponse.json({ error: "Defecto no encontrado" }, { status: 404 });
  }

  const sizeParam = Number(req.nextUrl.searchParams.get("size") || 512);
  const size = Number.isFinite(sizeParam) ? sizeParam : 512;
  const { baseUrl } = await resolveQrBase(req);
  const url = defectUrl(baseUrl, defect.code);
  const png = await qrPng(url, size);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="qrcode-${defect.code}.png"`,
    },
  });
}
