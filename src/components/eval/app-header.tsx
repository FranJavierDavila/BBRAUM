"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import type { SessionUser } from "@/lib/eval-types";

export function AppHeader({
  user,
  onLogout,
}: {
  user: SessionUser;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_0_#e6e6e6]">
      {/* Franja superior off-white como en bbraun.es */}
      <div className="bb-topstrip h-2 w-full" aria-hidden="true" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <BrandLogo compact />
          <span
            aria-hidden="true"
            className="hidden h-9 w-px bg-bb-line sm:inline-block"
          />
          <div className="hidden min-w-0 leading-tight sm:block">
            <h1 className="truncate text-sm font-semibold text-bb-ink">
              Evaluación de Inspección Visual
            </h1>
            <p className="text-xs text-bb-gray">
              Defectos en botellas de suero · Control de calidad
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right leading-tight">
            <p className="max-w-32 truncate text-xs font-semibold text-bb-ink sm:max-w-none sm:text-sm">
              {user.username}
            </p>
            <p className="text-[11px] text-bb-gray">
              {user.role === "ADMIN" ? "Administrador" : "Evaluado"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            className="gap-1.5 border-bb-gray/40 text-bb-ink hover:border-bb-green hover:text-bb-green-dark"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
