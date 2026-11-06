/**
 * Siembra material de apoyo de demostración (idempotente: no duplica si ya existe el mismo título).
 * Ejecutar: bun scripts/seed-media.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type SeedItem = {
  code: string;
  type: "IMAGE" | "VIDEO" | "EMBED";
  url: string;
  title: string;
  caption: string | null;
};

const ITEMS: SeedItem[] = [
  {
    code: "D001",
    type: "IMAGE",
    url: "/uploads/defects/D001/contraluz.png",
    title: "Inspección a contraluz",
    caption: "Técnica estándar: rota la botella ante un fondo oscuro para revelar partículas y anomalías del contenido.",
  },
  {
    code: "D001",
    type: "IMAGE",
    url: "/uploads/defects/D001/particula.png",
    title: "Partícula visible en el contenido",
    caption: "Ejemplo de partícula oscura en suspensión, apreciable a contra luz.",
  },
  {
    code: "D001",
    type: "VIDEO",
    url: "/uploads/defects/D001/tecnica-inspeccion.mp4",
    title: "Vídeo: técnica de inspección visual",
    caption: "Demostración de la manipulación correcta de la botella durante la inspección a contraluz.",
  },
  {
    code: "D019",
    type: "IMAGE",
    url: "/uploads/defects/D019/sello-perforado.png",
    title: "Sello perforado (ejemplo)",
    caption: "Punción atravesante en la falda de aluminio: la barrera estéril queda comprometida.",
  },
  {
    code: "D031",
    type: "IMAGE",
    url: "/uploads/defects/D031/etiqueta-danada.png",
    title: "Etiqueta dañada (ejemplo)",
    caption: "Desgarro con bordes fibrosos y esquina levantada en el rótulo.",
  },
];

async function main() {
  let created = 0;
  for (const item of ITEMS) {
    const defect = await db.defect.findUnique({ where: { code: item.code }, select: { id: true } });
    if (!defect) {
      console.warn(`Defecto ${item.code} no encontrado, se omite`);
      continue;
    }
    const exists = await db.defectMedia.findFirst({
      where: { defectId: defect.id, title: item.title },
      select: { id: true },
    });
    if (exists) continue;

    const last = await db.defectMedia.findFirst({
      where: { defectId: defect.id },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    await db.defectMedia.create({
      data: {
        defectId: defect.id,
        type: item.type,
        url: item.url,
        title: item.title,
        caption: item.caption,
        orderIndex: (last?.orderIndex ?? 0) + 1,
      },
    });
    created++;
  }
  console.log(`Material de demostración creado: ${created} (de ${ITEMS.length})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
