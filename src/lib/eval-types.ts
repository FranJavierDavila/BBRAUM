export type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
};

export type EvalConfigInfo = {
  numFinalQuestions: number;
  /** El administrador permite salir a consultar la Teoría durante una prueba en curso */
  allowTheoryDuringTest: boolean;
  /** Las fichas abiertas desde un código QR incluyen autoevaluación */
  qrEvaluation: boolean;
};

export type AttemptInfo = {
  id: string;
  attemptNumber: number;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  finalScore: number | null;
  /** Nº total de preguntas de la prueba y nº ya respondidas */
  total: number;
  answered: number;
};

export type EvalState = {
  config: EvalConfigInfo;
  attempt: AttemptInfo | null;
};

export type DefectMediaItem = {
  id: string;
  type: "IMAGE" | "VIDEO" | "EMBED" | "AUDIO";
  url: string;
  title: string;
  caption: string | null;
  /** Apartado de la ficha donde se muestra (header/description/risks/causes/action/detection/prevention/regulation); null = galería del pie */
  section: string | null;
};

export type DefectData = {
  code: string;
  name: string;
  /** Nombre de visualización opcional; si viene, se muestra en lugar de `name` */
  displayName?: string | null;
  category: string;
  description: string;
  detail: string;
  severity: string;
  modelPath: string;
  causes?: string | null;
  risks?: string | null;
  detection?: string | null;
  action?: string | null;
  prevention?: string | null;
  regulation?: string | null;
  media?: DefectMediaItem[];
};

export type QuestionData = {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
};

export type AnswerFeedback = {
  selected: string;
  isCorrect: boolean;
  correctOption: string;
  explanation: string;
};

/** Pregunta de autoevaluación de Teoría (1 por código, aleatoria del banco del defecto) */
export type QuizQuestion = QuestionData;

/** Pregunta de la Prueba de Evaluación (incluye el modelo 3D del defecto preguntado) */
export type PruebaQuestion = {
  id: string;
  orderIndex: number;
  selected: string | null;
  answeredAt: string | null;
  defectCode: string;
  defectName: string;
  defectDisplayName?: string | null;
  defectSeverity: string;
  modelPath: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
};

export type FinalResultDetail = {
  orderIndex: number;
  defectCode: string;
  defectName: string;
  defectDisplayName?: string | null;
  isCorrect: boolean;
  selected: string | null;
  correctOption: string;
  explanation: string;
};

export type FinalResult = {
  score: number;
  correct: number;
  total: number;
  detail: FinalResultDetail[];
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { error?: string }).error ||
      (res.status === 401
        ? "La sesión no es válida o ha expirado. Vuelve a iniciar sesión."
        : "Error de comunicación con el servidor");
    throw new ApiError(message, res.status);
  }
  return data as T;
}
