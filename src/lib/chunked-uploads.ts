import { readFile, rm } from "fs/promises";
import path from "path";

/**
 * Subidas por trozos (chunked uploads).
 *
 * Los proxies inversos (p. ej. el del panel de vista previa, o un Nginx con
 * client_max_body_size por defecto) rechazan las peticiones grandes con un 413,
 * lo que el navegador muestra como «error de comunicación». Para evitarlo, el
 * cliente divide el fichero en trozos pequeños (ver admin-view.tsx), los envía
 * a /api/admin/chunks y, al terminar, pasa el token al POST final
 * (/api/admin/models o /api/admin/media), que recupera el blob con takeUpload()
 * y aplica exactamente la misma validación que con una subida directa.
 */

/** Raíz del almacén temporal (dentro del proyecto, se limpia sola) */
export const TMP_ROOT = path.join(process.cwd(), ".uploads-tmp");

/** Valida el formato del identificador de subida */
export function isUploadId(id: string): boolean {
  return /^[a-zA-Z0-9]{8,64}$/.test(id);
}

/**
 * Consumo una subida troceada: devuelve el blob completo y elimina el temporal.
 * Debe llamarse una sola vez (el POST final) tras el «done» del cliente.
 */
export async function takeUpload(
  token: string
): Promise<{ error: string } | { filename: string; buf: Buffer; size: number }> {
  if (!isUploadId(token)) return { error: "Token de subida no válido" };
  const dir = path.join(TMP_ROOT, token);
  try {
    const meta = JSON.parse(await readFile(path.join(dir, "meta.json"), "utf8")) as { filename?: string };
    const buf = await readFile(path.join(dir, "blob"));
    await rm(dir, { recursive: true, force: true });
    if (!meta.filename) return { error: "Subida incompleta: falta el nombre del fichero" };
    return { filename: meta.filename, buf, size: buf.length };
  } catch {
    return { error: "La subida por trozos no se ha encontrado o ha caducado; vuelve a subirla" };
  }
}
