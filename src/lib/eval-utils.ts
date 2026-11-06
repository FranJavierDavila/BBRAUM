/** Utilidades compartidas del sistema de evaluación */

/** Redondea la puntuación a 1 decimal, escala 0-10 */
export function computeScore(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((10 * correct) / total * 10) / 10;
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
