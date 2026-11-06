import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { defectUrl, labelsHtml, listDefectsForLabels, qrPng, resolveQrBase } from "@/lib/qr";

/** GET /api/admin/qr/labels?codes=D001,D002 — hoja de etiquetas HTML lista para imprimir.
 *  Sin `codes` incluye los 40 defectos. Solo administrador. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede generar las etiquetas" }, { status: 403 });
  }

  const codesParam = (req.nextUrl.searchParams.get("codes") || "").trim();
  const all = await listDefectsForLabels();
  if (all.length === 0) {
    return NextResponse.json({ error: "No hay defectos en el catálogo" }, { status: 400 });
  }

  let defects = all;
  if (codesParam && codesParam.toLowerCase() !== "all") {
    const wanted = new Set(
      codesParam.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean)
    );
    defects = all.filter((d) => wanted.has(d.code.toUpperCase()));
    if (defects.length === 0) {
      return NextResponse.json({ error: "Ninguno de los códigos indicados existe" }, { status: 400 });
    }
  }

  const { baseUrl } = await resolveQrBase(req);
  const dataUrls = new Map<string, string>();
  for (const d of defects) {
    const png = await qrPng(defectUrl(baseUrl, d.code), 256);
    dataUrls.set(d.code, `data:image/png;base64,${png.toString("base64")}`);
  }

  const html = labelsHtml(baseUrl, defects, dataUrls);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
