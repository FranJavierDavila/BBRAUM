"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelViewer } from "./model-viewer";
import { Maximize2, Minimize2, Info } from "lucide-react";

export const SEV_STYLE: Record<string, string> = {
  CRITICO: "border-red-200 bg-red-50 text-red-700",
  MAYOR: "border-amber-200 bg-amber-50 text-amber-700",
  MENOR: "border-slate-200 bg-slate-100 text-slate-600",
};
export const SEV_TEXT: Record<string, string> = {
  CRITICO: "Crítico",
  MAYOR: "Mayor",
  MENOR: "Menor",
};

/**
 * Tarjeta de visor 3D maximizable, reutilizada en la ficha de Teoría y en cada
 * pregunta de la Prueba de Evaluación. Siempre muestra el GLB asignado al defecto.
 */
export function Viewer3DCard({
  src,
  name,
  severity,
  code,
}: {
  src: string;
  name: string;
  severity: string;
  code?: string;
}) {
  const [viewerMax, setViewerMax] = useState(false);

  // Maximizado: bloquea el scroll y cierra con Escape
  useEffect(() => {
    if (!viewerMax) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerMax(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [viewerMax]);

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <span>{name}</span>
          <Badge variant="outline" className={SEV_STYLE[severity] || SEV_STYLE.MENOR}>
            {SEV_TEXT[severity] || severity}
          </Badge>
          {code && (
            <Badge variant="outline" className="font-mono text-sm font-bold text-slate-700">
              {code}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <ModelViewer src={src} alt={`Modelo 3D: ${name}`} />
          <Button
            size="sm"
            onClick={() => setViewerMax(true)}
            className="absolute right-2 top-2 z-10 gap-1.5"
            aria-label="Maximizar el visor 3D"
            title="Maximizar"
          >
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Maximizar</span>
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          <Info className="mr-1 inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
          Manipula el modelo como si sostuvieras la botella real: rótala y haz zoom para
          inspeccionar el defecto. Usa «Maximizar» para verlo a pantalla completa.
        </p>
      </CardContent>

      {/* Visor 3D maximizado (a pantalla completa) */}
      {viewerMax &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex flex-col bg-slate-950/95 p-3 sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Visor 3D maximizado"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-white sm:text-base">{name}</span>
                <Badge variant="outline" className={SEV_STYLE[severity] || SEV_STYLE.MENOR}>
                  {SEV_TEXT[severity] || severity}
                </Badge>
                {code && (
                  <Badge variant="outline" className="border-white/30 font-mono text-white/80">
                    {code}
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewerMax(false)}
                className="gap-1.5 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                aria-label="Minimizar el visor 3D"
                title="Minimizar"
              >
                <Minimize2 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Minimizar</span>
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <ModelViewer src={src} alt={`Modelo 3D: ${name}`} fill />
            </div>
            <p className="mt-2 text-center text-xs text-slate-300">
              Pulsa Escape o «Minimizar» para volver a la vista normal
            </p>
          </div>,
          document.body
        )}
    </Card>
  );
}
