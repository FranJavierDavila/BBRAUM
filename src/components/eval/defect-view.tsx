"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Viewer3DCard, SEV_STYLE, SEV_TEXT } from "./viewer-3d-card";
import { ResourceViewer } from "./resource-viewer";
import {
  ArrowLeft, CheckCircle2, XCircle, Loader2, GraduationCap, RefreshCw,
  Wrench, HeartPulse, Eye, ClipboardList, ShieldCheck, Scale, Images, Play, Sparkles,
  CircleAlert, FileText, Image as ImageIcon, Film, Volume2, Link2,
} from "lucide-react";
import {
  apiFetch, type DefectData, type DefectMediaItem, type QuizQuestion, type AnswerFeedback,
} from "@/lib/eval-types";
import { defectLabel } from "@/lib/defect-label";
import { mediaSectionShort } from "@/lib/media-sections";

/**
 * Estructura fija de la ficha: 7 apartados numerados, siempre visibles y en el
 * mismo orden (la numeración no depende de qué apartados estén completados).
 * El apartado 1 («Defecto») es la identificación y el 2 («Descripción breve del
 * defecto») se compone con description + detail. Los apartados 3-7 muestran un
 * aviso discreto mientras el administrador no haya completado su texto, pero
 * mantienen su posición, su número y los botones de sus recursos multimedia.
 * Las referencias normativas se muestran como nota al pie, fuera de los 7.
 */
const SECTIONS: Array<{
  key: "risks" | "causes" | "action" | "detection" | "prevention";
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
}> = [
  { key: "risks", label: "Riesgos para el paciente", icon: HeartPulse },
  { key: "causes", label: "Causas habituales", icon: Wrench },
  { key: "action", label: "Actuación correcta", icon: ClipboardList },
  { key: "detection", label: "Guía para su detección durante la inspección", icon: Eye },
  { key: "prevention", label: "Prevención y buenas prácticas", icon: ShieldCheck },
];

/** Cabecera numerada de un apartado de la ficha */
function SectionHeading({ n, label, icon: Icon }: {
  n: number;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bb-green text-[11px] font-bold text-white">
        {n}
      </span>
      <Icon className="h-4 w-4 shrink-0 text-bb-green-dark" aria-hidden="true" />
      {label}
    </h3>
  );
}

/** Fila de cabecera: título del apartado + botones de sus recursos multimedia */
function SectionHeadingRow({
  n, label, icon, media, onOpen,
}: {
  n: number;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  media: DefectMediaItem[];
  onOpen: (type: DefectMediaItem["type"], id?: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <SectionHeading n={n} label={label} icon={icon} />
      <SectionMediaButtons items={media} onOpen={onOpen} />
    </div>
  );
}

/** Botones compactos (un icono por tipo) para abrir los recursos enlazados a un apartado */
function SectionMediaButtons({
  items,
  onOpen,
}: {
  items: DefectMediaItem[];
  onOpen: (type: DefectMediaItem["type"], id?: string) => void;
}) {
  if (items.length === 0) return null;
  const count = (t: DefectMediaItem["type"]) => items.filter((m) => m.type === t).length;
  const btn =
    "inline-flex h-6 items-center gap-1 rounded-full border border-bb-green-line bg-white px-2 text-[11px] font-semibold text-bb-green-dark transition-colors hover:bg-bb-green-tint";

  const groups: Array<{ type: DefectMediaItem["type"]; label: string; icon: React.ReactNode }> = [];
  if (count("IMAGE") > 0) {
    const c = count("IMAGE");
    groups.push({ type: "IMAGE", label: c > 1 ? `Imágenes (${c})` : "Imagen", icon: <ImageIcon className="h-3 w-3" aria-hidden="true" /> });
  }
  if (count("VIDEO") > 0) {
    groups.push({ type: "VIDEO", label: "Vídeo", icon: <Film className="h-3 w-3" aria-hidden="true" /> });
  }
  if (count("AUDIO") > 0) {
    const c = count("AUDIO");
    groups.push({ type: "AUDIO", label: c > 1 ? `Audios (${c})` : "Audio", icon: <Volume2 className="h-3 w-3" aria-hidden="true" /> });
  }
  if (count("EMBED") > 0) {
    groups.push({ type: "EMBED", label: "Enlace", icon: <Link2 className="h-3 w-3" aria-hidden="true" /> });
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {groups.map((g) => (
        <button
          key={g.type}
          type="button"
          className={btn}
          onClick={() => onOpen(g.type)}
          title={`Ver ${g.label.toLowerCase()} de este apartado`}
        >
          {g.icon} {g.label}
        </button>
      ))}
    </span>
  );
}

/** Miniaturas clicable (una por recurso) mostradas bajo el texto del apartado */
function MediaChips({
  items,
  onOpen,
}: {
  items: DefectMediaItem[];
  onOpen: (type: DefectMediaItem["type"], id?: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onOpen(m.type, m.id)}
          title={m.caption || m.title}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-white py-0.5 pl-0.5 pr-2.5 text-xs text-slate-600 transition-colors hover:border-bb-green hover:bg-bb-green-tint/50"
        >
          {m.type === "IMAGE" ? (
            <img src={m.url} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" loading="lazy" />
          ) : (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bb-green-tint text-bb-green-dark">
              {m.type === "VIDEO" && <Film className="h-3 w-3" aria-hidden="true" />}
              {m.type === "AUDIO" && <Volume2 className="h-3 w-3" aria-hidden="true" />}
              {m.type === "EMBED" && <Link2 className="h-3 w-3" aria-hidden="true" />}
            </span>
          )}
          <span className="truncate">{m.title}</span>
        </button>
      ))}
    </div>
  );
}

