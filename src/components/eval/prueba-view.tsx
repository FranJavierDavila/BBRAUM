"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Viewer3DCard } from "./viewer-3d-card";
import {
  CheckCircle2, XCircle, Loader2, ClipboardCheck, AlertTriangle, ArrowLeft,
} from "lucide-react";
import {
  apiFetch, type PruebaQuestion, type FinalResult,
} from "@/lib/eval-types";

/**
 * Prueba de Evaluación: batería de preguntas definida por el administrador.
 * Cada pregunta muestra a su lado el modelo 3D (GLB) del defecto exacto sobre
 * el que se pregunta. Los códigos no se repiten dentro de una misma prueba.
 */
export function PruebaView({
  onFinished,
  onExit,
  onStarted,
}: {
  onFinished: (r: FinalResult) => void;
  onExit: () => void;
  /** Avisa al padre de que la prueba (nueva o retomada) está activa, para refrescar el estado */
  onStarted?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<PruebaQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctOption: string; explanation: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ questions: PruebaQuestion[] }>("/api/eval/prueba/start", { method: "POST" })
      .then((data) => {
        if (cancelled) return;
        setQuestions(data.questions);
        // Si la prueba ya estaba a medias, saltar a la primera sin responder
        const firstUnanswered = data.questions.findIndex((q) => q.selected === null);
        if (firstUnanswered === -1) {
          // Todas respondidas (p. ej. recarga al final): cerrar directamente
          if (!finishedRef.current) {
            finishedRef.current = true;
            apiFetch<FinalResult>("/api/eval/prueba/finish", { method: "POST" })
              .then((r) => !cancelled && onFinished(r))
              .catch(() => {
                finishedRef.current = false;
                if (!cancelled) {
                  setError("No se pudo cerrar la prueba");
                  setLoading(false);
                }
              });
          }
          return;
        }
        setIndex(firstUnanswered);
        setSelected(data.questions[firstUnanswered].selected || "");
        setLoading(false);
        onStarted?.();
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Error al generar la prueba");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const q = questions[index];
  const answeredCount = questions.filter((x) => x.selected !== null).length;

  async function answer() {
    if (!q || !selected || submitting) return;
    setSubmitting(true);
    try {
      const data = await apiFetch<{
        isCorrect: boolean; correctOption: string; explanation: string;
      }>("/api/eval/prueba/answer", {
        method: "POST",
        body: JSON.stringify({ finalAnswerId: q.id, selected }),
      });
      setFeedback(data);
      setQuestions((prev) =>
        prev.map((x) => (x.id === q.id ? { ...x, selected } : x))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar la respuesta");
    } finally {
      setSubmitting(false);
    }
  }

  async function next() {
    setFeedback(null);
    setSelected("");
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      return;
    }
    // Última pregunta → finalizar
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinishing(true);
    try {
      const result = await apiFetch<FinalResult>("/api/eval/prueba/finish", { method: "POST" });
      onFinished(result);
    } catch (err) {
      finishedRef.current = false;
      setError(err instanceof Error ? err.message : "Error al finalizar la prueba");
      setFinishing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="space-y-3 p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" aria-hidden="true" />
          <p className="text-sm text-slate-600">{error}</p>
          <Button variant="outline" onClick={onExit}>Volver</Button>
        </CardContent>
      </Card>
    );
  }

  if (!q) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="p-6 text-center text-sm text-slate-500">
          No hay preguntas disponibles para la prueba.
        </CardContent>
      </Card>
    );
  }

  const options = [
    { key: "A", text: q.optionA },
    { key: "B", text: q.optionB },
    { key: "C", text: q.optionC },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={onExit} className="gap-1.5 px-3 text-slate-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver
          <span className="hidden text-xs text-slate-400 sm:inline">
            (la prueba queda guardada y podrás continuar)
          </span>
        </Button>
        <Badge variant="outline" className="border-bb-green-line bg-bb-green-tint text-bb-green-dark">
          Intento en curso
        </Badge>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 text-bb-green-dark" aria-hidden="true" />
              Prueba de Evaluación
            </CardTitle>
            <Badge variant="outline" className="border-bb-green-line bg-bb-green-tint text-bb-green-dark">
              Pregunta {index + 1} de {questions.length}
            </Badge>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Progress
              value={(answeredCount / questions.length) * 100}
              className="h-2 flex-1"
              aria-label={`Progreso de la prueba: ${answeredCount} de ${questions.length}`}
            />
            <span className="text-xs font-medium tabular-nums text-slate-500">
              {answeredCount}/{questions.length}
            </span>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Modelo 3D del defecto preguntado (el GLB asignado a este código) */}
        <div key={`model-${q.id}`}>
          <Viewer3DCard
            src={q.modelPath}
            name={q.defectName}
            severity={q.defectSeverity}
            code={q.defectCode}
          />
        </div>

        {/* Pregunta */}
        <Card className="shadow-sm">
          <CardContent className="space-y-4 pt-6">
            <p className="rounded-lg border bg-slate-50 p-3 text-sm font-semibold leading-snug text-slate-800">
              {q.text}
            </p>

            <RadioGroup
              key={q.id}
              value={feedback ? feedback.correctOption || selected : selected}
              onValueChange={(v) => !feedback && setSelected(v)}
              className="gap-2"
              disabled={!!feedback}
            >
              {options.map((opt) => {
                const isChosen = feedback && selected === opt.key;
                const isCorrectOpt = feedback?.correctOption === opt.key;
                let style = "border-slate-200 hover:border-bb-green hover:bg-bb-green-tint/60";
                if (feedback && isCorrectOpt) style = "border-emerald-400 bg-emerald-50";
                else if (feedback && isChosen) style = "border-red-400 bg-red-50";
                else if (feedback) style = "border-slate-200 bg-white opacity-70";
                return (
                  <Label
                    key={opt.key}
                    htmlFor={`p-${q.id}-${opt.key}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm leading-relaxed transition-colors ${style} ${
                      feedback ? "cursor-default" : ""
                    }`}
                  >
                    <RadioGroupItem value={opt.key} id={`p-${q.id}-${opt.key}`} className="mt-0.5" />
                    <span className="flex-1 text-slate-700">
                      <span className="mr-1.5 font-bold text-slate-500">{opt.key})</span>
                      {opt.text}
                    </span>
                    {feedback && isCorrectOpt && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    )}
                    {feedback && isChosen && !feedback.isCorrect && (
                      <XCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                    )}
                  </Label>
                );
              })}
            </RadioGroup>

            {feedback && (
              <div
                role="status"
                className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
                  feedback.isCorrect
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-red-300 bg-red-50 text-red-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  {feedback.isCorrect ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                      ¡Correcto!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                      Error, revisa la información correspondiente al defecto
                    </>
                  )}
                </span>
                <p className="mt-1.5 text-xs font-normal leading-relaxed text-slate-600">
                  {feedback.explanation}
                </p>
              </div>
            )}

            {error && questions.length > 0 && (
              <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            {!feedback ? (
              <Button
                onClick={answer}
                disabled={!selected || submitting}
                className="w-full"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Responder
              </Button>
            ) : (
              <Button onClick={next} disabled={finishing} className="w-full">
                {finishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {index + 1 < questions.length ? "Siguiente pregunta" : "Finalizar prueba y ver puntuación"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-slate-400">
        Preguntas escogidas al azar sobre los 40 defectos del catálogo · 1 sola pregunta por código ·
        sin repeticiones dentro de la prueba
      </p>
    </div>
  );
}
