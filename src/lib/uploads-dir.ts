import path from "path";

/**
 * Carpeta donde se guardan los ficheros que el administrador sube (imágenes,
 * vídeos y audio del material de apoyo; los modelos GLB van aparte en
 * public/models, que es parte del build).
 *
 * Por defecto es `public/uploads` (comportamiento histórico), pero el arranque
 * puede fijar UPLOADS_DIR para situarla FUERA del directorio de build. Desde
 * v1.4.7 el lanzador del paquete y el entorno de preview la fijan a una carpeta
 * de datos propia: así ninguna reconstrucción o actualización borra el material
 * subido, que antes se perdía al regenerarse public/ dentro del build.
 */
export const UPLOADS_DIR =
  process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), "public", "uploads");

/** Carpeta histórica dentro de public/ (ficheros incluidos con el build, p. ej.
 *  el material de demostración de seed-media). Las lecturas la usan de respaldo. */
export function uploadsFallbackDirs(): string[] {
  return [path.join(process.cwd(), "public", "uploads")];
}
