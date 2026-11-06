/**
 * Aplica los contenidos teóricos ampliados y el modelo corporativo suero.glb
 * a los defectos ya existentes en la base de datos (no destructivo: no toca preguntas ni respuestas).
 * Ejecutar: bun scripts/apply-content.ts
 */
import { PrismaClient } from "@prisma/client";
import { DEFECT_CONTENT } from "./content-data";

const db = new PrismaClient();
const SUERO_MODEL = "/models/suero.glb";

async function main() {
  const defects = await db.defect.findMany({ select: { id: true, code: true } });
  console.log(`Defectos en BD: ${defects.length}`);

  let contentApplied = 0;
  for (const d of defects) {
    const content = DEFECT_CONTENT[d.code];
    await db.defect.update({
      where: { id: d.id },
      data: {
        modelPath: SUERO_MODEL,
        causes: content?.causes ?? null,
        risks: content?.risks ?? null,
        detection: content?.detection ?? null,
        action: content?.action ?? null,
        prevention: content?.prevention ?? null,
        regulation: content?.regulation ?? null,
      },
    });
    if (content) contentApplied++;
  }

  // Vaciar la tabla de media sembrada anteriormente para resembrar limpia (opcional, solo demo)
  const mediaCount = await db.defectMedia.count();

  console.log(`Contenidos aplicados: ${contentApplied}/${defects.length}`);
  console.log(`Modelo 3D actualizado a ${SUERO_MODEL} en todos los defectos`);
  console.log(`Media existente en BD (sin tocar): ${mediaCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
