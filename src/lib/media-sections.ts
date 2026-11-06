/**
 * Apartados de la ficha del defecto donde puede enlazarse un recurso multimedia.
 * Compartido entre las APIs (validación) y los componentes de cliente (etiquetas).
 * `section: null` significa «galería del pie de la ficha» (comportamiento clásico).
 */
export const MEDIA_SECTIONS = [
  { key: "header", label: "Apartado 1 · Defecto", short: "Defecto" },
  { key: "description", label: "Apartado 2 · Descripción breve del defecto", short: "Descripción" },
  { key: "risks", label: "Apartado 3 · Riesgos para el paciente", short: "Riesgos" },
  { key: "causes", label: "Apartado 4 · Causas habituales", short: "Causas" },
  { key: "action", label: "Apartado 5 · Actuación correcta", short: "Actuación" },
  { key: "detection", label: "Apartado 6 · Guía para su detección durante la inspección", short: "Detección" },
  { key: "prevention", label: "Apartado 7 · Prevención y buenas prácticas", short: "Prevención" },
  { key: "regulation", label: "Nota al pie · Referencias normativas", short: "Normativa" },
] as const;

export type MediaSectionKey = (typeof MEDIA_SECTIONS)[number]["key"];

export const MEDIA_SECTION_KEYS: string[] = MEDIA_SECTIONS.map((s) => s.key);

/** Etiqueta larga del apartado (selectores del administrador). */
export function mediaSectionLabel(key: string | null | undefined): string {
  if (!key) return "Galería del pie de la ficha";
  return MEDIA_SECTIONS.find((s) => s.key === key)?.label ?? "Galería del pie de la ficha";
}

/** Etiqueta corta (insignia del visor de recursos en la ficha). */
export function mediaSectionShort(key: string | null | undefined): string {
  if (!key) return "Galería";
  return MEDIA_SECTIONS.find((s) => s.key === key)?.short ?? "Galería";
}
