"use client";

import { useEffect, useState } from "react";
import { AuthView } from "@/components/eval/auth-view";
import { AppHeader } from "@/components/eval/app-header";
import { EvalView } from "@/components/eval/eval-view";
import { AdminView } from "@/components/eval/admin-view";
import { apiFetch, type SessionUser } from "@/lib/eval-types";
import { BrandLogo } from "@/components/eval/brand-logo";

export default function Page() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ user: SessionUser | null }>("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bb-paper">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-bb-green border-t-transparent"
          role="status"
          aria-label="Cargando aplicación"
        />
      </div>
    );
  }

  if (!user) {
    return <AuthView onLoggedIn={setUser} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-bb-paper">
      <AppHeader user={user} onLogout={logout} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {user.role === "ADMIN" ? (
          <AdminView onUsernameChanged={(u) => setUser({ ...user, username: u })} />
        ) : (
          <EvalView />
        )}
      </main>
      <footer className="mt-auto border-t border-bb-line bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-8">
          <BrandLogo compact />
          <nav
            aria-label="Enlaces legales"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-bb-gray"
          >
            <span>Protección de datos (RGPD / LOPDGDD)</span>
            <span aria-hidden="true" className="h-3 w-px bg-bb-line" />
            <span>Aviso legal y condiciones de uso</span>
            <span aria-hidden="true" className="h-3 w-px bg-bb-line" />
            <span>Uso interno · Departamento de Calidad</span>
          </nav>
          <p className="max-w-2xl text-center text-[11px] leading-relaxed text-bb-gray/80">
            Sistema de Evaluación de Inspección Visual de defectos en botellas de
            suero. Los datos de actividad se tratan conforme al RGPD y la LOPDGDD
            en infraestructura interna corporativa.
          </p>
          <p className="text-[11px] text-bb-gray/80">Copyright © B. Braun · Uso interno</p>
        </div>
      </footer>
    </div>
  );
}
