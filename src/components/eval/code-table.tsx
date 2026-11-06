"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle2 } from "lucide-react";

const ALL_CODES = Array.from({ length: 40 }, (_, i) => `D${String(i + 1).padStart(3, "0")}`);

/** Tabla de códigos de la sección Teoría: repaso libre, sin límites ni bloqueos. */
export function CodeTable({
  visited,
  onSelectCode,
}: {
  visited: Set<string>;
  onSelectCode: (code: string) => void;
}) {
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
              Repaso libre: selecciona cualquier código, tantas veces como quieras. Cada ficha
              incluye la teoría completa, el modelo 3D y una autoevaluación de 1 pregunta.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 border-bb-green-line bg-bb-green-tint px-2.5 py-1 text-xs text-bb-green-dark"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Repasados: {visited.size}/40
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-2.5 md:grid-cols-8 lg:grid-cols-10">
          {ALL_CODES.map((code) => {
            const seen = visited.has(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => onSelectCode(code)}
                aria-label={`Abrir la ficha del código ${code}${seen ? " (ya repasado)" : ""}`}
                className={`flex h-12 items-center justify-center gap-1 rounded-lg border text-sm font-semibold transition-all ${
                  seen
                    ? "border-bb-green bg-bb-green-tint text-bb-green-dark shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                    : "cursor-pointer border-bb-green-line bg-white text-bb-green-dark shadow-sm hover:-translate-y-0.5 hover:border-bb-green hover:bg-bb-green-tint hover:shadow-md active:translate-y-0"
                }`}
              >
                {code}
                {seen && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

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