/** Aviso de apartado pendiente de completar por el administrador */
function SectionPending() {
  return (
    <p className="mt-1.5 text-sm italic leading-relaxed text-slate-400">
      Apartado pendiente de completar por el administrador. Los recursos multimedia enlazados, si los
      hay, se muestran en los botones de la cabecera.
    </p>
  );
}

/** Ficha de Teoría: contenido íntegro del defecto + autoevaluación de 1 pregunta.
 *  `showQuiz=false` oculta la autoevaluación (fichas abiertas desde QR cuando el
 *  administrador ha desactivado la evaluación en los QR). */
export function DefectView({ code, onBack, showQuiz = true }: { code: string; onBack: () => void; showQuiz?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [defect, setDefect] = useState<DefectData | null>(null);
  const [viewer, setViewer] = useState<{
    items: DefectMediaItem[];
    index: number;
    section: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ defect: DefectData }>(`/api/eval/defect/${encodeURIComponent(code)}`)
      .then((data) => {
        if (cancelled) return;
        setDefect(data.defect);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Error al cargar el defecto");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !defect) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <Card>
          <CardContent className="space-y-3 p-6">
            <XCircle className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
            <p className="text-sm text-slate-600">{error || "No se pudo cargar el defecto"}</p>
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a la tabla
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defectTitle = defectLabel(defect);
  const media = defect.media ?? [];

  /** Abre el visor con el grupo de recursos del apartado indicado.
   *  Las imágenes de un mismo apartado forman carrusel; el resto se abre individual. */
  function openViewer(section: string | null, type: DefectMediaItem["type"], id?: string) {
    const pool = media.filter((m) => m.section === section);
    const group =
      type === "IMAGE"
        ? pool.filter((m) => m.type === "IMAGE")
        : pool.filter((m) => m.type === type && (!id || m.id === id));
    if (group.length === 0) return;
    const idx = Math.max(0, group.findIndex((m) => m.id === id));
    setViewer({ items: group, index: idx, section });
  }

  const bySection = (key: string | null) => media.filter((m) => m.section === key);
  const galleryMedia = bySection(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={onBack} className="gap-1.5 px-3 text-slate-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a la tabla
        </Button>
        <Badge variant="outline" className="border-bb-green-line bg-bb-green-tint text-xs text-bb-green-dark">
          Teoría · repaso libre
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Modelo 3D (el GLB asignado a este defecto) */}
        <div className="self-start lg:sticky lg:top-4">
          <Viewer3DCard src={defect.modelPath} name={defectTitle} severity={defect.severity} code={defect.code} />
        </div>

        {/* Ficha con la estructura validada de 7 apartados */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ficha del defecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Apartado 1 · Defecto (identificación) */}
            <section className="rounded-lg border bg-slate-50 p-3">
              <SectionHeadingRow n={1} label="Defecto" icon={CircleAlert} media={bySection("header")} onOpen={(t, id) => openViewer("header", t, id)} />
              <p className="mt-2 text-sm font-semibold text-slate-800">
                <span className="font-mono">{defect.code}</span> — {defectTitle}
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                Familia: {defect.category}
                <Badge variant="outline" className={`text-[11px] ${SEV_STYLE[defect.severity] || SEV_STYLE.MENOR}`}>
                  Severidad: {SEV_TEXT[defect.severity] || defect.severity}
                </Badge>
              </p>
              <MediaChips items={bySection("header")} onOpen={(t, id) => openViewer("header", t, id)} />
            </section>

            {/* Apartado 2 · Descripción breve del defecto */}
            <section className="rounded-lg border p-3">
              <SectionHeadingRow n={2} label="Descripción breve del defecto" icon={FileText} media={bySection("description")} onOpen={(t, id) => openViewer("description", t, id)} />
              <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-slate-600">
                <p>{defect.description}</p>
                {defect.detail && <p>{defect.detail}</p>}
              </div>
              <MediaChips items={bySection("description")} onOpen={(t, id) => openViewer("description", t, id)} />
            </section>

            {/* Apartados 3-7 · estructura fija, se muestren o no completados */}
            {SECTIONS.map((s, i) => {
              const sectionMedia = bySection(s.key);
              return (
                <section key={s.key} className="rounded-lg border p-3">
                  <SectionHeadingRow
                    n={i + 3}
                    label={s.label}
                    icon={s.icon}
                    media={sectionMedia}
                    onOpen={(t, id) => openViewer(s.key, t, id)}
                  />
                  {defect[s.key] ? (
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                      {defect[s.key]}
                    </p>
                  ) : (
                    <SectionPending />
                  )}
                  <MediaChips items={sectionMedia} onOpen={(t, id) => openViewer(s.key, t, id)} />
                </section>
              );
            })}

            {/* Nota al pie: referencias normativas (fuera de la estructura de 7 apartados) */}
            {defect.regulation && (
              <div className="space-y-1 px-1">
                <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
                  <Scale className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  <span>
                    Referencias normativas: {defect.regulation}
                  </span>
                </p>
                <MediaChips items={bySection("regulation")} onOpen={(t, id) => openViewer("regulation", t, id)} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Autoevaluación de Teoría: 1 pregunta aleatoria del banco del defecto */}
      {showQuiz && <QuizCard code={defect.code} defectName={defectTitle} />}

      {/* Material de apoyo sin apartado asignado (galería del pie) */}
      {galleryMedia.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Images className="h-4 w-4 text-bb-green-dark" aria-hidden="true" />
              Material de apoyo ({galleryMedia.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {galleryMedia.map((m) => (
                <MediaCard key={m.id} item={m} onOpen={() => openViewer(null, m.type, m.id)} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visor unificado de recursos (carrusel, vídeo, audio o incrustado) */}
      {viewer && (
        <ResourceViewer
          items={viewer.items}
          initialIndex={viewer.index}
          sectionLabel={mediaSectionShort(viewer.section)}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}

/* ---------------- Autoevaluación de Teoría ---------------- */

function QuizCard({ code, defectName }: { code: string; defectName: string }) {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadQuestion() {
    setLoading(true);
    setError("");
    setFeedback(null);
    setSelected("");
    try {
      const data = await apiFetch<{ question: QuizQuestion }>(
        `/api/eval/quiz/${encodeURIComponent(code)}`
      );
      setQuestion(data.question);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la pregunta");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    if (!question || !selected || submitting) return;
    setSubmitting(true);
    try {
      const data = await apiFetch<{
        isCorrect: boolean;
        correctOption: string;
        explanation: string;
      }>(`/api/eval/quiz/${encodeURIComponent(code)}/answer`, {
        method: "POST",
        body: JSON.stringify({ questionId: question.id, selected }),
      });
      setFeedback({ selected, ...data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al corregir la respuesta");
    } finally {
      setSubmitting(false);
    }
  }

  const options = question
    ? [
        { key: "A", text: question.optionA },
        { key: "B", text: question.optionB },
        { key: "C", text: question.optionC },
      ]
    : [];

  return (
    <Card className="border-bb-green-line shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <GraduationCap className="h-5 w-5 text-bb-green-dark" aria-hidden="true" />
          Pon a prueba tus conocimientos
          <Badge variant="outline" className="border-bb-green-line bg-bb-green-tint text-xs text-bb-green-dark">
            Autoevaluación · 1 pregunta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {!question && !loading && (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-slate-600">
              Comprueba cuánto has aprendido sobre <strong>{defectName}</strong>. Se te propondrá
              1 pregunta escogida al azar del banco de este defecto: si repites el repaso, puede
              tocar una pregunta distinta.
            </p>
            <Button onClick={loadQuestion} className="shrink-0 gap-2">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Comenzar autoevaluación
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 py-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-bb-green" aria-hidden="true" />
            Escogiendo una pregunta del banco…
          </div>
        )}

        {question && (
          <>
            <p className="rounded-lg border bg-slate-50 p-3 text-sm font-semibold leading-snug text-slate-800">
              {question.text}
            </p>

            <RadioGroup
              key={question.id}
              value={selected}
              onValueChange={(v) => !feedback && setSelected(v)}
              className="gap-2"
              disabled={!!feedback}
            >
              {options.map((opt) => {
                const isChosen = feedback?.selected === opt.key;
                const isCorrectOpt = feedback?.correctOption === opt.key;
                let style = "border-slate-200 hover:border-bb-green hover:bg-bb-green-tint/60";
                if (feedback && isCorrectOpt) style = "border-emerald-400 bg-emerald-50";
                else if (feedback && isChosen && !feedback.isCorrect) style = "border-red-400 bg-red-50";
                else if (feedback) style = "border-slate-200 bg-white opacity-70";

                return (
                  <Label
                    key={opt.key}
                    htmlFor={`quiz-${opt.key}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm leading-relaxed transition-colors ${style} ${
                      feedback ? "cursor-default" : ""
                    }`}
                  >
                    <RadioGroupItem value={opt.key} id={`quiz-${opt.key}`} className="mt-0.5" />
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

            {!feedback ? (
              <Button
                onClick={submitAnswer}
                disabled={!selected || submitting}
                className="w-full sm:w-auto"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Confirmar respuesta
              </Button>
            ) : (
              <div className="space-y-3">
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
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={loadQuestion} className="gap-1.5">
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Otra pregunta
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setQuestion(null);
                      setFeedback(null);
                      setSelected("");
                    }}
                    className="gap-1.5 text-slate-500"
                  >
                    Cerrar autoevaluación
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Tarjeta de material de apoyo ---------------- */

function MediaCard({
  item,
  onOpen,
}: {
  item: DefectMediaItem;
  onOpen: (item: DefectMediaItem) => void;
}) {
  return (
    <figure className="space-y-2">
      {item.type === "IMAGE" && (
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="block w-full overflow-hidden rounded-lg border transition-opacity hover:opacity-90"
          aria-label={`Ampliar imagen: ${item.title}`}
        >
          <img src={item.url} alt={item.title} className="h-44 w-full object-cover" loading="lazy" />
        </button>
      )}
      {item.type === "VIDEO" && (
        <video
          controls
          preload="metadata"
          src={item.url}
          className="aspect-video w-full rounded-lg border bg-black"
          aria-label={`Vídeo: ${item.title}`}
        />
      )}
      {item.type === "AUDIO" && (
        <div className="space-y-2 rounded-lg border border-bb-green-line bg-bb-green-tint/40 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-bb-green-dark">
            <Volume2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.title}
          </p>
          <audio
            src={item.url}
            controls
            preload="metadata"
            className="w-full"
            aria-label={`Audio: ${item.title}`}
          />
        </div>
      )}
      {item.type === "EMBED" && (
        <div className="relative">
          <iframe
            src={item.url}
            title={item.title}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="aspect-video w-full rounded-lg border"
          />
          <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium text-white">
            <Play className="mr-1 inline h-3 w-3 align-[-1px]" aria-hidden="true" />
            Contenido incrustado
          </span>
        </div>
      )}
      <figcaption className="space-y-0.5">
        <p className="text-sm font-semibold leading-snug text-slate-700">{item.title}</p>
        {item.caption && (
          <p className="text-xs leading-relaxed text-slate-500">{item.caption}</p>
        )}
      </figcaption>
    </figure>
  );
}
