"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import type { DefectMediaItem } from "@/lib/eval-types";

/**
 * Visor unificado del material de apoyo de la ficha: imagen individual o carrusel
 * (con flechas, teclado y contador), vídeo, audio y contenido incrustado. La
 * insignia indica el apartado de la ficha desde el que se abre.
 */
export function ResourceViewer({
  items,
  initialIndex = 0,
  sectionLabel,
  onClose,
}: {
  items: DefectMediaItem[];
  initialIndex?: number;
  sectionLabel?: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const item = items[index];

  useEffect(() => {
    setIndex(initialIndex);
  }, [items, initialIndex]);

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + items.length) % items.length),
    [items.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % items.length),
    [items.length]
  );

  // Carrusel con teclado (izquierda/derecha) mientras el visor está abierto
  useEffect(() => {
    if (items.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, prev, next]);

  if (!item) return null;

  const isCarousel = item.type === "IMAGE" && items.length > 1;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6 text-base">
            {item.title}
            {sectionLabel && (
              <Badge variant="outline" className="border-bb-green-line bg-bb-green-tint text-[11px] font-medium text-bb-green-dark">
                {sectionLabel}
              </Badge>
            )}
          </DialogTitle>
          {item.caption && <DialogDescription>{item.caption}</DialogDescription>}
        </DialogHeader>

        {isCarousel && (
          <div className="relative">
            <img
              key={item.id}
              src={item.url}
              alt={item.title}
              className="max-h-[65vh] w-full rounded-lg object-contain"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={prev}
              className="absolute left-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full shadow-md"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={next}
              className="absolute right-2 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full shadow-md"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Button>
            <span className="absolute bottom-2 right-2 rounded-full bg-slate-900/70 px-2.5 py-0.5 text-xs font-semibold text-white">
              {index + 1} / {items.length}
            </span>
          </div>
        )}

        {!isCarousel && item.type === "IMAGE" && (
          <img
            src={item.url}
            alt={item.title}
            className="max-h-[65vh] w-full rounded-lg object-contain"
          />
        )}

        {item.type === "VIDEO" && (
          <video
            key={item.id}
            src={item.url}
            controls
            autoPlay
            className="max-h-[65vh] w-full rounded-lg bg-black"
            aria-label={`Vídeo: ${item.title}`}
          />
        )}

        {item.type === "AUDIO" && (
          <div className="space-y-3 rounded-xl border border-bb-green-line bg-bb-green-tint/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-bb-green-dark">
              <Volume2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              {item.title}
            </p>
            <audio
              key={item.id}
              src={item.url}
              controls
              autoPlay
              className="w-full"
              aria-label={`Audio: ${item.title}`}
            />
          </div>
        )}

        {item.type === "EMBED" && (
          <div className="aspect-video w-full overflow-hidden rounded-lg border">
            <iframe
              src={item.url}
              title={item.title}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
