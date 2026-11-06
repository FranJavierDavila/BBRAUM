/**
 * Etiqueta visible de un defecto y cadena de respaldo (fallback) común a todas
 * las superficies de la aplicación: catálogo de Teoría, ficha, visor 3D,
 * autoevaluación, Prueba de Evaluación, resultado, etiquetas QR y panel admin.
 *
 *   displayName (lo que escribe el administrador) → name → code
 *
 * El código nunca desaparece del todo: si el administrador borra el nombre,
 * la etiqueta cae al código para que la tarjeta siga siendo reconocible.
 */
export type DefectNamer = {
  code: string;
  name: string;
  displayName?: string | null;
};

export function defectLabel(d: DefectNamer): string {
  const display = d.displayName?.trim();
  if (display) return display;
  const name = d.name?.trim();
  if (name) return name;
  return d.code;
}
