import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { getSession } from "@/lib/auth";
import {
  defectUrl, labelsHtml, listDefectsForLabels, qrPng, qrReadmeText, resolveQrBase,
} from "@/lib/qr";

/** GET /api/admin/qr/zip?codes=D001,D002 — ZIP con los QR (512 px) + LEEME + hoja de etiquetas.
 *  Sin `codes` (o codes=all) incluye los 40 defectos. Solo administrador. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede generar los códigos QR" }, { status: 403 });
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

  const { baseUrl, source } = await resolveQrBase(req);

  const zip = new JSZip();
  const etiquetas = zip.folder("etiquetas")!;
  const dataUrls = new Map<string, string>();
  for (const d of defects) {
    const png = await qrPng(defectUrl(baseUrl, d.code), 512);
    etiquetas.file(`qrcode-${d.code}.png`, png);
    dataUrls.set(d.code, `data:image/png;base64,${png.toString("base64")}`);
  }
  zip.file("LEEME.txt", qrReadmeText(baseUrl, defects));
  zip.file("etiquetas.html", labelsHtml(baseUrl, defects, dataUrls));

  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const stamp = new Date().toISOString().slice(0, 10);
  const name = defects.length === all.length
    ? `qrs-inspeccion-visual-${stamp}.zip`
    : `qrs-${defects.length}-defectos-${stamp}.zip`;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/zip",
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${name}"`,
      "X-Qr-Base-Source": source,
    },
  });
}

