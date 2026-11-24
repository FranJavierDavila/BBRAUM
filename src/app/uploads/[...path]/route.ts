import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";

/**
 * GET /uploads/<ruta> — sirve el material subido (imágenes, vídeo, audio)
 * directamente desde disco, con soporte de rangos (Range) para que los
 * vídeos se reproduzcan y puedan buscarse sin descargarse enteros.
 *
 * Motivo (v1.4.5): el servidor standalone de Next.js escanea public/ solo al
 * arrancar; los ficheros subidos con el servidor en marcha devolvían 404 y
 * no se visualizaban en las fichas. Esta ruta lee el disco en cada petición.
 */

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "audio/ogg",
  mov: "video/quicktime",
  m4v: "video/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  aac: "audio/aac",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await params;
  if (!parts?.length || parts.some((p) => p.includes("..") || p.includes("\0"))) {
    return new NextResponse("Ruta no válida", { status: 400 });
  }
  const base = path.join(process.cwd(), "public", "uploads");
  const abs = path.resolve(base, ...parts);
  if (!abs.startsWith(base + path.sep)) {
    return new NextResponse("Ruta no válida", { status: 400 });
  }
  if (!existsSync(abs) || !statSync(abs).isFile()) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  const ext = (abs.split(".").pop() || "").toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const size = statSync(abs).size;
  const range = req.headers.get("range");

  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m && (m[1] !== "" || m[2] !== "")) {
      let start: number;
      let end: number;
      if (m[1] === "") {
        // bytes=-N → últimos N bytes
        const n = parseInt(m[2], 10);
        start = Math.max(0, size - n);
        end = size - 1;
      } else {
        start = parseInt(m[1], 10);
        end = m[2] === "" ? size - 1 : Math.min(parseInt(m[2], 10), size - 1);
      }
      if (start >= size || end < start) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` },
        });
      }
      const stream = createReadStream(abs, { start, end });
      return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
        status: 206,
        headers: {
          "Content-Type": type,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }

  const stream = createReadStream(abs);
  return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
