/**
 * Seed del sistema de evaluación de defectos en botellas de suero (B.BRAUN).
 * Crea: 40 defectos, 5 preguntas por defecto (200), usuario admin y configuración inicial.
 * Ejecutar: bun scripts/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { DEFECT_CONTENT } from "./content-data";

const db = new PrismaClient();
const SUERO_MODEL = "/models/suero.glb";

/* ---------- RNG determinista ---------- */
let seedState = 42;
function rnd(): number {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

/* ---------- Catálogo de defectos ---------- */

type Def = {
  code: string; name: string; cat: string; desc: string; detail: string; sev: "MENOR" | "MAYOR" | "CRITICO";
};

const DEFECTS: Def[] = [
  // PARTÍCULAS Y CONTAMINACIÓN
  { code: "D001", name: "Partícula visible en la solución", cat: "PARTICULAS", desc: "Se observa una partícula flotante o sedimentada en el interior del envase.", detail: "Partícula oscura de aproximadamente 1-2 mm apreciable a contra luz, flotante o en sedimento.", sev: "CRITICO" },
  { code: "D002", name: "Turbiedad del contenido", cat: "PARTICULAS", desc: "El líquido pierde su transparencia habitual y presenta aspecto lechoso o enturbiado.", detail: "La solución no se ve clara a contra luz; difumina el fondo al rotar la botella.", sev: "CRITICO" },
  { code: "D003", name: "Fibra celulósica en el interior", cat: "PARTICULAS", desc: "Fibra alargada procedente de material de envasado dentro de la solución.", detail: "Hebra fina y alargada, semitransparente o blanquecina, en suspensión o adherida a la pared interna.", sev: "CRITICO" },
  { code: "D004", name: "Flóculo o aglomerado en suspensión", cat: "PARTICULAS", desc: "Aglomerado blando irregular que se desplaza al girar el envase.", detail: "Masa gelatinosa de bordes difusos que se fragmenta parcialmente al agitar suavemente.", sev: "CRITICO" },
  { code: "D005", name: "Pelicula o capa en superficie del líquido", cat: "PARTICULAS", desc: "Película iridescente o blanquecina flotando en la interfase líquido-aire.", detail: "Capa fina continua en la superficie superior del contenido, visible al inclinar la botella.", sev: "CRITICO" },
  // VIDRIO
  { code: "D006", name: "Fisura en el cuello", cat: "VIDRIO", desc: "Grieta fina localizada en la zona del cuello del envase.", detail: "Línea irregular fina, generalmente vertical o helicoidal, visible a contra luz en el cuello.", sev: "CRITICO" },
  { code: "D007", name: "Fractura vertical en el cuerpo", cat: "VIDRIO", desc: "Rotura lineal profunda que atraviesa la pared del cuerpo.", detail: "Grieta abierta con bordes definidos que recorre la pared; puede provocar fugas al presionar.", sev: "CRITICO" },
  { code: "D008", name: "Impacto con cráter en la base", cat: "VIDRIO", desc: "Muesca o cráter en el fondo provocado por un golpe.", detail: "Depresión cónica con punto de impacto nítido en la base; puede acompañarse de desconchones.", sev: "MAYOR" },
  { code: "D009", name: "Esquirla de vidrio adherida", cat: "VIDRIO", desc: "Fragmento de vidrio adherido al exterior o presente en el interior.", detail: "Astilla nítida y brillante, normalmente en la zona de la base o el gollete.", sev: "CRITICO" },
  { code: "D010", name: "Burbuja ocluida en la pared", cat: "VIDRIO", desc: "Burbuja de aire quedada en el espesor del vidrio durante el moldeado.", detail: "Esfera o elipsoide perfectamente redondeada dentro del espesor de la pared; no saliente al tacto.", sev: "MENOR" },
  { code: "D011", name: "Estria o vena en el vidrio", cat: "VIDRIO", desc: "Veta de vidrio de composición distinta visible como línea ondulada.", detail: "Línea ondulada semitransparente con distinto índice de refracción, sin pérdida de integridad.", sev: "MENOR" },
  { code: "D012", name: "Gollete picado o desconchado", cat: "VIDRIO", desc: "Desconchón en el borde del gollete que compromete el cierre.", detail: "Borde irregular con pérdida de material y destellos vítreos en la zona de guiado del tapón.", sev: "MAYOR" },
  // LLENADO
  { code: "D013", name: "Nivel de llenado bajo", cat: "LLENADO", desc: "El volumen de solución es inferior al mínimo especificado.", detail: "El menisco queda claramente por debajo de la marca de referencia; cámaras de aire excesivas.", sev: "MAYOR" },
  { code: "D014", name: "Nivel de llenado excesivo", cat: "LLENADO", desc: "El volumen de solución supera el máximo especificado.", detail: "No se aprecia cámara de aire; el líquido alcanza el cuello y puede tensionar el cierre.", sev: "MAYOR" },
  { code: "D015", name: "Ausencia de vacío en el cuello", cat: "LLENADO", desc: "No se aprecia la depresión habitual al abrir o el tapón cede sin resistencia.", detail: "El tapón no ofrece succión; burbuja ascendente inmediata al invertir el envase.", sev: "MAYOR" },
  // SELLADO
  { code: "D016", name: "Arruga en el sello de aluminio", cat: "SELLADO", desc: "Pliegue visible en la falda del sello tras el remachado.", detail: "Ondulación persistente en la falda de aluminio, sin rotura, localizada en un sector del perímetro.", sev: "MENOR" },
  { code: "D017", name: "Sello con doblez lateral", cat: "SELLADO", desc: "La falda del sello queda doblada sobre sí misma en un punto.", detail: "Pliegue agudo con sombra marcada; el perímetro no es uniforme al girar la botella.", sev: "MAYOR" },
  { code: "D018", name: "Remache del sello flojo", cat: "SELLADO", desc: "El disco central del sello presenta juego o vibra al manipularlo.", detail: "Movilidad del disco central apreciable al tacto y desplazamiento lateral visible.", sev: "MAYOR" },
  { code: "D019", name: "Sello perforado", cat: "SELLADO", desc: "Orificio atravesante en el sello que compromete la esterilidad.", detail: "Punción nítida atravesante, generalmente en la falda o en el disco, con borde metálico retorcido.", sev: "CRITICO" },
  { code: "D020", name: "Crimpeado incompleto", cat: "SELLADO", desc: "El sellado no abraza completamente el gollete dejando holgura.", detail: "Falda despegada del vidrio en un arco superior a 90°, con luz visible entre aluminio y gollete.", sev: "MAYOR" },
  // TAPÓN
  { code: "D021", name: "Tapón desplazado lateralmente", cat: "TAPON", desc: "El tapón no está concéntrico con el eje del envase.", detail: "Coronamiento descentrado, con un lado más expuesto que el otro respecto al sello.", sev: "MAYOR" },
  { code: "D022", name: "Partícula adherida al tapón", cat: "TAPON", desc: "Cuerpo extraño visible sobre la superficie del tapón.", detail: "Punto oscuro o resto plástico/metal incrustado o apoyado en la cara visible del tapón.", sev: "CRITICO" },
  { code: "D023", name: "Tapón agrietado", cat: "TAPON", desc: "Fisuras en la goma del tapón visibles en coronamiento o flancos.", detail: "Grietas ramificadas finas en la superficie elastomérica, frecuentes cerca de los canales.", sev: "MAYOR" },
  { code: "D024", name: "Tapón sobresaliente (mal asentado)", cat: "TAPON", desc: "El tapón queda elevado respecto a su posición final de asiento.", detail: "Altura libre superior a la nominal entre el coronamiento y el disco del sello.", sev: "MAYOR" },
  { code: "D025", name: "Anilla flip-off rota", cat: "TAPON", desc: "La lengüeta o anilla de apertura presenta rotura previa.", detail: "Anilla desgarrada o lengüeta ausente; bordes blanquecinos de rotura en el plástico.", sev: "MENOR" },
  // ETIQUETADO
  { code: "D026", name: "Etiqueta desalineada", cat: "ETIQUETADO", desc: "La etiqueta está inclinada o desplazada respecto a su posición nominal.", detail: "Desviación angular o lateral apreciable; bordes no paralelos al eje del envase.", sev: "MENOR" },
  { code: "D027", name: "Burbujas de aire bajo la etiqueta", cat: "ETIQUETADO", desc: "Ojales de aire entre etiqueta y envase que impiden correcta adherencia.", detail: "Áreas circulares traslúcidas que se aprecian al pasar el dedo; la etiqueta no asienta plano.", sev: "MENOR" },
  { code: "D028", name: "Impresión ilegible en etiqueta", cat: "ETIQUETADO", desc: "Textos o logotipos con impresión borrosa, incompleta o borrada.", detail: "Caracteres incompletos, tinta difusa o ausente en campos impresos críticos del rótulo.", sev: "MAYOR" },
  { code: "D029", name: "Caducidad errónea o ilegible", cat: "ETIQUETADO", desc: "La fecha de caducidad no coincide con la especificada o no es legible.", detail: "Campo de fecha con caracteres solapados, incompletos o valor fuera de especificación.", sev: "CRITICO" },
  { code: "D030", name: "Número de lote ausente", cat: "ETIQUETADO", desc: "Falta el código de lote en el rótulo o el estampado no se ha realizado.", detail: "Zona lisa sin relieve ni tinta donde debería figurar el lote; imposibilita la trazabilidad.", sev: "CRITICO" },
  { code: "D031", name: "Etiqueta dañada o desgarrada", cat: "ETIQUETADO", desc: "Rotura física de la etiqueta con pérdida parcial del material.", detail: "Desgarro con bordes fibrosos, esquinas levantadas o fragmento ausente del rótulo.", sev: "MAYOR" },
  { code: "D032", name: "Doble etiqueta superpuesta", cat: "ETIQUETADO", desc: "Dos etiquetas superpuestas, con información oculta o duplicada.", detail: "Borde doble perceptible al tacto y a la vista; posible contradicción de datos entre capas.", sev: "MAYOR" },
  // EMBALAJE
  { code: "D033", name: "Sobre envolvente microperforado", cat: "EMBALAJE", desc: "Perforaciones puntiformes en el envoltorio exterior.", detail: "Puntos translúcidos localizados apreciables a contra luz sobre el Tyvek/plástico del sobre.", sev: "MAYOR" },
  { code: "D034", name: "Barrera estéril abierta", cat: "EMBALAJE", desc: "El envoltorio protector está abierto o despegado antes de su uso.", detail: "Solapa separada con trazas de adhesivo expuestas; la esterilidad del conjunto está comprometida.", sev: "CRITICO" },
  { code: "D035", name: "Manchas en el envoltorio", cat: "EMBALAJE", desc: "Zonas decoloradas o húmedas sobre el embalaje exterior.", detail: "Aureolas amarillentas o acuosas de contorno irregular sobre el sobre; posible migración de humedad.", sev: "MAYOR" },
  { code: "D036", name: "Sellado del envoltorio defectuoso", cat: "EMBALAJE", desc: "El sellado térmico del sobre presenta canales o desbordes.", detail: "Sello con tramos sin sellar o arrugas atravesantes en la línea de cierre del envolvente.", sev: "CRITICO" },
  // DEFORMACIONES
  { code: "D037", name: "Abolladura en el cuerpo", cat: "DEFORMACION", desc: "Deformación localizada de la pared provocada por impacto.", detail: "Hundimiento con reflejo distorsionado en la superficie, de contorno suave y sin rotura.", sev: "MAYOR" },
  { code: "D038", name: "Base deformada (apoyo irregular)", cat: "DEFORMACION", desc: "El fondo no permite el apoyo plano y estable del envase.", detail: "La botella bascula al situarla sobre superficie plana; punta o saliente en el fondo.", sev: "MAYOR" },
  { code: "D039", name: "Cuerpo ovalado fuera de tolerancia", cat: "DEFORMACION", desc: "Sección transversal elíptica fuera de la tolerancia dimensional.", detail: "Silueta achatada apreciable a simple vista al rotar el envase frente a una referencia circular.", sev: "MAYOR" },
  { code: "D040", name: "Peso del conjunto fuera de rango", cat: "DEFORMACION", desc: "El peso total indica sobredosis o falta de contenido.", detail: "Desviación detectada en báscula de control fuera de los límites establecidos para la referencia.", sev: "MAYOR" },
];

/* ---------- Metadatos de categorías ---------- */
const CAT_LABEL: Record<string, string> = {
  PARTICULAS: "Partículas y contaminación del contenido",
  VIDRIO: "Defectos del vidrio",
  LLENADO: "Nivel de llenado y vacío",
  SELLADO: "Sello de aluminio",
  TAPON: "Tapón y cierre",
  ETIQUETADO: "Etiquetado y marcado",
  EMBALAJE: "Envase exterior / barrera estéril",
  DEFORMACION: "Deformaciones geométricas",
};

const SEV_LABEL: Record<string, string> = {
  MENOR: "Defecto menor: no afecta directamente a la seguridad, requiere registro",
  MAYOR: "Defecto mayor: afecta a la calidad/usabilidad y exige segregación de la unidad",
  CRITICO: "Defecto crítico: compromete la esterilidad/seguridad del paciente, rechazo obligatorio",
};

/* ---------- Pregunta específica por categoría (variante 5) ---------- */
const CAT_Q5: Record<string, { text: string; correct: string; d1: string; d2: string }> = {
  PARTICULAS: {
    text: "Al inspeccionar a contra luz, ¿qué característica distingue una partícula de una burbuja de aire en la solución?",
    correct: "La partícula tiene forma irregular y sedimenta o flota de forma estable; la burbuja asciende y desaparece",
    d1: "La burbuja siempre es de color oscuro y la partícula siempre es blanquecina",
    d2: "No existe diferencia observable; ambas se descartan sin registrar",
  },
  VIDRIO: {
    text: "¿Qué técnica de inspección ayuda mejor a detectar fisuras finas en el vidrio?",
    correct: "Observación a contra luz rotando lentamente el envase",
    d1: "Pesar la botella en báscula de precisión",
    d2: "Comprobar únicamente la legibilidad de la etiqueta",
  },
  LLENADO: {
    text: "¿Qué indicador visual permite estimar un nivel de llenado anómalo?",
    correct: "La posición del menisco respecto a la marca de referencia y el tamaño de la cámara de aire",
    d1: "El color del tapón de cierre",
    d2: "La anchura de la etiqueta frontal",
  },
  SELLADO: {
    text: "Al girar la botella, ¿cómo se aprecia un crimpeado irregular del sello de aluminio?",
    correct: "El perímetro de la falda no es uniforme y aparecen pliegues o luz entre sello y gollete",
    d1: "El sello cambia de color en la zona defectuosa",
    d2: "La etiqueta frontal queda descentrada",
  },
  TAPON: {
    text: "¿Qué observación sugiere que el tapón no está correctamente asentado?",
    correct: "Altura libre excesiva entre el coronamiento del tapón y el disco del sello",
    d1: "Brillo especular mayor de lo habitual en la goma",
    d2: "El nivel de líquido visto a contra luz",
  },
  ETIQUETADO: {
    text: "¿Qué campos del rótulo son críticos y deben comprobarse siempre legibles?",
    correct: "Identificación del producto, lote y fecha de caducidad",
    d1: "Únicamente el logotipo del fabricante",
    d2: "El código de barras decorativo lateral",
  },
  EMBALAJE: {
    text: "¿Por qué una perforación en el envoltorio exterior se considera un defecto de barrera estéril?",
    correct: "Porque rompe la protección estéril del conjunto aunque la botella parezca intacta",
    d1: "Porque dificulta únicamente el apilamiento en el almacén",
    d2: "Porque altera el peso del conjunto en báscula",
  },
  DEFORMACION: {
    text: "¿Qué comprobación simple permite detectar una base deformada?",
    correct: "Situar la botella sobre superficie plana y comprobar que no bascula",
    d1: "Observar el color del líquido a contra luz",
    d2: "Comprobar la fecha de caducidad impresa",
  },
};

/* ---------- Construcción de las 5 variantes por defecto ---------- */
type Built = { variant: number; text: string; optionA: string; optionB: string; optionC: string; correct: "A" | "B" | "C"; explanation: string };

function shuffleOptions(correctText: string, d1: string, d2: string) {
  const opts = [correctText, d1, d2];
  // orden determinista basado en el RNG con semilla
  const order = [0, 1, 2];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const arranged = order.map((i) => opts[i]);
  const correctIdx = order.indexOf(0);
  const letter = (["A", "B", "C"] as const)[correctIdx];
  return { arranged, letter };
}

function buildQuestions(def: Def, allDefs: Def[]): Built[] {
  const others = allDefs.filter((d) => d.code !== def.code && d.cat !== def.cat);
  const other1 = others[Math.floor(rnd() * others.length)] ?? allDefs[0];
  let others2 = allDefs.filter((d) => d.code !== def.code && d.code !== other1.code);
  const other2 = others2[Math.floor(rnd() * others2.length)] ?? allDefs[1];

  const sevText = SEV_LABEL[def.sev];
  const sevDistract = Object.keys(SEV_LABEL).filter((k) => k !== def.sev).map((k) => SEV_LABEL[k]);
  const catText = CAT_LABEL[def.cat];
  const catDistract = Object.keys(CAT_LABEL).filter((k) => k !== def.cat).slice(0, 8);
  const c1 = CAT_LABEL[catDistract[Math.floor(rnd() * catDistract.length)]];
  let c2 = CAT_LABEL[catDistract[Math.floor(rnd() * catDistract.length)]];
  if (c2 === c1) c2 = CAT_LABEL[catDistract[(catDistract.indexOf(c1) + 1) % catDistract.length]];

  const defs: Array<{ text: string; correct: string; d1: string; d2: string; explanation: string }> = [
    {
      text: `Al inspeccionar una botella de suero, ¿cuál de las siguientes observaciones corresponde al defecto «${def.name}»?`,
      correct: def.detail,
      d1: other1.detail,
      d2: other2.detail,
      explanation: `${def.name}: ${def.detail}`,
    },
    {
      text: `¿A qué familia de defectos pertenece «${def.name}»?`,
      correct: catText,
      d1: c1,
      d2: c2,
      explanation: `«${def.name}» pertenece a la familia: ${catText}.`,
    },
    {
      text: `Detectas «${def.name}» durante la inspección. ¿Cuál es la actuación correcta?`,
      correct:
        def.sev === "CRITICO"
          ? "Segregar la unidad de forma inmediata, registrar el defecto y bloquear su uso por impacto directo en la seguridad del paciente"
          : def.sev === "MAYOR"
          ? "Segregar la unidad afectada y registrar el hallazgo conforme al procedimiento de calidad"
          : "Registrar el hallazgo y segregar la unidad aplicando el criterio establecido por Calidad",
      d1: "Continuar el flujo normal: los defectos se corrigen automáticamente en el siguiente lote",
      d2: "Reprocesar la unidad en línea y liberarla sin dejar registro del incidente",
      explanation: `Criticidad ${def.sev}: la unidad se segrega y registra siempre; si es crítico, se bloquea su uso.`,
    },
    {
      text: `¿Cómo se clasifica el defecto «${def.name}» según su criticidad?`,
      correct: sevText,
      d1: sevDistract[0],
      d2: sevDistract[1],
      explanation: `«${def.name}» se clasifica como defecto ${def.sev}.`,
    },
    {
      text: CAT_Q5[def.cat].text,
      correct: CAT_Q5[def.cat].correct,
      d1: CAT_Q5[def.cat].d1,
      d2: CAT_Q5[def.cat].d2,
      explanation: CAT_Q5[def.cat].correct,
    },
  ];

  return defs.map((q, i) => {
    const { arranged, letter } = shuffleOptions(q.correct, q.d1, q.d2);
    return {
      variant: i + 1,
      text: q.text,
      optionA: arranged[0],
      optionB: arranged[1],
      optionC: arranged[2],
      correct: letter,
      explanation: q.explanation,
    };
  });
}

/* ---------- Ejecución ---------- */
async function main() {
  console.log("Sembrando sistema de evaluación...");

  // Usuario administrador
  const adminHash = await bcrypt.hash("admin", 10);
  const admin = await db.user.upsert({
    where: { username: "admin" },
    update: { role: "ADMIN" },
    create: { username: "admin", email: "admin@bbraun.local", password: adminHash, role: "ADMIN", consentAt: new Date() },
  });
  console.log("Admin listo:", admin.username);

  // Configuración inicial
  const cfgCount = await db.evalConfig.count();
  if (cfgCount === 0) {
    await db.evalConfig.create({ data: { numFinalQuestions: 10 } });
    console.log("Config inicial: 10 preguntas finales por Prueba de Evaluación");
  }

  // Limpieza y recarga de catálogo
  await db.finalAnswer.deleteMany();
  await db.codeAnswer.deleteMany();
  await db.attempt.deleteMany();
  await db.question.deleteMany();
  await db.defect.deleteMany();

  let qCount = 0;
  for (let i = 0; i < DEFECTS.length; i++) {
    const d = DEFECTS[i];
    const content = DEFECT_CONTENT[d.code];
    const defect = await db.defect.create({
      data: {
        code: d.code,
        name: d.name,
        category: d.cat,
        description: d.desc,
        detail: d.detail,
        severity: d.sev,
        modelPath: SUERO_MODEL,
        order: i + 1,
        causes: content?.causes ?? null,
        risks: content?.risks ?? null,
        detection: content?.detection ?? null,
        action: content?.action ?? null,
        prevention: content?.prevention ?? null,
        regulation: content?.regulation ?? null,
      },
    });
    const questions = buildQuestions(d, DEFECTS);
    for (const q of questions) {
      await db.question.create({ data: { ...q, defectId: defect.id } });
      qCount++;
    }
  }
  console.log(`Defectos: ${DEFECTS.length}, Preguntas: ${qCount}`);
  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
