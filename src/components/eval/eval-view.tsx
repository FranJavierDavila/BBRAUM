"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { CodeTable } from "./code-table";
import { DefectView } from "./defect-view";
import { PruebaView } from "./prueba-view";
import { ResultView } from "./result-view";
import {
  ApiError, apiFetch, type EvalState, type FinalResult,
} from "@/lib/eval-types";
import {
  BookOpen, ClipboardCheck, PlayCircle, GraduationCap, Lock,
} from "lucide-react";

type Section = "teoria" | "prueba";
type PruebaStage = "intro" | "running" | "result";

const VISITED_KEY = "bb-teoria-visitados";

export function EvalView() {
  const { toast } = useToast();
  const [state, setState] = useState<EvalState | null>(null);
  const [section, setSection] = useState<Section>("teoria");
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [pruebaStage, setPruebaStage] = useState<PruebaStage>("intro");
  const [pruebaKey, setPruebaKey] = useState(0);
  const [result, setResult] = useState<FinalResult | null>(null);
  const [viaQr, setViaQr] = useState(false);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(0);

  const applyError = (err: unknown, fallback: string) => {
    setError(err instanceof Error ? err.message : fallback);
    setErrorStatus(err instanceof ApiError ? err.status : 0);
  };

  const refreshState = useCallback(async () => {
    const data = await apiFetch<EvalState>("/api/eval/state");
    setState(data);
    return data;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await refreshState();

        // Marcas de repaso de Teoría persistentes en el navegador
        try {
          const raw = localStorage.getItem(VISITED_KEY);
          if (raw) setVisited(new Set(JSON.parse(raw) as string[]));
        } catch {}

        const attemptActive = data.attempt?.status === "IN_PROGRESS";
        const theoryLocked = attemptActive && !data.config.allowTheoryDuringTest;

        // Soporte de acceso por código QR: /?defecto=D012&via=qr → abre la ficha en Teoría
        const params = new URLSearchParams(window.location.search);
        const qrCode = params.get("defecto");
        if (qrCode) {
          window.history.replaceState(null, "", window.location.pathname);
          if (theoryLocked) {
            // Prueba en curso sin permiso para consultar Teoría
            setViaQr(false);
            setSection("prueba");
            toast({
              title: "Teoría no disponible durante la prueba",
              description: "Finaliza la Prueba de Evaluación para poder consultar la ficha del defecto.",
              variant: "destructive",
            });
          } else {
            setViaQr(params.get("via") === "qr");
            setActiveCode(qrCode.toUpperCase());
            setSection("teoria");
            toast({
              title: "Acceso desde código QR",
              description: `Ficha del defecto ${qrCode.toUpperCase()} abierta en Teoría.`,
            });
          }
        } else if (theoryLocked) {
          // Prueba en curso con Teoría bloqueada → arrancar directamente en la prueba
          setSection("prueba");
        }
      } catch (err) {
        applyError(err, "Error al cargar el estado");
      }
    })();
  }, [refreshState, toast]);

  function markVisited(code: string) {
    setVisited((prev) => {
      if (prev.has(code)) return prev;
      const next = new Set(prev);
      next.add(code);
      try {
        localStorage.setItem(VISITED_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  function onFinished(r: FinalResult) {
    setResult(r);
    setPruebaStage("result");
    refreshState().catch(() => {});
  }

  if (!state) {
    const sessionLost = errorStatus === 401;
    if (sessionLost) {
      return (
        <div className="mx-auto max-w-md rounded-lg border border-amber-200 bg-amber-50 p-5 text-center">
          <p className="text-sm font-medium text-amber-800">
            No se ha podido establecer la sesión con el servidor.
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Vuelve a iniciar sesión para continuar.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-bb-green-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-bb-green-deep"
          >
            Volver a iniciar sesión
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-bb-green border-t-transparent" aria-label="Cargando" />
      </div>
    );
  }

  if (error && errorStatus !== 401) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  const attempt = state.attempt;
  const attemptActive = attempt?.status === "IN_PROGRESS";
  const theoryLocked = attemptActive && !state.config.allowTheoryDuringTest;

  const blockTheory = () =>
    toast({
      title: "Teoría no disponible durante la prueba",
      description: "El administrador ha desactivado el acceso a la Teoría mientras hay una Prueba de Evaluación en curso. Finalízala para poder repasar.",
      variant: "destructive",
    });

  const pill = (active: boolean) =>
    `flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
      active
        ? "bg-bb-green text-white shadow-sm"
        : "text-slate-600 hover:bg-bb-green-tint hover:text-bb-green-dark"
    }`;

  return (
    <div className="space-y-5">
      {/* Navegación de secciones: Teoría · Prueba de Evaluación */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Secciones"
          className="grid w-full max-w-md grid-cols-2 gap-1 rounded-full border border-bb-line bg-white p-1 shadow-sm"
        >
          <button
            type="button"
            role="tab"
            aria-selected={section === "teoria"}
            disabled={theoryLocked}
            title={theoryLocked ? "No disponible durante la Prueba de Evaluación" : undefined}
            onClick={() => (theoryLocked ? blockTheory() : setSection("teoria"))}
            className={`${pill(section === "teoria")} ${theoryLocked ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {theoryLocked ? (
              <Lock className="h-4 w-4" aria-hidden="true" />
            ) : (
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            )}
            Teoría
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === "prueba"}
            onClick={() => setSection("prueba")}
            className={`${pill(section === "prueba")} gap-1.5`}
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Prueba de Evaluación
            {attemptActive && (
              <Badge className="ml-1 rounded-full bg-bb-purple px-1.5 py-0 text-[10px] text-white hover:bg-bb-purple">
                En curso
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* ------------------------------- TEORÍA ------------------------------- */}
      {section === "teoria" && theoryLocked && (
        <Card className="mx-auto max-w-md text-center shadow-sm">
          <CardContent className="space-y-3 p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Teoría bloqueada durante la prueba</p>
            <p className="text-xs leading-relaxed text-slate-500">
              Hay una Prueba de Evaluación en curso y el acceso a la Teoría está desactivado.
              Finaliza la prueba para poder consultar los códigos del catálogo.
            </p>
            <Button size="sm" onClick={() => setSection("prueba")}>Ir a la Prueba de Evaluación</Button>
          </CardContent>
        </Card>
      )}

      {section === "teoria" && !theoryLocked && (
        activeCode ? (
          <DefectView
            key={activeCode}
            code={activeCode}
            onBack={() => setActiveCode(null)}
            showQuiz={!viaQr || state.config.qrEvaluation}
          />
        ) : (
          <CodeTable
            visited={visited}
            onSelectCode={(code) => {
              markVisited(code);
              setActiveCode(code);
            }}
          />
        )
      )}

      {/* -------------------------- PRUEBA DE EVALUACIÓN -------------------------- */}
      {section === "prueba" && pruebaStage === "intro" && (
        <Card className="mx-auto max-w-xl text-center shadow-lg shadow-slate-200/60">
          <CardHeader className="pb-2">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-bb-green-tint text-bb-green-dark">
              <GraduationCap className="h-7 w-7" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl">Prueba de Evaluación</CardTitle>
            <CardDescription>
              Batería de <strong>{state.config.numFinalQuestions} preguntas</strong> escogidas al azar
              sobre los 40 defectos del catálogo. Cada pregunta pertenece a un código de defecto
              distinto (no se repiten códigos) y mostrará a su lado el modelo 3D exacto del defecto
              preguntado para su inspección visual. Al terminar obtendrás tu puntuación sobre 10.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {attempt?.status === "COMPLETED" && attempt.finalScore !== null && (
              <div className="rounded-xl border border-bb-green-line bg-bb-green-tint px-4 py-3">
                <p className="text-3xl font-bold text-bb-green-dark">
                  {attempt.finalScore.toLocaleString("es-ES")}
                  <span className="text-base font-medium text-bb-green">/10</span>
                </p>
                <p className="text-xs text-bb-green">Puntuación de tu última prueba (intento nº {attempt.attemptNumber})</p>
              </div>
            )}

            {attemptActive ? (
              <>
                <div className="rounded-xl border border-bb-purple-line bg-bb-purple-tint px-4 py-3 text-left">
                  <p className="text-sm font-semibold text-bb-purple-dark">
                    Tienes una prueba en curso (intento nº {attempt!.attemptNumber})
                  </p>
                  <p className="mt-0.5 text-xs text-bb-purple">
                    {attempt!.answered} de {attempt!.total} preguntas respondidas. Puedes continuar donde la dejaste.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => {
                    setPruebaKey((k) => k + 1);
                    setPruebaStage("running");
                  }}
                  className="w-full gap-2 text-base"
                >
                  <PlayCircle className="h-5 w-5" aria-hidden="true" />
                  Continuar la prueba
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                onClick={() => {
                  setPruebaKey((k) => k + 1);
                  setPruebaStage("running");
                }}
                className="w-full gap-2 text-base"
              >
                <PlayCircle className="h-5 w-5" aria-hidden="true" />
                Comenzar la prueba
              </Button>
            )}
            <p className="text-xs leading-relaxed text-slate-400">
              {state.config.allowTheoryDuringTest
                ? "Durante la prueba podrás consultar la Teoría en cualquier momento; tu progreso queda guardado."
                : "Durante la prueba no podrás acceder a la Teoría hasta que la finalices."}
            </p>
          </CardContent>
        </Card>
      )}

      {section === "prueba" && pruebaStage === "running" && (
        <PruebaView
          key={pruebaKey}
          onFinished={onFinished}
          onExit={() => setPruebaStage("intro")}
          onStarted={() => refreshState().catch(() => {})}
        />
      )}

      {section === "prueba" && pruebaStage === "result" && result && (
        <ResultView
          result={result}
          onRepeat={() => {
            setResult(null);
            setPruebaKey((k) => k + 1);
            setPruebaStage("running");
          }}
          onHome={() => {
            setResult(null);
            setPruebaStage("intro");
            refreshState().catch(() => {});
          }}
        />
      )}
    </div>
  );
}
