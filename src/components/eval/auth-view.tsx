"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ShieldCheck, Loader2 } from "lucide-react";
import { apiFetch, type SessionUser } from "@/lib/eval-types";
import { BrandLogo } from "./brand-logo";

export function AuthView({ onLoggedIn }: { onLoggedIn: (user: SessionUser) => void }) {
  return (
    <main className="min-h-screen w-full bg-bb-paper">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-stretch overflow-hidden lg:grid-cols-[1.1fr_1fr]">
        {/* Panel corporativo verde, al estilo del hero de bbraun.es */}
        <section
          className="relative hidden flex-col justify-between gap-10 bg-bb-green p-10 text-white lg:flex"
        >
          <BrandLogo className="[&_span]:!text-white [&_span[aria-hidden]]:!bg-white [&_p.bb-wordmark-tag]:!text-white" />
          <div className="max-w-md">
            <p className="text-sm font-medium uppercase tracking-wide text-white/85">
              Lo que nos impulsa
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-snug">
              Protegemos y mejoramos la salud de las personas en todo el mundo.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/90">
              Este sistema forma parte del programa de formación en control de
              calidad: identifica los defectos de las botellas de suero mediante
              modelos 3D y pone a prueba tu criterio de inspección visual.
            </p>
            <span className="mt-6 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-bold text-bb-green-dark">
              Formación en calidad · Uso interno
            </span>
          </div>
          <p className="text-xs text-white/75">
            Departamento de Calidad · Evaluación de inspección visual
          </p>
        </section>

        {/* Zona de acceso */}
        <section className="flex flex-col items-center justify-center px-4 py-10">
          <div className="mb-6 flex w-full max-w-md flex-col items-center gap-3 text-center lg:hidden">
            <BrandLogo />
            <p className="text-sm text-bb-gray">
              Sistema de evaluación de identificación de defectos en botellas de suero.
            </p>
          </div>

          <Card className="w-full max-w-md border-bb-line shadow-[0_12px_32px_rgba(32,32,32,0.08)]">
            <Tabs defaultValue="login">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-bb-ink lg:hidden">Acceso al sistema</CardTitle>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Acceder</TabsTrigger>
                  <TabsTrigger value="register">Registrarse</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="login">
                  <LoginForm onLoggedIn={onLoggedIn} />
                </TabsContent>
                <TabsContent value="register">
                  <RegisterForm onLoggedIn={onLoggedIn} />
                </TabsContent>
              </CardContent>
              <CardFooter className="justify-center border-t border-bb-line pt-4">
                <p className="text-center text-[11px] leading-relaxed text-bb-gray">
                  Los datos de actividad se tratan conforme al RGPD y la LOPDGDD.
                </p>
              </CardFooter>
            </Tabs>
          </Card>

          <p className="mt-6 text-center text-[11px] text-bb-gray">
            © B. Braun · Entorno de formación interna
          </p>
        </section>
      </div>
    </main>
  );
}

function LoginForm({ onLoggedIn }: { onLoggedIn: (u: SessionUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      onLoggedIn(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-username">Usuario o correo</Label>
        <Input
          id="login-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="p. ej. admin"
          autoComplete="username"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Contraseña</Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Tu contraseña"
          autoComplete="current-password"
          required
        />
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        Iniciar sesión
      </Button>
      <p className="text-center text-xs text-bb-gray">
        Usuario administrador por defecto: <span className="font-mono text-bb-ink">admin / admin</span>
      </p>
    </form>
  );
}

function RegisterForm({ onLoggedIn }: { onLoggedIn: (u: SessionUser) => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<{ user: SessionUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password, consent }),
      });
      onLoggedIn(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="reg-username">Nombre de usuario</Label>
        <Input
          id="reg-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Elige un nombre de usuario"
          autoComplete="username"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-email">Correo electrónico</Label>
        <Input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@empresa.com"
          autoComplete="email"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="reg-password">Contraseña</Label>
          <Input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-confirm">Confirmar</Label>
          <Input
            id="reg-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-bb-line bg-bb-paper p-3">
        <Checkbox
          id="reg-consent"
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
          className="mt-0.5"
          required
        />
        <label htmlFor="reg-consent" className="text-xs leading-relaxed text-bb-gray">
          He leído y acepto la{" "}
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-medium text-bb-purple underline-offset-2 hover:underline"
              >
                información de protección de datos
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Protección de datos (RGPD / LOPDGDD)</DialogTitle>
                <DialogDescription>Información básica de privacidad</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm leading-relaxed text-bb-gray">
                <p>
                  <strong>Responsable:</strong> Departamento de Calidad (entorno B.BRAUN).
                  Los datos se tratan en infraestructura interna del servidor corporativo
                  y no se ceden a terceros.
                </p>
                <p>
                  <strong>Finalidad:</strong> gestión del sistema de evaluación de inspección
                  visual: identificación del evaluado, registro de intentos, respuestas,
                  puntuaciones y generación de informes de formación.
                </p>
                <p>
                  <strong>Datos tratados:</strong> nombre de usuario, correo electrónico,
                  contraseña (almacenada cifrada), fecha de alta y actividad de evaluación
                  (intentos, respuestas, aciertos/fallos y puntuaciones).
                </p>
                <p>
                  <strong>Base jurídica:</strong> consentimiento del interesado y aplicación
                  de medidas de formación en calidad dentro de la relación laboral/corporativa.
                </p>
                <p>
                  <strong>Conservación:</strong> los datos se conservarán mientras exista la
                  relación con el sistema de evaluación y posteriormente durante los plazos
                  legales aplicables en materia de calidad y formación.
                </p>
                <p>
                  <strong>Derechos:</strong> puedes ejercer derechos de acceso, rectificación,
                  supresión, oposición, limitación y portabilidad dirigiéndote al administrador
                  del sistema o al responsable de protección de datos.
                </p>
              </div>
            </DialogContent>
          </Dialog>{" "}
          y consiento el tratamiento de mis datos para la gestión de esta evaluación.
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading || !consent}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        Crear cuenta
      </Button>
    </form>
  );
}
