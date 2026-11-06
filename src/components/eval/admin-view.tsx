"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Loader2, Save, Download, Search, KeyRound, Settings2, Users, BookOpenCheck,
  Boxes, Image as ImageIcon, Link2, Trash2, Upload, Film, QrCode, Printer, FileSpreadsheet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, type SessionUser } from "@/lib/eval-types";

type RecordsRow = {
  username: string;
  email: string;
  attemptNumber: number;
  startedAt: string;
  defectCode: string;
  defectName: string;
  isCorrect: boolean | null;
  finalScore: number | null;
  finishedAt: string | null;
  status: string;
};

type UserInfo = {
  username: string;
  email: string;
  role: string;
  createdAt: string;
  attempts: number;
};

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

type ModelInfo = { path: string; name: string };

type AdminDefectSummary = {
  code: string;
  name: string;
  category: string;
  severity: string;
  modelPath: string;
  description: string;
  detail: string;
  hasContent: boolean;
  mediaCount: number;
  causes: string | null;
  risks: string | null;
  detection: string | null;
  action: string | null;
  prevention: string | null;
  regulation: string | null;
};

type AdminMedia = {
  id: string;
  type: "IMAGE" | "VIDEO" | "EMBED";
  url: string;
  title: string;
  caption: string | null;
  createdAt?: string;
};

/** Subida multipart (no usa apiFetch para no forzar Content-Type JSON) */
async function postForm<T>(url: string, form: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body: form, cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(data.error || "Error de comunicación con el servidor");
  }
  return data;
}

export function AdminView({ onUsernameChanged }: { onUsernameChanged: (u: string) => void }) {
  return (
    <Tabs defaultValue="config" className="space-y-4">
      <TabsList className="grid w-full max-w-3xl grid-cols-5">
        <TabsTrigger value="config" className="gap-1.5">
          <Settings2 className="h-4 w-4" aria-hidden="true" /> Configuración
        </TabsTrigger>
        <TabsTrigger value="records" className="gap-1.5">
          <Users className="h-4 w-4" aria-hidden="true" /> Registros
        </TabsTrigger>
        <TabsTrigger value="contents" className="gap-1.5">
          <BookOpenCheck className="h-4 w-4" aria-hidden="true" /> Contenidos
        </TabsTrigger>
        <TabsTrigger value="qr" className="gap-1.5">
          <QrCode className="h-4 w-4" aria-hidden="true" /> Códigos QR
        </TabsTrigger>
        <TabsTrigger value="creds" className="gap-1.5">
          <KeyRound className="h-4 w-4" aria-hidden="true" /> Credenciales
        </TabsTrigger>
      </TabsList>
      <TabsContent value="config"><ConfigTab /></TabsContent>
      <TabsContent value="records"><RecordsTab /></TabsContent>
      <TabsContent value="contents"><ContentsTab /></TabsContent>
      <TabsContent value="qr"><QrTab /></TabsContent>
      <TabsContent value="creds"><CredentialsTab onUsernameChanged={onUsernameChanged} /></TabsContent>
    </Tabs>
  );
}

/* ---------------- Configuración ---------------- */

