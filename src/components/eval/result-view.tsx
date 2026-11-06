"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, RotateCcw, PartyPopper } from "lucide-react";
import type { FinalResult } from "@/lib/eval-types";
import { defectLabel } from "@/lib/defect-label";

export function ResultView({
  result,
  onRepeat,
  onHome,
  busy,
}: {
  result: FinalResult;
  onRepeat: () => void;
  onHome: () => void;
  busy?: boolean;
}) {
  const passed = result.score >= 5;
  return (
    <Card className="mx-auto max-w-2xl shadow-lg shadow-slate-200/60">
      <CardHeader className="pb-2 text-center">
        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-bb-green-tint text-bb-green-dark">
          <PartyPopper className="h-8 w-8" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl">Prueba de Evaluación finalizada</CardTitle>
        <CardDescription>Este es el resumen de tu prueba</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="text-center">
          <p
            className={`text-6xl font-extrabold tabular-nums ${passed ? "text-bb-green-dark" : "text-red-600"}`}
            aria-label={`Puntuación ${result.score} sobre 10`}
          >
            {result.score.toLocaleString("es-ES")}
            <span className="text-2xl font-semibold text-slate-400">/10</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {result.correct} de {result.total} respuestas correctas
          </p>
          <Badge
            variant="outline"
            className={`mt-3 ${
              passed
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {passed ? "EVALUACIÓN SUPERADA" : "EVALUACIÓN NO SUPERADA (mín. 5)"}
          </Badge>
        </div>

        <Separator />

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Detalle por pregunta</p>
          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {result.detail.map((d) => (
              <div
                key={d.orderIndex}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs ${
                  d.isCorrect ? "border-emerald-100 bg-emerald-50/60" : "border-red-100 bg-red-50/60"
                }`}
              >
                {d.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                )}
                <span className="font-mono font-bold text-slate-600">{d.defectCode}</span>
                <span className="flex-1 truncate text-slate-600">
                  {defectLabel({ code: d.defectCode, name: d.defectName, displayName: d.defectDisplayName })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 sm:flex-row">
        <Button
          onClick={onRepeat}
          disabled={busy}
          className="w-full gap-2 sm:flex-1"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Repetir prueba (nueva batería)
        </Button>
        <Button variant="outline" onClick={onHome} disabled={busy} className="w-full sm:w-auto">
          Volver al resumen
        </Button>
      </CardFooter>
    </Card>
  );
}
