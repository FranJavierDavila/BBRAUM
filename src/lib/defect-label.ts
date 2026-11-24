/**
 * Etiqueta visible de un defecto, común a todas las superficies de la
 * aplicación: catálogo de Teoría, ficha, visor 3D, autoevaluación, Prueba de
 * Evaluación, resultado, etiquetas QR y panel admin.
 *
 *   name (lo que escribe el administrador en «Nombre del defecto»)
 *   → code solo como respaldo técnico mientras no haya nombre guardado
 *
 * Los códigos internos (D001…) no forman parte de la nomenclatura del cliente
 * y no se muestran cuando el defecto tiene nombre (v1.4.6).
 */
export type DefectNamer = {
  code: string;
  name: string;
};

export function defectLabel(d: DefectNamer): string {
  const name = d.name?.trim();
  if (name) return name;
  return d.code;
}
