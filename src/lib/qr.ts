import QRCode from "qrcode";
import { db } from "@/lib/db";

/**
 * Utilidades de generación de códigos QR para los 40 compartimentos del
 * expositor físico. Cada QR apunta a la URL pública fija del defecto:
 *   {base}/?defecto=D001&via=qr
 */

const HEX_DARK = "#1a2b33ff";
const HEX_LIGHT = "#ffffffff";

/** Configuración de base URL guardada por el administrador (o null). */
export async function getQrBaseConfigured(): Promise<string | null> {
  const cfg = await db.evalConfig.findFirst({ select: { qrBaseUrl: true } });
  const v = cfg?.qrBaseUrl?.trim();
  return v ? v.replace(/\/+$/, "") : null;
}

/**
 * Resuelve la base URL para los QR: primero la configurada por el administrador;
 * si no hay, se deduce del origen de la petición (x-forwarded-proto + host).
 */
export async function resolveQrBase(req: Request): Promise<{ baseUrl: string; source: "config" | "auto" }> {
  const configured = await getQrBaseConfigured();
  if (configured) return { baseUrl: configured, source: "config" };

  const h = new Headers(req.headers);
  const proto = (h.get("x-forwarded-proto") || "http").split(",")[0].trim();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return { baseUrl: `${proto}://${host}`, source: "auto" };
}

/** URL pública fija de un defecto (destino del QR). */
export function defectUrl(baseUrl: string, code: string): string {
  return `${baseUrl}/?defecto=${encodeURIComponent(code.toUpperCase())}&via=qr`;
}

/** PNG del QR como Buffer (128..1024 px, ECC medio, colores de marca). */
export async function qrPng(url: string, size = 512): Promise<Buffer> {
  const s = Math.max(128, Math.min(1024, Math.round(size)));
  return QRCode.toBuffer(url, {
    type: "png",
    width: s,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: HEX_DARK, light: HEX_LIGHT },
  });
}

/** Busca un defecto por código (trim + mayúsculas). */
export async function findDefectByCode(rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9-]{1,16}$/.test(code)) return null;
  return db.defect.findUnique({ where: { code } });
}

/** Lista de defectos ordenada por `order`, con datos mínimos para etiquetas. */
export async function listDefectsForLabels() {
  return db.defect.findMany({
    orderBy: { order: "asc" },
    select: { code: true, name: true, category: true },
  });
}

/** Texto del LEEME incluido en el ZIP de etiquetas. */
export function qrReadmeText(baseUrl: string, defects: { code: string; name: string }[]): string {
  const lines: string[] = [];
  lines.push("B. BRAUN · EVALUACIÓN DE INSPECCIÓN VISUAL");
  lines.push("Etiquetas QR para el expositor de botellas de suero");
  lines.push("=".repeat(60));
  lines.push("");
  lines.push("Contenido del paquete:");
  lines.push("- etiquetas/qrcode-DXXX.png : imagen QR (512 px) de cada defecto.");
  lines.push("- etiquetas.html : hoja de etiquetas lista para imprimir (A4).");
  lines.push("");
  lines.push("Cómo usarla:");
  lines.push("1. Imprime 'etiquetas.html' (A4 vertical, sin márgenes del navegador).");
  lines.push("2. Recorta cada etiqueta y pégala en el compartimento correspondiente");
  lines.push("   del expositor físico (cada QR corresponde al código indicado).");
  lines.push("3. Al escanear un QR con la cámara del móvil, se abre directamente la");
  lines.push("   ficha del defecto en la aplicación web.");
  lines.push("");
  lines.push(`URL base de los QR: ${baseUrl}`);
  lines.push(`URL de ejemplo: ${defectUrl(baseUrl, defects[0]?.code ?? "D001")}`);
  lines.push("");
  lines.push("Códigos incluidos:");
  for (const d of defects) lines.push(`  - ${d.code}: ${d.name}`);
  lines.push("");
  return lines.join("\n");
}

/** Hoja HTML de etiquetas lista para imprimir (A4, 4 columnas). */
export function labelsHtml(baseUrl: string, defects: { code: string; name: string; category: string }[], dataUrls: Map<string, string>): string {
  const cells = defects
    .map((d) => {
      const img = dataUrls.get(d.code) ?? "";
      return `        <div class="etiqueta">
          <div class="qr"><img src="${img}" alt="QR ${d.code}" /></div>
          <div class="info">
            <div class="codigo">${d.code}</div>
            <div class="nombre">${escapeHtml(d.name)}</div>
            <div class="categoria">${escapeHtml(d.category)}</div>
            <div class="url">${escapeHtml(defectUrl(baseUrl, d.code))}</div>
          </div>
        </div>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Etiquetas QR · Inspección Visual B. Braun</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, "Helvetica Neue", sans-serif; color: #1a2b33; background: #f6f6f4; padding: 24px; }
  header { margin-bottom: 16px; }
  header h1 { font-size: 18px; color: #00875f; }
  header p { font-size: 11px; color: #555; margin-top: 2px; }
  .rejilla { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .etiqueta { display: flex; gap: 10px; align-items: center; border: 1.5px solid #d8d8d2; border-radius: 8px; padding: 10px; background: #fff; page-break-inside: avoid; }
  .qr { width: 92px; height: 92px; flex: 0 0 92px; }
  .qr img { width: 100%; height: 100%; image-rendering: pixelated; }
  .codigo { font-size: 16px; font-weight: 800; letter-spacing: .5px; color: #00875f; }
  .nombre { font-size: 11px; font-weight: 700; margin-top: 1px; }
  .categoria { font-size: 9.5px; color: #6b7280; text-transform: uppercase; letter-spacing: .4px; }
  .url { font-size: 8px; color: #9ca3af; margin-top: 4px; word-break: break-all; }
  @media print {
    body { background: #fff; padding: 0; }
    header { display: none; }
    .rejilla { gap: 6px; }
    .etiqueta { border-color: #c9c9c2; }
  }
</style>
</head>
<body>
  <header>
    <h1>B. Braun · Etiquetas QR de inspección visual (40 defectos)</h1>
    <p>Imprime en A4, recorta y pega cada etiqueta en su compartimento del expositor. URL base: ${escapeHtml(baseUrl)}</p>
  </header>
  <div class="rejilla">
${cells}
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