function ConfigTab() {
  const { toast } = useToast();
  const [numFinalQuestions, setNumFinalQuestions] = useState<number>(10);
  const [allowTheory, setAllowTheory] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ numFinalQuestions: number; allowTheoryDuringTest: boolean }>("/api/admin/config")
      .then((c) => {
        setNumFinalQuestions(c.numFinalQuestions);
        setAllowTheory(c.allowTheoryDuringTest);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      await apiFetch("/api/admin/config", {
        method: "PUT",
        body: JSON.stringify({ numFinalQuestions, allowTheoryDuringTest: allowTheory }),
      });
      toast({
        title: "Configuración guardada",
        description: `Cada Prueba de Evaluación tendrá ${numFinalQuestions} preguntas (1 por código de defecto). Teoría durante la prueba: ${allowTheory ? "permitida" : "bloqueada"}.`,
      });
    } catch (err) {
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-bb-green" /></div>;
  }

  return (
    <Card className="max-w-xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Parámetros de la Prueba de Evaluación</CardTitle>
        <CardDescription>
          Define cuántas preguntas tendrá cada Prueba de Evaluación. Cada pregunta
          corresponde a un código de defecto distinto, escogido al azar entre los 40
          disponibles; los códigos no se repiten dentro de una misma prueba.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="cfg-final">Número de preguntas de test final</Label>
          <div className="flex items-center gap-3">
            <input
              id="cfg-final"
              type="range"
              min={1}
              max={40}
              value={numFinalQuestions}
              onChange={(e) => setNumFinalQuestions(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-bb-green"
              aria-label="Número de preguntas de test final"
            />
            <span className="w-14 rounded-md border px-2 py-1 text-center text-sm font-semibold tabular-nums text-slate-700">
              {numFinalQuestions}
            </span>
          </div>
          <p className="text-xs text-slate-400">Entre 1 y 40 preguntas: cada una de un código distinto, elegido al azar sobre el catálogo completo. Junto a cada pregunta se muestra el modelo 3D del defecto preguntado.</p>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-bb-line bg-white p-4">
          <div className="space-y-1">
            <Label htmlFor="cfg-theory" className="font-medium">Permitir consultar la Teoría durante la prueba</Label>
            <p className="text-xs leading-relaxed text-slate-400">
              Si lo activas, el usuario podrá salir de la Prueba de Evaluación para repasar la Teoría
              y volver (su progreso queda guardado). Si lo desactivas, el acceso a la Teoría quedará
              bloqueado —con un candado— hasta que finalice la prueba.
            </p>
          </div>
          <Switch
            id="cfg-theory"
            checked={allowTheory}
            onCheckedChange={setAllowTheory}
            className="mt-1 shrink-0"
            aria-label="Permitir consultar la Teoría durante la prueba"
          />
        </div>

        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Guardar configuración
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------------- Códigos QR ---------------- */

function QrTab() {
  const { toast } = useToast();
  const [defects, setDefects] = useState<AdminDefectSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [qrEvaluation, setQrEvaluation] = useState(true);
  const [qrBaseUrl, setQrBaseUrl] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<{ defects: AdminDefectSummary[] }>("/api/admin/defect-content"),
      apiFetch<{ qrEvaluation: boolean; qrBaseUrl: string }>("/api/admin/config"),
    ])
      .then(([d, c]) => {
        setDefects(d.defects);
        setSelected(new Set(d.defects.map((x) => x.code)));
        setQrEvaluation(c.qrEvaluation);
        setQrBaseUrl(c.qrBaseUrl || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      await apiFetch("/api/admin/config", {
        method: "PUT",
        body: JSON.stringify({ qrEvaluation, qrBaseUrl }),
      });
      toast({
        title: "Configuración QR guardada",
        description: `Autoevaluación en fichas QR: ${qrEvaluation ? "activada" : "desactivada"}.`,
      });
    } catch (err) {
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return defects.filter((d) => !s || d.code.toLowerCase().includes(s) || d.name.toLowerCase().includes(s));
  }, [defects, search]);

  const allSelected = filtered.length > 0 && filtered.every((d) => selected.has(d.code));

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function selectAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((d) => next.add(d.code));
      return next;
    });
  }

  function selectNone() {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((d) => next.delete(d.code));
      return next;
    });
  }

  function codesQuery(): string {
    const codes = defects.filter((d) => selected.has(d.code)).map((d) => d.code);
    if (codes.length === 0 || codes.length === defects.length) return "all";
    return codes.join(",");
  }

  function downloadZip() {
    if (selected.size === 0) {
      toast({ title: "Selecciona al menos un defecto", variant: "destructive" });
      return;
    }
    window.open(`/api/admin/qr/zip?codes=${encodeURIComponent(codesQuery())}`, "_blank");
  }

  function printLabels() {
    if (selected.size === 0) {
      toast({ title: "Selecciona al menos un defecto", variant: "destructive" });
      return;
    }
    window.open(`/api/admin/qr/labels?codes=${encodeURIComponent(codesQuery())}`, "_blank");
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-bb-green" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Configuración de los QR */}
      <Card className="max-w-3xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Destino y comportamiento de los QR</CardTitle>
          <CardDescription>
            Cada QR apunta a la URL pública fija del defecto. Si no indicas una URL base, se usa el
            dominio con el que se accede a la aplicación ({typeof window !== "undefined" ? window.location.origin : ""}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qr-base">URL base para los QR (opcional)</Label>
            <Input
              id="qr-base"
              value={qrBaseUrl}
              onChange={(e) => setQrBaseUrl(e.target.value)}
              placeholder="https://evaluacion.tuempresa.local — vacío = dominio actual"
              className="max-w-xl"
              autoComplete="url"
            />
            <p className="text-xs text-slate-400">
              Útil si el expositor se escanea desde la red interna con un dominio fijo. Los QR se
              generan como <span className="font-mono">{"{base}"}/?defecto=DXXX&via=qr</span>.
            </p>
          </div>
          <div className="flex items-start justify-between gap-4 rounded-lg border border-bb-line bg-white p-4">
            <div className="space-y-1">
              <Label htmlFor="qr-eval" className="font-medium">Autoevaluación en las fichas abiertas desde QR</Label>
              <p className="text-xs leading-relaxed text-slate-400">
                Si lo desactivas, cuando alguien escanee un QR verá la ficha del defecto sin la tarjeta
                de autoevaluación. La herramienta interna mantiene siempre la evaluación completa.
              </p>
            </div>
            <Switch
              id="qr-eval"
              checked={qrEvaluation}
              onCheckedChange={setQrEvaluation}
              className="mt-1 shrink-0"
              aria-label="Autoevaluación en fichas abiertas desde QR"
            />
          </div>
          <Button onClick={saveSettings} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Guardar ajustes QR
          </Button>
        </CardContent>
      </Card>

      {/* Generación de etiquetas */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Etiquetas para el expositor físico ({selected.size} de {defects.length} seleccionadas)</CardTitle>
              <CardDescription>
                Descarga el ZIP con las imágenes QR y una hoja de etiquetas lista para imprimir (A4),
                o imprime directamente desde el navegador.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar código o nombre…"
                  className="h-9 w-48 pl-8"
                  aria-label="Buscar defecto"
                />
              </div>
              <Button variant="outline" size="sm" onClick={allSelected ? selectNone : selectAll} className="gap-1.5">
                {allSelected ? "Quitar selección" : "Seleccionar todos"}
              </Button>
              <Button variant="outline" size="sm" onClick={printLabels} className="gap-1.5">
                <Printer className="h-4 w-4" aria-hidden="true" /> Imprimir etiquetas
              </Button>
              <Button size="sm" onClick={downloadZip} className="gap-1.5">
                <Download className="h-4 w-4" aria-hidden="true" /> Descargar ZIP
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-20">Código</TableHead>
                  <TableHead>Defecto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="w-24 text-center">QR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.code}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.has(d.code)}
                        onChange={() => toggle(d.code)}
                        className="h-4 w-4 cursor-pointer accent-bb-green"
                        aria-label={`Seleccionar ${d.code}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-700">{d.code}</TableCell>
                    <TableCell className="max-w-72 truncate text-sm text-slate-700" title={d.name}>{d.name}</TableCell>
                    <TableCell className="text-xs text-slate-500">{d.category}</TableCell>
                    <TableCell className="text-center">
                      <a
                        href={`/api/admin/qr/${d.code}?size=512`}
                        download={`qrcode-${d.code}.png`}
                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold text-bb-green-dark transition-colors hover:bg-bb-green-tint"
                        title={`Descargar QR de ${d.code} (PNG 512 px)`}
                      >
                        <QrCode className="h-3.5 w-3.5" aria-hidden="true" /> PNG
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-400">
                      Ningún defecto coincide con la búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Registros ---------------- */

function RecordsTab() {
  const [rows, setRows] = useState<RecordsRow[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch<{ rows: RecordsRow[]; users: UserInfo[] }>("/api/admin/records")
      .then((d) => {
        setRows(d.rows);
        setUsers(d.users);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          !search ||
          r.username.toLowerCase().includes(search.toLowerCase()) ||
          r.defectCode.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  );

  function exportCsv() {
    const header = [
      "Usuario", "Intento", "Inicio del test", "Codigo", "Defecto",
      "Resultado", "Puntuacion final", "Fin del test", "Estado",
    ];
    const lines = filtered.map((r) =>
      [
        r.username, r.attemptNumber, fmt(r.startedAt), r.defectCode,
        `"${r.defectName.replace(/"/g, "'")}"`,
        r.isCorrect === null ? "Sin responder" : r.isCorrect ? "Acierto" : "Fallo",
        r.finalScore ?? "", fmt(r.finishedAt), r.status,
      ].join(";")
    );
    const csv = "\uFEFF" + [header.join(";"), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registros-evaluacion-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-bb-green" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Resumen de usuarios */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Usuarios registrados ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
            {users.map((u) => (
              <Badge key={u.email} variant="outline" className="gap-1.5 px-2.5 py-1 text-xs">
                <span className="font-semibold text-slate-700">{u.username}</span>
                <span className="text-slate-400">{u.email}</span>
                <span className="rounded bg-slate-100 px-1 text-slate-500">{u.attempts} intentos</span>
                {u.role === "ADMIN" && (
                  <span className="rounded bg-bb-purple-tint px-1 text-bb-purple">admin</span>
                )}
              </Badge>
            ))}
            {users.length === 0 && <p className="text-sm text-slate-400">Todavía no hay usuarios registrados.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de actividad */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Registro de actividad ({filtered.length} respuestas)</CardTitle>
              <CardDescription>
                Usuario, intento, inicio, código de defecto, acierto/fallo, puntuación final y fin del test
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar por usuario o código…"
                  className="h-9 w-52 pl-8"
                  aria-label="Filtrar registros"
                />
              </div>
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0} className="gap-1.5">
                <Download className="h-4 w-4" aria-hidden="true" /> CSV
              </Button>
              <a
                href="/api/admin/records/export"
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border bg-white px-3 text-sm font-semibold text-bb-green-dark transition-colors hover:bg-bb-green-tint ${
                  rows.length === 0 ? "pointer-events-none opacity-50" : ""
                }`}
                title="Descargar libro Excel con todos los registros (detalle, resumen por intento y usuarios)"
                aria-label="Exportar registros a Excel"
              >
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" /> Excel
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[28rem] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-center">Intento</TableHead>
                  <TableHead>Inicio test</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Defecto</TableHead>
                  <TableHead className="text-center">Resultado</TableHead>
                  <TableHead className="text-center">Puntuación</TableHead>
                  <TableHead>Fin test</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-slate-800">{r.username}</TableCell>
                    <TableCell className="text-center tabular-nums">{r.attemptNumber}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-slate-500">{fmt(r.startedAt)}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-700">{r.defectCode}</TableCell>
                    <TableCell className="max-w-52 truncate text-xs text-slate-600" title={r.defectName}>
                      {r.defectName}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.isCorrect === null ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : r.isCorrect ? (
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Acierto</Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white hover:bg-red-500">Fallo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold tabular-nums text-slate-700">
                      {r.finalScore !== null ? `${r.finalScore}/10` : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-slate-500">{fmt(r.finishedAt)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-slate-400">
                      No hay registros de actividad todavía.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Credenciales ---------------- */

function CredentialsTab({ onUsernameChanged }: { onUsernameChanged: (u: string) => void }) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await apiFetch<{ username: string }>("/api/admin/credentials", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newUsername, newPassword }),
      });
      toast({
        title: "Credenciales actualizadas",
        description: `Los nuevos datos de acceso ya están activos (usuario: ${data.username})`,
      });
      onUsernameChanged(data.username);
      setCurrentPassword("");
      setNewUsername("");
      setNewPassword("");
    } catch (err) {
      toast({
        title: "Error al actualizar credenciales",
        description: err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Cambio de credenciales de administrador</CardTitle>
        <CardDescription>
          Introduce tu contraseña actual y los nuevos valores que desees. Puedes cambiar solo
          el usuario, solo la contraseña, o ambos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cred-current">Contraseña actual</Label>
            <Input
              id="cred-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cred-user">Nuevo nombre de usuario</Label>
              <Input
                id="cred-user"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="(sin cambios)"
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cred-pass">Nueva contraseña</Label>
              <Input
                id="cred-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="(sin cambios)"
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Actualizar credenciales
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ---------------- Contenidos teóricos ---------------- */

type ContentFieldKey =
  | "description" | "detail" | "causes" | "risks"
  | "detection" | "action" | "prevention" | "regulation";

const CONTENT_FIELDS: Array<{ key: ContentFieldKey; label: string; hint: string; rows: number }> = [
  { key: "description", label: "Apartado 2 · Descripción breve del defecto", hint: "Qué es el defecto en una o dos frases (el apartado 1 «Defecto» se compone solo con el código, el nombre y la familia)", rows: 3 },
  { key: "detail", label: "Complemento de la descripción (hallazgo típico)", hint: "Cómo se manifiesta en la unidad inspeccionada; se muestra a continuación de la descripción breve, dentro del apartado 2", rows: 3 },
  { key: "risks", label: "Apartado 3 · Riesgos para el paciente", hint: "Consecuencias clínicas potenciales y criticidad asociada", rows: 4 },
  { key: "causes", label: "Apartado 4 · Causas habituales", hint: "Orígenes frecuentes: proceso, material, manipulación, logística…", rows: 4 },
  { key: "action", label: "Apartado 5 · Actuación correcta", hint: "Qué debe hacer el inspector: segregación, registro, avisos", rows: 4 },
  { key: "detection", label: "Apartado 6 · Guía para su detección durante la inspección", hint: "Cómo identificarlo durante la inspección visual (técnica y patrones)", rows: 4 },
  { key: "prevention", label: "Apartado 7 · Prevención y buenas prácticas", hint: "Medidas de proceso que evitan la reaparición", rows: 3 },
  { key: "regulation", label: "Nota al pie · Referencias normativas", hint: "Farmacopeas, normas ISO y GMP aplicables; se muestra como nota al pie de la ficha, fuera de los 7 apartados", rows: 2 },
];

const EMPTY_FORM: Record<ContentFieldKey, string> = {
  description: "", detail: "", causes: "", risks: "",
  detection: "", action: "", prevention: "", regulation: "",
};

function ContentsTab() {
  const { toast } = useToast();
  const [defects, setDefects] = useState<AdminDefectSummary[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [form, setForm] = useState<Record<ContentFieldKey, string>>(EMPTY_FORM);
  const [modelPath, setModelPath] = useState<string>("");
  const [media, setMedia] = useState<AdminMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);

  // Alta de material
  const [newType, setNewType] = useState<"IMAGE" | "VIDEO" | "EMBED">("IMAGE");
  const [newTitle, setNewTitle] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addingMedia, setAddingMedia] = useState(false);
  const mediaFileRef = useRef<HTMLInputElement>(null);
  const modelFileRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => defects.find((d) => d.code === selectedCode) ?? null,
    [defects, selectedCode]
  );
  // Ref para leer la lista actual dentro de efectos sin resetear el formulario
  const defectsRef = useRef(defects);
  defectsRef.current = defects;

  async function refreshDefects() {
    const data = await apiFetch<{ defects: AdminDefectSummary[] }>("/api/admin/defect-content");
    setDefects(data.defects);
    return data.defects;
  }

  useEffect(() => {
    Promise.all([
      refreshDefects(),
      apiFetch<{ models: ModelInfo[] }>("/api/admin/models"),
    ])
      .then(([d, m]) => {
        setModels(m.models);
        if (d.length > 0) setSelectedCode((prev) => prev || d[0].code);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Al cambiar el defecto seleccionado: rellenar plantilla + cargar material
  useEffect(() => {
    if (!selectedCode) return;
    const d = defectsRef.current.find((x) => x.code === selectedCode);
    if (d) {
      setForm({
        description: d.description ?? "",
        detail: d.detail ?? "",
        causes: d.causes ?? "",
        risks: d.risks ?? "",
        detection: d.detection ?? "",
        action: d.action ?? "",
        prevention: d.prevention ?? "",
        regulation: d.regulation ?? "",
      });
      setModelPath(d.modelPath);
    }
    apiFetch<{ media: AdminMedia[] }>(`/api/admin/media?code=${encodeURIComponent(selectedCode)}`)
      .then((data) => setMedia(data.media))
      .catch(() => setMedia([]));
  }, [selectedCode]);

  async function saveContent() {
    if (!selectedCode) return;
    setSaving(true);
    try {
      await apiFetch("/api/admin/defect-content", {
        method: "PUT",
        body: JSON.stringify({ code: selectedCode, ...form, modelPath }),
      });
      await refreshDefects();
      toast({
        title: "Contenido guardado",
        description: `La ficha teórica de ${selectedCode} se ha actualizado`,
      });
    } catch (err) {
      toast({
        title: "Error al guardar el contenido",
        description: err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function uploadModel(file: File) {
    if (!selectedCode) return;
    setUploadingModel(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const data = await postForm<{ model: ModelInfo }>("/api/admin/models", fd);
      const list = await apiFetch<{ models: ModelInfo[] }>("/api/admin/models");
      setModels(list.models);
      setModelPath(data.model.path);
      await apiFetch("/api/admin/defect-content", {
        method: "PUT",
        body: JSON.stringify({ code: selectedCode, modelPath: data.model.path }),
      });
      await refreshDefects();
      toast({
        title: "Modelo 3D asignado",
        description: `${data.model.name} se ha subido y asignado a ${selectedCode}`,
      });
    } catch (err) {
      toast({
        title: "Error al subir el modelo",
        description: err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      });
    } finally {
      setUploadingModel(false);
    }
  }

  async function addMedia() {
    if (!selectedCode || !newTitle.trim()) {
      toast({
        title: "Falta información",
        description: "Indica al menos el título del material",
        variant: "destructive",
      });
      return;
    }
    if (newType === "EMBED" && !/^https?:\/\//i.test(newUrl.trim())) {
      toast({
        title: "URL no válida",
        description: "El enlace incrustado debe comenzar por http:// o https://",
        variant: "destructive",
      });
      return;
    }
    if (newType !== "EMBED") {
      const file = mediaFileRef.current?.files?.[0];
      if (!file) {
        toast({
          title: "Falta el archivo",
          description: "Selecciona el archivo de imagen o vídeo que deseas subir",
          variant: "destructive",
        });
        return;
      }
    }
    setAddingMedia(true);
    try {
      const fd = new FormData();
      fd.append("code", selectedCode);
      fd.append("type", newType);
      fd.append("title", newTitle.trim());
      if (newCaption.trim()) fd.append("caption", newCaption.trim());
      if (newType === "EMBED") fd.append("url", newUrl.trim());
      else fd.append("file", mediaFileRef.current!.files![0]);
      await postForm("/api/admin/media", fd);
      const data = await apiFetch<{ media: AdminMedia[] }>(
        `/api/admin/media?code=${encodeURIComponent(selectedCode)}`
      );
      setMedia(data.media);
      await refreshDefects();
      setNewTitle("");
      setNewCaption("");
      setNewUrl("");
      if (mediaFileRef.current) mediaFileRef.current.value = "";
      toast({ title: "Material añadido", description: "Ya está disponible en la ficha del defecto" });
    } catch (err) {
      toast({
        title: "Error al añadir el material",
        description: err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      });
    } finally {
      setAddingMedia(false);
    }
  }

  async function deleteMedia(id: string) {
    try {
      await apiFetch(`/api/admin/media/${id}`, { method: "DELETE" });
      const data = await apiFetch<{ media: AdminMedia[] }>(
        `/api/admin/media?code=${encodeURIComponent(selectedCode)}`
      );
      setMedia(data.media);
      await refreshDefects();
      toast({ title: "Material eliminado" });
    } catch (err) {
      toast({
        title: "Error al eliminar",
        description: err instanceof Error ? err.message : "Error inesperado",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-bb-green" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Selector de defecto */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Código de defecto</CardTitle>
          <CardDescription>
            Selecciona el código cuya ficha teórica deseas editar. Los cambios se publican al instante para los evaluadores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCode} onValueChange={setSelectedCode}>
            <SelectTrigger className="w-full sm:max-w-md" aria-label="Seleccionar código de defecto">
              <SelectValue placeholder="Selecciona un código…" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {defects.map((d) => (
                <SelectItem key={d.code} value={d.code}>
                  <span className="font-mono font-semibold">{d.code}</span>
                  <span className="ml-2 text-slate-600">{d.name}</span>
                  {d.mediaCount > 0 && (
                    <span className="ml-2 rounded bg-bb-green-tint px-1 text-[10px] text-bb-green-dark">
                      {d.mediaCount} media
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selected && (
        <>
          {/* Plantilla de contenidos */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Plantilla de contenido — <span className="font-mono">{selected.code}</span> {selected.name}
              </CardTitle>
              <CardDescription>
                Estructura validada de 7 apartados: 1 · Defecto (código, nombre y familia), 2 · Descripción
                breve del defecto, 3 · Riesgos para el paciente, 4 · Causas habituales, 5 · Actuación
                correcta, 6 · Guía para su detección durante la inspección y 7 · Prevención y buenas
                prácticas. Deja en blanco las secciones que no quieras mostrar (salvo descripción y detalle,
                obligatorios).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {CONTENT_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={`cnt-${f.key}`}>{f.label}</Label>
                  <Textarea
                    id={`cnt-${f.key}`}
                    rows={f.rows}
                    value={form[f.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.hint}
                    className="resize-y"
                  />
                  <p className="text-xs text-slate-400">{f.hint}</p>
                </div>
              ))}

              {/* Modelo 3D del defecto */}
              <div className="space-y-1.5 rounded-lg border bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="cnt-model" className="gap-1.5">
                    <Boxes className="h-4 w-4 text-bb-green-dark" aria-hidden="true" /> Modelo 3D (GLB)
                  </Label>
                  <input
                    ref={modelFileRef}
                    type="file"
                    accept=".glb"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadModel(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={uploadingModel}
                    onClick={() => modelFileRef.current?.click()}
                  >
                    {uploadingModel ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Upload className="h-4 w-4" aria-hidden="true" />
                    )}
                    Subir .glb
                  </Button>
                </div>
                <Select value={modelPath} onValueChange={setModelPath}>
                  <SelectTrigger id="cnt-model" className="w-full sm:max-w-md" aria-label="Modelo 3D asignado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {models.map((m) => (
                      <SelectItem key={m.path} value={m.path}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  Elige un modelo ya servido o sube un nuevo archivo .glb (máx. 32 MB). Al subirlo se asigna y guarda automáticamente.
                </p>
              </div>

              <Button onClick={saveContent} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                Guardar contenido
              </Button>
            </CardContent>
          </Card>

          {/* Material de apoyo */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Material de apoyo ({media.length})
              </CardTitle>
              <CardDescription>
                Imágenes, vídeos o contenidos incrustados que acompañan a la ficha de {selected.code}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lista existente */}
              <div className="space-y-2">
                {media.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border p-2">
                    {m.type === "IMAGE" && (
                      <img src={m.url} alt={m.title} className="h-14 w-24 shrink-0 rounded border object-cover" loading="lazy" />
                    )}
                    {m.type === "VIDEO" && (
                      <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded border bg-slate-900 text-white">
                        <Film className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                    {m.type === "EMBED" && (
                      <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded border bg-bb-purple-tint text-bb-purple-dark">
                        <Link2 className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{m.title}</p>
                      {m.caption && <p className="truncate text-xs text-slate-400">{m.caption}</p>}
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {m.type === "IMAGE" ? "Imagen" : m.type === "VIDEO" ? "Vídeo" : "Incrustado"}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-red-600"
                      onClick={() => deleteMedia(m.id)}
                      aria-label={`Eliminar ${m.title}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
                {media.length === 0 && (
                  <p className="rounded-lg border border-dashed p-3 text-center text-sm text-slate-400">
                    Este defecto todavía no tiene material de apoyo.
                  </p>
                )}
              </div>

              {/* Alta de nuevo material */}
              <div className="space-y-3 rounded-lg border bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-700">Añadir material</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="med-type">Tipo</Label>
                    <Select value={newType} onValueChange={(v) => setNewType(v as typeof newType)}>
                      <SelectTrigger id="med-type" aria-label="Tipo de material">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IMAGE"><span className="inline-flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" aria-hidden="true" /> Imagen</span></SelectItem>
                        <SelectItem value="VIDEO"><span className="inline-flex items-center gap-1.5"><Film className="h-3.5 w-3.5" aria-hidden="true" /> Vídeo</span></SelectItem>
                        <SelectItem value="EMBED"><span className="inline-flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" aria-hidden="true" /> Enlace incrustado</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="med-title">Título</Label>
                    <Input
                      id="med-title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ej.: Inspección a contra luz"
                      maxLength={200}
                    />
                  </div>
                </div>
                {newType === "EMBED" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="med-url">URL del contenido</Label>
                    <Input
                      id="med-url"
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://… (enlace de reproductor incrustable)"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="med-file">
                      Archivo {newType === "IMAGE" ? "de imagen (máx. 8 MB)" : "de vídeo (máx. 64 MB)"}
                    </Label>
                    <input
                      ref={mediaFileRef}
                      id="med-file"
                      type="file"
                      accept={newType === "IMAGE" ? "image/*" : "video/*"}
                      className="w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-bb-green-dark file:px-3 file:py-1 file:text-sm file:font-semibold file:text-white"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="med-caption">Pie o descripción (opcional)</Label>
                  <Input
                    id="med-caption"
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    placeholder="Texto explicativo que aparece bajo el material"
                    maxLength={500}
                  />
                </div>
                <Button onClick={addMedia} disabled={addingMedia} className="gap-2">
                  {addingMedia && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  Añadir material
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
