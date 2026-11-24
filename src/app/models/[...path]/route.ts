import { NextRequest, NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";

/**
 * GET /models/<fichero> — sirve los modelos 3D (.glb) directamente desde disco.
 *
 * Motivo (v1.4.5): el servidor standalone de Next.js escanea la carpeta public/
 * únicamente al arrancar, de modo que los ficheros subidos con el servidor en
 * marcha (GLB del cliente) devolvían 404 y el visor 3D no podía cargarlos.
 * Esta ruta lee el fichero en cada petición, sin depender de ese escaneo.
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await params;
  if (!parts?.length || parts.some((p) => p.includes("..") || p.includes("\0"))) {
    return new NextResponse("Ruta no válida", { status: 400 });
  }
  const base = path.join(process.cwd(), "public", "models");
  const abs = path.resolve(base, ...parts);
  if (!abs.startsWith(base + path.sep)) {
    return new NextResponse("Ruta no válida", { status: 400 });
  }
  if (!existsSync(abs) || !statSync(abs).isFile()) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  const ext = (abs.split(".").pop() || "").toLowerCase();
  const type = ext === "glb" ? "model/gltf-binary" : "application/octet-stream";
  const size = statSync(abs).size;

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
