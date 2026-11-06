"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle2 } from "lucide-react";

const FALLBACK_CODES = Array.from({ length: 40 }, (_, i) => `D${String(i + 1).padStart(3, "0")}`);

type CatalogDefect = { code: string; name: string; severity: string };

/** Tabla del catálogo de la sección Teoría: repaso libre, sin límites ni bloqueos.
 *  Cada tarjeta muestra el nombre del defecto (editable por el administrador) con su código. */
export function CodeTable({
  visited,
  onSelectCode,
}: {
  visited: Set<string>;
  onSelectCode: (code: string) => void;
}) {
  const [defects, setDefects] = useState<CatalogDefect[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/eval/defects")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { defects?: CatalogDefect[] }) => {
        if (active) setDefects(data.defects ?? []);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const items: CatalogDefect[] = defects?.length
    ? defects
    : defects === null && !failed
      ? [] // cargando
      : FALLBACK_CODES.map((code) => ({ code, name: "", severity: "" }));
  const total = items.length || 40;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-bb-green-dark" aria-hidden="true" />
              Catálogo de defectos
            </CardTitle>
            <CardDescription>
              Repaso libre: selecciona cualquier defecto, tantas veces como quieras. Cada ficha
              incluye la teoría completa, el modelo 3D y una autoevaluación de 1 pregunta.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 border-bb-green-line bg-bb-green-tint px-2.5 py-1 text-xs text-bb-green-dark"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Repasados: {visited.size}/{total}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-2.5 md:grid-cols-8 lg:grid-cols-10">
            {FALLBACK_CODES.map((code) => (
              <div
                key={code}
                aria-hidden="true"
                className="h-12 animate-pulse rounded-lg border border-bb-green-line bg-slate-50"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((d) => {
              const seen = visited.has(d.code);
              const named = Boolean(d.name) && d.name !== d.code;
              const ring = seen
                ? "border-bb-green bg-bb-green-tint shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                : "cursor-pointer border-bb-green-line bg-white shadow-sm hover:-translate-y-0.5 hover:border-bb-green hover:bg-bb-green-tint hover:shadow-md active:translate-y-0";
              return (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => onSelectCode(d.code)}
                  aria-label={`Abrir la ficha ${named ? `«${d.name}»` : `del código ${d.code}`}${
                    seen ? " (ya repasado)" : ""
                  }`}
                  className={`flex min-h-[3.25rem] flex-col justify-center gap-0.5 rounded-lg border px-2.5 py-1.5 text-left transition-all ${ring}`}
                >
                  {named ? (
                    <>
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {d.code}
                        {seen && <CheckCircle2 className="h-3 w-3 text-bb-green" aria-hidden="true" />}
                      </span>
                      <span
                        className="line-clamp-2 text-xs font-semibold leading-tight text-bb-green-dark"
                        title={d.name}
                      >
                        {d.name}
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center justify-center gap-1 py-1.5 text-sm font-semibold text-bb-green-dark">
                      {d.code}
                      {seen && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-bb-green bg-white" /> Pendiente de repasar
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-bb-green bg-bb-green-tint" /> Ya repasado en este navegador
          </span>
          <span>No hay límites: puedes repetir cualquier código siempre que quieras.</span>
        </div>
      </CardContent>
    </Card>
  );
}
