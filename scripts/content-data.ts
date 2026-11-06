/**
 * Contenidos teóricos ampliados por defecto (editables después por el administrador).
 * Fuente de verdad compartida por: scripts/apply-content.ts (BD existente) y scripts/seed.ts (instalaciones nuevas).
 * Ámbito: inspección visual de botellas de suero de vidrio tipo I con sello de aluminio y tapón elastomérico.
 */

const REG = {
  PARTICULAS:
    "Ph. Eur. 2.9.20 (Contaminación por partículas visibles) · USP <790> Visible Particulates in Injections · USP <1790> (inspección visual de inyectables) · GMP EU Anexo 1 (fabricación de productos estériles).",
  VIDRIO:
    "Ph. Eur. 3.2.1 (Envases de vidrio) · USP <1660> (delaminación del vidrio) · ISO 8362-1/-2 (frascos y botellas de vidrio tipo I para preparados inyectables).",
  LLENADO:
    "GMP EU Anexo 1 (control en proceso) · Ph. Eur. 2.9.17/Volumen nominal de inyectables · especificación interna de llenado y cámara de aire de la referencia.",
  SELLADO:
    "USP <1207> (Integridad del cierre contenedor-esteilidad) · ISO 8362-3/-7 (cierre de aluminio con sello remachado) · procedimiento interno de crimpeado y control en proceso.",
  TAPON:
    "ISO 8871-1 (piezas elastoméricas para preparados acuosos parenterales) · ISO 8362-4 (tapones para botellas de infusión) · USP <381> (cierres elastoméricos).",
  ETIQUETADO:
    "GMP EU Capítulo 4 (documentación y rotulado) · Reglamento (UE) 2016/161 (dispositivos de seguridad y identificación única) · procedimiento interno de revisión de etiquetas (label check).",
  EMBALAJE:
    "EN 868-5 / ISO 11607-1 (envases estériles terminales: requisitos y métodos) · USP <1207> (integridad de la barrera estéril) · validación interna de sellado térmico.",
  DEFORMACION:
    "ISO 8362-1 (tolerancias dimensionales de botellas de infusión) · especificación dimensional interna · control estadístico de proceso (SPC) en línea.",
} as const;

function c(
  causes: string,
  risks: string,
  detection: string,
  action: string,
  prevention: string,
  regulation: string
) {
  return { causes, risks, detection, action, prevention, regulation };
}

export const DEFECT_CONTENT: Record<string, { causes: string; risks: string; detection: string; action: string; prevention: string; regulation: string }> = {
  /* ─────────────── PARTÍCULAS Y CONTAMINACIÓN ─────────────── */
  D001: c(
    "Las causas más frecuentes son la fricción entre componentes elastoméricos durante el transporte y la manipulación, fragmentos desprendidos del tapón tras múltiples perforaciones o corcho del propio proceso de lavado. También pueden originarse por partículas del entorno de llenado que escapan al control ambiental. En ocasiones proceden del propio producto precipitado por incompatibilidad física.",
    "Una partícula administrada por vía parenteral puede provocar embolia pulmonar, flebitis, granulomas o reacciones alérgicas, especialmente en pacientes pediátricos, oncológicos o en cuidados intensivos. Es el defecto con mayor potencial de daño directo al paciente, por lo que la unidad debe considerarse inutilizable. Los lotes afectados pueden requerir la notificación a farmacovigilancia y retirada.",
    "Sitúa la botella a contra luz sobre fondo oscuro, gírala lentamente 360° y deja reposar unos segundos: observa si aparece algún punto que no ascienda como burbuja. Compara con una unidad de referencia del mismo lote ante la duda. Las partículas mantienen su posición, sedimento o flotan de forma estable, mientras que las burbujas ascienden y desaparecen.",
    "Segrega la unidad de forma inmediata y etiquétala como unidad rechazada. Registra el hallazgo indicando código, número de lote, tamaño y naturaleza aparente de la partícula, y comunica el suceso al supervisor de línea. Si se repite en varias unidades, detén la inspección y activa la investigación de calidad: el lote completo queda en cuarentena.",
    "Mantenimiento preventivo de las líneas de lavado y llenado, control de partículas viables y no viables del área limpia y calificación del material de embalaje. Manipula los tapones con guantes sin polvo y evita apilamientos que generen fricción entre unidades. Realiza el muestreo a contra luz en cabinas validadas.",
    REG.PARTICULAS
  ),
  D002: c(
    "La turbiedad suele deberse a una precipitación del principio activo o excipientes por cambios de temperatura, pH o compatibilidad entre soluciones. También puede indicar contaminación microbiológica con crecimiento visible o una reacción entre el contenido y el envase. Menos habitual, puede proceder de un error de formulación en el llenado.",
    "La administración de una solución enturbiada puede causar reacciones febriles, septicemia si existe origen microbiológico, o bloqueo microvascular por precipitados. No es aceptable «aclarar» el contenido: la opacidad siempre es anómala en sueros transparentes. El riesgo se agrava en perfusiones de larga duración.",
    "Observa la botella a contra luz y gírala: una solución correcta permite leer un texto a través del líquido sin difuminado. Compara siempre con la unidad de referencia, ya que algunos sueros tienen ligera opalescencia natural especificada. Descarta burbujas finas recién agitadas antes de emitir un juicio.",
    "Rechaza la unidad y regístrala como defecto crítico. Aísla las unidades adyacentes del mismo lote y avisa de inmediato a Calidad: una turbiedad de origen microbiológico puede implicar la cuarentena total del lote y trazado de la curva de esterilización. No intentes filtrar ni reacondicionar la unidad.",
    "Validación de la compatibilidad producto-envase, control de temperaturas de almacenamiento y ensayos periódicos de vida útil. Mantén la integridad de la cadena de frío y evita mezclas no validadas en la línea de llenado. La formación del inspector debe incluir galerías de imágenes de turbiedad real.",
    REG.PARTICULAS
  ),
  D003: c(
    "Las fibras celulósicas proceden normalmente de la ropa de trabajo, gasas, filtros desgastados o papel de embalaje introducidos durante el llenado o el montaje de la línea. También se generan al abrir sobres de Tyvek con materiales fibrosos cerca de la boca de la botella. Son la partícula extrínseca más habitual en la industria estéril.",
    "Aunque la celulosa es biocompatible, una fibra parenteral puede desencadenar inflamación granulomatosa y microembolias, sobre todo si supera 100 micras. Afecta negativamente a la percepción de calidad del producto y puede ocultar una brecha mayor del sistema de barridas de aire. Toda unidad con fibra visible se considera rechazable.",
    "A contra luz, busca hebras alargadas de extremos irregulares que se muevan como «agujas» al girar la botella y que puedan quedar adheridas a la pared. Diferéncialas de las burbujas alargadas: la fibra no asciende y suele tener un extremo más grueso. Usa lupa 2-3× si el procedimiento lo permite.",
    "Segrega y rechaza la unidad, registrando la morfología del hallazgo (longitud, color, adherida o en suspensión). Si detectas varias fibras en el mismo turno, informa al supervisor: puede indicar una fuga de fibra en la línea (filtro, guantes o ropa) que exige intervención técnica.",
    "Vestimenta estéril conforme, flujo laminar correcto y apertura de sobres lejos de la apertura del envase. Sustituye filtros según su vida útil y calibra los controles ambientales periódicamente. La disciplina de vestuario y el comportamiento en sala limpia son la barrera principal.",
    REG.PARTICULAS
  ),
  D004: c(
    "Los flóculos se forman por agregación de partículas finas, incompatibilidades entre sales, o crecimiento microbiológico en fases iniciales. También aparecen cuando la solución ha sufrido ciclos de congelación-descongelación o un exceso de agitación durante el transporte. Un mal enjuague del envase puede dejar residuos que actúen como núcleo de agregación.",
    "Un aglomerado puede obstruir la vía o el filtro de administración y liberar fragmentos irregulares en el torrente sanguíneo. Si su origen es microbiológico, el riesgo de septicemia es alto. En cualquier caso, la unidad no es administrable y su aparición repetida sugiere un problema de proceso o cadena logística.",
    "Inclina suavemente la botella y observa si la masa se desplaza de forma conjunta y se deforma con bordes difusos, a diferencia de una partícula dura que rueda. A contra luz el flóculo aparece como una sombra irregular translúcida. No agites con fuerza: podría fragmentarlo y dificultar la caracterización del hallazgo.",
    "Rechaza la unidad y documenta el aspecto (tamaño aparente, movilidad, fragmentación). Comprueba las condiciones de transporte y almacenamiento del lote: los flóculos por congelación suelen ser difusos y abundantes. Avisa a Calidad si el hallazgo se repite para evaluar la ampliación de la investigación.",
    "Control de la cadena logística (sensores de temperatura y choque), validación de formulaciones y ensayos de estabilidad acelerada. Evita agitaciones bruscas en la paletización y respeta las temperaturas mínimas de conservación. El muestreo de entrada debe incluir inspección tras acondicionamiento térmico.",
    REG.PARTICULAS
  ),
  D005: c(
    "La película superficial suele ser aceite siliconado procedente del tratamiento de los tapones o de lubricantes de la línea, o una fase de migración de excipientes lipofílicos. También puede aparecer por contaminación cruzada con tensioactivos durante el lavado del envase. En productos reconstituidos, indica a veces una aglomeración proteica en la interfase.",
    "Una capa orgánica en la interfase puede contener endotoxinas o ser foco de crecimiento microbiológico, y su administración continuada aporta una carga de impurezas no especificada. Su presencia delata además una incidencia en el proceso de siliconado que puede afectar a todo el lote. La unidad no debe liberarse.",
    "Inclina la botella unos 45° y mira la superficie superior del líquido a contra luz: la película se ve como un brillo iridiscente o un velo blanquecino que se pliega como una tela al mover el envase. Diferénciala del menisco normal, que es una línea limpia y continua sin textura. Rota lentamente para confirmar que la capa flota.",
    "Segrega la unidad y describe el aspecto de la película (iridiscente, blanquecina, fragmentada). Informa a Calidad porque el origen puede ser el proceso de siliconado de tapones y afectar a múltiples unidades. Rechazo obligatorio por tratarse de un defecto crítico de contaminación visible.",
    "Control del proceso de siliconado (dosificación y curado), validación de lavado de tapones y monitorización de residuos lipofílicos. Verifica el enjuague final con agua para inyección del envase. La inspección de interfase líquido-aire debe formar parte del patrón de búsqueda del inspector.",
    REG.PARTICULAS
  ),

  /* ─────────────── VIDRIO ─────────────── */
  D006: c(
    "Las fisuras en el cuello proceden normalmente de impactos térmicos (choque entre zonas frías y calientes durante el lavado o esterilización) o mecánicos en el transporte de bandejas. También aparecen por tensiones residuales de fabricación del vidrio mal recocido. El contacto directo metal-vidrio en las cadenas de transporte es un generador clásico.",
    "Una fisura en el cuello compromete la barrera estéril incluso sin fuga visible: microorganismos pueden acceder por capilaridad. Además existe riesgo de rotura súbita durante la administración con proyección de fragmentos. La unidad debe tratarse siempre como rechazo crítico sin excepciones.",
    "A contra luz, rota el cuello lentamente buscando líneas brillantes finas, verticales o helicoidales, que destellan al cambiar el ángulo de incidencia. Ayúdate de un fondo oscuro: la fisura aparece como un trazo luminoso discontinuo. Comprueba que no es una estria (la fisura tiene bordes nítidos y reflejo metálico).",
    "Rechazo inmediato de la unidad y registro de la posición exacta de la fisura (oreja del cuello, rosca, zona de guiado). Si aparecen varias unidades, revisa el histórico de choques del lote y el proceso de lavado-esterilización, porque la causa suele ser mecánica y de línea.",
    "Protege los cuellos con separadores o bandejas divisoria, evita contactos metal-vidrio y controla los gradientes térmicos en lavado y esterilización. Califica los proveedores de vidrio con ensayos de tensiones polarizadas. El muestreo de entrada debe incluir inspección de cuello a contra luz.",
    REG.VIDRIO
  ),
  D007: c(
    "Una fractura vertical abierta delata un impacto significativo durante el transporte, paletizado o manipulación, o una presión puntual excesiva en cinta transportadora. También puede progresar desde una fisura no detectada sometida a ciclos térmicos. Es la evolución natural del defecto D006 cuando no se detecta a tiempo.",
    "La integridad del envase está rota: la esterilidad está comprometida y existe riesgo de fuga durante la perfusión, pérdida de dosis y contaminación del equipo de administración. Existe además peligro de corte para el personal manipulador. Es un defecto crítico inadmisible en cualquier circunstancia.",
    "Se ve a simple vista en la mayoría de los casos: grieta abierta con bordes definidos que puede goteear al inclinar. A contra luz la línea aparece como un trazo oscuro brillante que atraviesa la pared. Si hay dudas entre fisura y fractura, la presencia de líquido exudado en la superficie exterior la confirma.",
    "Segrega la unidad con extremo cuidado (riesgo de rotura y corte) en un contenedor rígido de vidrios. Registra el hallazgo y revisa el entorno de la paleta o bandeja de procedencia: las fracturas suelen venir en racimo tras un golpe de transporte. Activa inspección reforzada del lote implicado.",
    "Diseño de embalaje con absorción de impactos, control de aceleraciones en transporte y mantenimiento de rodillos y guías de la línea sin aristas. Formación específica en manipulación segura de vidrio. El muestreo de entrada debe incluir revisión de las unidades perimetrales de cada paleta.",
    REG.VIDRIO
  ),
  D008: c(
    "El cráter en la base procede de un golpe puntual contra superficie dura, típico de caídas de bandeja o choques de la botella contra el fondo metálico de cubetas de lavado. El punto de impacto concentra la tensión y puede generar desconchones internos no visibles directamente. Es más frecuente en bases planas que en las rebajadas.",
    "Si el cráter va acompañado de desconchones internos (flake), pueden desprenderse partículas de vidrio al contenido, con el riesgo asociado de embolia o irritación. La integridad mecánica del envase queda reducida y puede fallar durante la esterilización o el transporte. La unidad debe evaluarse siempre como rechazo.",
    "Comprueba la base rotando la botella en posición inclinada a contra luz: busca depresión cónica con punto de impacto nítido, a veces con anillo de desconchones alrededor. La prueba de apoyo sobre superficie plana puede revelar basculación asociada. Un cráter siempre altera el reflejo regular del fondo.",
    "Rechaza la unidad y documenta el diámetro aproximado del cráter y la presencia de desconchones visibles. Revisa el proceso logístico de la zona donde se detectó: los impactos en base apuntan a manipulación brusca o contacto con superficies duras del equipo. Informa al supervisor si el hallazgo se repite.",
    "Protege las bases en el paletizado, revisa los fondos de cubetas y racks, y elimina contactos vidrio-metal en las líneas. Verifica el diseño del vidrio (base rebajada o punteada) con el proveedor. Incluye la inspección de base en el patrón de búsqueda sistemático del inspector.",
    REG.VIDRIO
  ),
  D009: c(
    "Las esquirlas proceden de roturas parciales de otras unidades durante el proceso (colisiones, fracturas en línea) cuyos fragmentos quedan adheridos por tensión superficial o electrostática. También se generan al reutilizar cubetas o bandejas con restos vítreos mal limpiados. El momento típico es la salida del túnel de despirogeonización.",
    "Es uno de los defectos más peligrosos: una esquirla en el interior puede administrarse al paciente con riesgo de embolia, perforación vascular o lesión tisular grave. En el exterior, compromete la barrera y representa riesgo de corte. Rechazo crítico y obligatorio en ambos casos.",
    "A contra luz busca reflejos lineales muy brillantes y nítidos, distintos del brillo difuso del vidrio sano. En el exterior, palpa visualmente el gollete y la base sin arrastrar el dedo (riesgo de corte). En el interior, una esquirla sedimenta rápido y refleja como una astilla al rotar. No confundas con burbujas ojales.",
    "Segrega la unidad sin manipularla más de lo necesario y regístrala como crítico. Identifica la zona de la línea o banda donde se detectó: las esquirlas suelen ser indicativas de una rotura aguas arriba que exige parada y limpieza validada de la línea. Comprueba las unidades vecinas inmediatas.",
    "Protocolo de limpieza validado tras roturas, maintenance preventiva de las guías de la línea y eliminación de contactos duros. Gestiona los vidrios rotos con utensilios dedicados, nunca con las manos. La detección temprana de fracturas evita la dispersión de esquirlas en el proceso.",
    REG.VIDRIO
  ),
  D010: c(
    "Las burbujas ocluidas se forman durante el moldeado del vidrio si el fundido contiene gas disuelto o si el molde no respira correctamente. Son inherentes al proceso de fabricación del vidrio y quedan selladas dentro del espesor de la pared. Su presencia ocasional es tolerada dentro de límites dimensionales definidos por la especificación.",
    "Como no comunican con el contenido, el riesgo para el paciente es prácticamente nulo: no liberan partículas ni comprometen la esterilidad. Su relevancia es cosmética y dimensional, salvo que alcancen gran tamaño o se sitúen en zonas de esfuerzo (cuello, base), donde pueden actuar como iniciador de fisura.",
    "A contra luz se ve como una esfera perfectamente redondeada y lisa, fija dentro de la pared, sin movimiento al rotar. No asciende nunca y no presenta bordes irregulares. Compara con la referencia dimensional: burbujas superiores a la tolerancia especificada o situadas en el cuello sí son rechazables.",
    "Aplica el criterio dimensional de la especificación: si la burbuja está dentro de tolerancia y fuera de zonas críticas, la unidad se acepta y el hallazgo se registra como estadística de proceso. Si excede tolerancia o está en cuello/base, segrega la unidad. Ante la duda, consulta con Calidad con la unidad marcada.",
    "Calificación del proveedor de vidrio y control de entrada con muestreo dimensional. Exige informes de burbujas por lote de vidrio y realiza auditorías de moldeo. La formación del inspector debe incluir la distinción burbuja ocluida / partícula / ojal de aire del contenido.",
    REG.VIDRIO
  ),
  D011: c(
    "Las estrías o venas son heterogeneidades de composición del fundido (cordados) que quedan laminadas en la pared durante el moldeado. Se originan en una homogeneización insuficiente del vidrio o en cambios de receta entre producciones. Es un defecto inherente al vidrio, no del envasado posterior.",
    "Al no alterar la integridad de la pared ni comunicar con el contenido, el riesgo para el paciente es mínimo. Su importancia es estética y como posible indicador de un vidrio con tensiones internas mayores de lo habitual, que puede comportarse peor ante choques térmicos. No compromete la esterilidad.",
    "Se observa como una línea ondulada semitransparente con distinto índice de refracción: al rotar la botella, la vena se desplaza visualmente con un efecto de «agua sobre vidrio». No tiene bordes nítidos ni reflejo metálico, lo que la distingue de una fisura. La pared no está abierta ni debilitada puntualmente.",
    "Acepta la unidad si la vena es fina y superficial conforme a la especificación y regístrala como observación de proceso. Segrega solo si la estria es gruesa, profunda o acompaña a otros defectos. Ante lotes con muchas estrías, comunica a Calidad para revisar el certificado del fabricante de vidrio.",
    "Exige al proveedor controles de homogeneidad del fundido y estabilidad de receta. Realiza controles de entrada con muestreo por lotes de vidrio y registro de incidencias visuales. La retención de muestras comparativas ayuda a mantener criterios de aceptación coherentes entre inspectores.",
    REG.VIDRIO
  ),
  D012: c(
    "El picado o desconchado del gollete proviene de contactos duros durante el transporte interior, choque con otras botellas o mal ajuste de las guías que centraban el envase. También puede generarse al remover tapones con herramienta metálica. La zona de guiado del tapón es especialmente sensible por su tolerancia estrecha.",
    "Un gollete dañado impide un cierre hermético: el tapón no asienta y puede existir microfuga invisible que comprometa la esterilidad. Durante la apertura, pueden desprenderse fragmentos de vidrio hacia la perfusión. Es un defecto mayor con potencial de volverse crítico según la extensión del desconchón.",
    "Inspeciona el borde superior y la zona de guiado rotando la botella a contra luz: busca bordes irregulares con destellos brillantes, pérdida de material o pequeños puntos brillantes fijos. Compara el perímetro con una unidad de referencia. Cualquier desprendimiento visible en la zona de contacto del tapón es rechazable.",
    "Segrega la unidad y documenta la posición y extensión del desconchón (oreja, rosca, plano de asiento). Revisa el estado de las guías y transportadores de la zona implicada. Si el tapón ya está montado, evalúa también el asentamiento del cierre antes de descartar la unidad por el vidrio.",
    "Mantenimiento y alineación de guías de transporte, protección de golletes en bandejas y formación en manipulación. Establece controles de entrada específicos para el gollete, que es la zona de tolerancia más crítica del envase. Registra los picados por lote para detectar tendencias.",
    REG.VIDRIO
  ),

  /* ─────────────── LLENADO ─────────────── */
  D013: c(
    "El bajo llenado se origina por variaciones en la dosificadora (aire en la línea de aspiración, desgaste de válvulas), espuma que falsea el nivel en el momento del taponado o calibración incorrecta tras un cambio de formato. Los cambios de temperatura del producto también alteran el volumen aparente en el envase.",
    "El paciente recibe menos dosis de la prescrita: en sueros con fármaco añadido o electrolitos críticos esto es clínicamente relevante (hipopotasemia, dosificación incompleta de antibióticos). Aunque el defecto mayor no compromete la esterilidad, sí afecta directamente a la eficacia terapéutica y al cumplimiento regulatorio del volumen nominal.",
    "Compara el menisco con la marca de referencia del envase a la altura de los ojos y comprueba que la cámara de aire es claramente superior a la de las unidades vecinas. La comparación entre unidades del mismo lote es la técnica más fiable, ya que pequeñas variaciones de nivel son normales.",
    "Segrega la unidad y regístra el hallazgo con el nivel aproximado. Verifica en báscula el peso bruto contra el límite inferior especificado si el procedimiento lo exige. Si detectas varias unidades bajas consecutivas, avisa al control en proceso: la dosificadora puede requerir recalibrado inmediato.",
    "Calibración periódica de dosificadoras con verificación de peso en línea, control estadístico del nivel de llenado y alarmas de tendencia. Evita espumación ajustando la velocidad de llenado y la geometría de la aguja. Registra el peso medio del lote como indicador de proceso.",
    REG.LLENADO
  ),
  D014: c(
    "El exceso de llenado proviene de calibración de la dosificadora desplazada al alza, doble impulsión o producto con densidad distinta a la de calibración. Las botellas completamente llenas sin cámara de aire también pueden delatar un fallo del sistema de retiro de aire o de vacío antes del taponado.",
    "Sin cámara de aire, la dilatación térmica del líquido tensiona el cierre y puede provocar microfugas o incluso rotura del sello durante la esterilización o el transporte. Además se sobredosis al paciente si el envase lleva principio activo. Es un defecto mayor que debe detectarse antes de la liberación del lote.",
    "Comprueba que existe una cámara de aire visible al inclinar la botella y que el menisco no alcanza el cuello. A contra luz, la línea de líquido debe quedar claramente por debajo del punto de entrada al cuello. Compara con unidades vecinas: la ausencia total de cámara de aire es siempre anómala.",
    "Segrega la unidad y regístrala como nivel excesivo. Revisa el control en proceso de peso bruto: si el promedio del lote tiende al alza, solicita recalibrado de la dosificadora. Comprueba si la unidad presenta tensión en el cierre o deformación del sello que exija inspección adicional.",
    "Verificación continua del volumen dosificado con básculas automáticas, control de la cámara de aire en el muestreo en proceso y validación de los ciclos de vacío. Establece límites de acción superiores e inferiores y responde a las tendencias antes de superar especificación.",
    REG.LLENADO
  ),
  D015: c(
    "La ausencia de vacío se debe a fallos del sistema de vacío en la taponadora, a un tapón mal asentado que impide la formación de la depresión, o a microfugas del cierre que igualan presiones. También puede aparecer tras golpes que desasienten el tapón en unidades ya cerradas.",
    "El vacío es una barrera pasiva de integridad: sin él, cualquier microfuga permite el intercambio de aire y microorganismos, y el producto pierde una de sus protecciones frente a la contaminación secundaria. Además dificulta la extracción controlada del contenido en la administración. Defecto mayor que exige cuarentena de la unidad.",
    "Observa el tapón: en unidades con vacío, el coronamiento aparece ligeramente hundido y el disco del sello tenso. Al inclinar la botella, la ausencia de burbuja ascendente al invertir el envase delata falta de depresión. Si el procedimiento lo permite, la prueba de succión al perforar (solo en muestreo destructivo) confirma el diagnóstico.",
    "Segrega la unidad y comprueba unidades vecinas del mismo intervalo de taponado: los fallos de vacío suelen ser rachas de proceso. Registra el hallazgo y avisa al control en proceso para verificar el manómetro de la línea de vacío. No liberes la unidad aunque el contenido parezca correcto.",
    "Monitorización continua del vacío en la taponadora con registros automáticos, pruebas de integridad periódicas (método de azul de metileno o presión) y control del asentamiento del tapón antes del crimpeado. Mantén los sellos de la cámara de vacío en el plan de mantenimiento.",
    REG.LLENADO
  ),

  /* ─────────────── SELLADO ─────────────── */
  D016: c(
    "Las arrugas en la falda del sello se producen por aluminio con dureza inadecuada, golletes con pequeñas variaciones dimensionales o un crimpeado con fuerza mal distribuida. También aparecen cuando el disco del sello no queda perfectamente plano sobre el tapón antes del remachado. Son el defecto más frecuente y menos grave del cierre.",
    "Una arruga sin rotura no compromete la esterilidad en la mayoría de los casos, pero debilita localmente el cierre y puede progresar a doblez o microfuga tras el transporte. Además afecta a la uniformidad visual del lote. Se acepta dentro de límites, pero su frecuencia debe monitorizarse como indicador del proceso de crimpeado.",
    "Gira la botella y observa la falda de aluminio a la luz rasante: la arruga se ve como una ondulación persistente y suave en un sector del perímetro, sin sombra marcada ni pliegue agudo. Al tacto visual no hay borde cortante ni luz entre sello y vidrio. Diferénciala del doblez (D017), que tiene pliegue con sombra.",
    "Aplica el criterio de aceptación de la especificación visual: arruga localizada sin rotura ni luz bajo la falda se acepta con registro estadístico. Si la ondulación es continua en más del 50% del perímetro o aparece con otras anomalías, segrega la unidad. Registra la tendencia por turno.",
    "Control de dureza y lote del aluminio, verificación dimensional del gollete y calibración de las cabezas de crimpeado. Registra las arrugas como indicador de proceso (Pareto por turno) para actuar sobre la causa raíz antes de que deriven en defectos mayores.",
    REG.SELLADO
  ),
  D017: c(
    "El doblez lateral surge de una alimentación descentrada del sello sobre el tapón, de una cabeza de crimpeado desalineada o de un tapón sobresaliente que desplaza el disco al remachar. También lo provoca la manipulación brusca tras el crimpeado cuando la falda aún no ha asentado definitivamente.",
    "El pliegue concentra tensiones y crea un canal potencial entre sello y vidrio, con riesgo real de microfuga que compromete la esterilidad. La resistencia mecánica del cierre queda reducida y puede abrirse una vía de entrada microbiológica durante la vida útil. Se trata como defecto mayor con segregación obligatoria.",
    "Busca el pliegue agudo con sombra marcada en la falda, visible incluso sin contra luz. El perímetro deja de ser uniforme: al girar la botella, el doblez aparece como una línea de pliegue con cambio brusco de dirección. Comprueba si existe luz visible entre la falda doblada y el gollete.",
    "Segrega la unidad y regístrala como doblez lateral indicando su posición angular (reloj horario). Verifica unidades contiguas del mismo intervalo de crimpeado: si se repite en la misma posición angular, la cabeza implicada está desalineada y requiere intervención. Añade la unidad al muestreo de integridad si Calidad lo solicita.",
    "Alineación verificada de cabezas de crimpeado con comprobación de concentricidad, control de la altura de asiento del tapón antes del remachado y formación del personal de ajuste. Establece inspección específica de perímetro del sello en el muestreo en proceso.",
    REG.SELLADO
  ),
  D018: c(
    "El remache flojo se origina por una fuerza de crimpeado insuficiente, un disco central con espesor fuera de especificación o un tapón más alto del nominal que impide el apriete completo. La corrosión incipiente bajo el sello también puede aflojar el conjunto con el tiempo. Suele afectar a grupos de unidades del mismo ciclo de máquina.",
    "Un disco con juego permite el acceso de microorganismos por capilaridad hacia el tapón y la zona de perforación, comprometiendo la esterilidad. Además dificulta la perforación correcta en la administración y puede desplazar el punto de punción. Defecto mayor que exige segregación y revisión de la máquina implicada.",
    "Comprueba visualmente el disco central: en el remache flojo se aprecia desplazamiento lateral respecto al eje, vibración al girar la botella y a veces un anillo de reflejo distinto en la zona de unión. Si el procedimiento lo permite, la prueba suave de presión digital confirma la movilidad sin deformar el cierre.",
    "Segrega la unidad y regístra el hallazgo identificando la cabeza o turno de crimpeado si es posible. Solicita verificación de la fuerza de remachado y revisa el muestreo de unidades del mismo intervalo temporal. Las unidades con remache flojo no se liberan aunque no exista fuga visible.",
    "Verificación periódica de la fuerza de crimpeado con dinamómetro, control de espesor del disco del sello en la recepción de material y control de altura del tapón antes del remachado. Incluye la prueba de movilidad del disco en el muestreo destructivo periódico.",
    REG.SELLADO
  ),
  D019: c(
    "La perforación del sello procede casi siempre de impactos con objetos punzantes durante el manipulado, de herramientas mal ajustadas en la línea o de restos metálicos en las cubetas de transporte. En unidades ya administradas, corresponde a la punción de la aguja, pero en unidades selladas indica siempre un incidente de proceso o logístico.",
    "Es un fallo directo de la barrera estéril: el contenido se considera contaminado y su administración puede causar septicemia grave. Existe además riesgo de fuga durante la perfusión y de pérdida de aséptica en el equipo de administración. Rechazo crítico inmediato sin posibilidad de reevaluación.",
    "A contra luz, la perforación se ve como un punto nítido con borde metálico retorcido o levantado, generalmente en la falda o cerca del perímetro del disco. El traspaso puede confirmarse con la prueba de burbujeo si el procedimiento de muestreo lo contempla. Revisa también la superficie del tapón bajo el punto de punción.",
    "Segrega la unidad de inmediato como defecto crítico y regístra la localización exacta de la punción. Investiga el origen: revisa el entorno de manipulación (anillos, joyas, herramientas), el estado de las cubetas y los momentos de cambio de formato. Verifica unidades contiguas del mismo embalaje de transporte.",
    "Prohibición de objetos punzantes en la zona de manipulación, protección con bandejas individuales, y control de elementos metálicos en cubetas y racks. Incluye la inspección minuciosa del sello en la formación inicial del inspector y en la recertificación periódica.",
    REG.SELLADO
  ),
  D020: c(
    "El crimpeado incompleto se debe a una carrera insuficiente de la cabeza de remachado, sello con falda corta fuera de especificación o golletes con diámetro superior al nominal. También aparece tras paradas y arranques de la línea sin purga correcta de unidades parcialmente crimpadas.",
    "La falda despegada deja una vía de entrada directa de microorganismos hacia el tapón, con el consiguiente riesgo de contaminación de la perfusión. La resistencia mecánica del cierre es insuficiente y el sello puede desprenderse durante el transporte. Defecto mayor con segregación y probable ampliación de revisión al lote.",
    "Observa la unión falda-gollete girando la botella a la luz rasante: existe un arco visible de luz entre el aluminio y el vidrio superior a 90°, con la falda abierta como una campana. El borde inferior de la falda no abraza el gollete y puede moverse ligeramente al cambiar la inclinación del envase.",
    "Segrega la unidad y regístrala con la medida aproximada del arco despegado. Si el hallazgo se repite, detén la inspección y verifica el ajuste de las cabezas: el crimpeado incompleto suele ser racha de máquina y puede afectar a decenas de unidades consecutivas. Solicita muestreo ampliado del intervalo implicado.",
    "Verificación de carrera y presión de las cabezas en el plan de mantenimiento, control dimensional del gollete y del sello en recepción, y procedimiento de purga tras paradas de línea. Establece un control de primer artículo tras cada cambio de formato o intervención en la crimpeadora.",
    REG.SELLADO
  ),

  /* ─────────────── TAPÓN ─────────────── */
  D021: c(
    "El desplazamiento lateral del tapón proviene de una alimentación descentrada en la taponadora, canales de guiado desgastados o una botella con gollete ovalado fuera de tolerancia. Los choques posteriores al cierre también pueden desplazar un tapón mal asentado. Suele concentrarse en un intervalo concreto de la producción.",
    "Un tapón descentrado deja zonas de presión desigual sobre el sello y puede originar microfugas asimétricas, además de dificultar la perforación correcta en el punto central. La apertura puede generar partículas de goma desprendidas por rozamiento. Defecto mayor que exige segregación de la unidad.",
    "Observa el coronamiento frente a la botella girando lentamente: la distancia entre el borde del tapón y el sello debe ser uniforme en todo el perímetro. En el desplazamiento, un lado muestra más goma expuesta que el opuesto. La vista cenital ayuda a confirmar la excentricidad respecto al eje.",
    "Segrega la unidad y regístra la dirección aproximada del desplazamiento. Revisa las unidades contiguas del mismo intervalo: si el descentrado se repite, solicita verificación de los canales de alimentación de la taponadora. Comprueba también si existe luz irregular entre sello y tapón que aconseje prueba de integridad.",
    "Mantenimiento de canales y husillos de alimentación, verificación de concentricidad de la taponadora y control dimensional de golletes. Incluye la vista cenital del tapón en el patrón de inspección y registra los descentrados por turno como indicador de proceso.",
    REG.TAPON
  ),
  D022: c(
    "Las partículas adheridas al tapón proceden del entorno de la taponadora (polvo de aluminio del crimpeado, residuos de lavado), de fragmentos del propio tapón generados por rozamiento o de contactos con material de embalaje. El área de coronamiento es especialmente propensa a acumular residuos si el lavado del tapón es insuficiente.",
    "Una partícula en la zona de perforación puede introducirse en la solución al pinzar o perforar el tapón, con el riesgo de embolia o contaminación asociado. Si la partícula está incrustada, delata además un defecto del elastómero que puede generar fragmentación posterior. Defecto crítico cuando afecta a la zona de acceso.",
    "Inspeciona el coronamiento y los flancos del tapón con luz directa y rasante: busca puntos oscuros, restos brillantes o incrustaciones. Diferénciales de las marcas de moldeo (uniformes y en relieve) y del polvo superficial que se desplaza. La lupa ayuda a distinguir partícula incrustada de depósito suelto.",
    "Segrega la unidad si la partícula está en la zona de perforación o está incrustada; si es un depósito suelto fuera de la zona crítica, aplica el criterio de la especificación con registro. Informa del hallazgo porque puede indicar fallo en el lavado de tapones o en la aspiración previa al crimpeado.",
    "Validación del proceso de lavado y siliconado de tapones, aspiración de la zona de coronamiento antes del crimpeado y control ambiental de la taponadora. Manipula los tapones con utensilios limpios y evita el polvo de aluminio acumulado en la zona de crimpeado.",
    REG.TAPON
  ),
  D023: c(
    "Las grietas del elastómero proceden de formulaciones con exceso de fragilización, ciclos de esterilización excesivos o almacenamiento prolongado en atmósfera seca. El rozamiento con guías metálicas y las manipulaciones con herramienta también las generan. Aparecen con frecuencia junto a los canales de distribución del contenido.",
    "Una tapón agrietado puede desprender fragmentos de goma hacia la perfusión al perforarlo y pierde capacidad de resellado tras la punción, con riesgo de fuga en la administración. Si la grieta es profunda, la barrera frente a microorganismos queda comprometida. Defecto mayor con segregación obligatoria.",
    "Con luz rasante sobre el coronamiento, busca líneas ramificadas finas con microsombra, especialmente junto a los canales y el anillo central. Rota el tapón lentamente: las grietas destellan al cambiar el ángulo. Diferéncialas de las marcas de moldeo, que son limpias, continuas y no ramificadas.",
    "Segrega la unidad y documenta la localización y extensión de las grietas. Si aparecen varias unidades del mismo lote, consulta la trazabilidad del tapón (lote de goma, ciclo de esterilización): puede tratarse de una condición de material que afecte a todo el lote y requiera muestreo ampliado.",
    "Calificación de proveedores de elastómero con control de propiedades mecánicas, validación de ciclos de esterilización y control de humedad en almacén de tapones. Evita manipulaciones con herramienta metálica y revisa las guías de la taponadora sin aristas.",
    REG.TAPON
  ),
  D024: c(
    "El tapón sobresaliente se origina por altura de tapón fuera de tolerancia, una presión de asentamiento insuficiente en la taponadora o un sello remachado antes de que el tapón alcanzara su posición final. También aparece cuando el vacío posterior falla y el tapón «rebota» hacia arriba tras el crimpeado.",
    "Entre el coronamiento elevado y el disco del sello queda un espacio donde se alojan aire y posibles contaminantes, y la zona de perforación queda más expuesta. El remachado sobre un tapón alto genera tensiones que pueden originar remache flojo o doblez. Defecto mayor que suele venir agrupado por intervalos de máquina.",
    "Compara la altura libre entre el coronamiento y el disco del sello con las unidades vecinas: en el mal asentado, el espacio es claramente mayor y el tapón «flota» sobre el sello. La vista lateral a la altura de los ojos y contra una referencia es la técnica más fiable. Comprueba si además existe remache flojo asociado.",
    "Segrega la unidad y revisa las contiguas del mismo intervalo de taponado: el sobresaliente suele ser racha de ajuste de máquina. Registra el hallazgo y comunica al control en proceso para verificar la presión de asentamiento y la altura nominal de la partida de tapones en uso.",
    "Control de altura de tapones en recepción, verificación de la presión de asentamiento en la taponadora y control en línea de la altura libre tras el crimpeado. Establece un patrón visual de altura correcta en la zona de inspección como referencia del inspector.",
    REG.TAPON
  ),
  D025: c(
    "La anilla flip-off rota se debe a impactos o rozamientos durante el transporte y paletizado, a manipulaciones con anillas de otros envases o a fallos de inyección del propio componente plástico (líneas de inyección débiles). También se rompe al abrir sobres de forma brusca o enganchando la anilla en el material de embalaje.",
    "La anilla rota delata que el tapón pudo ser manipulado o presionado, y el borde roto expone la superficie de perforación a la contaminación ambiental. Aunque la botella siga sellada, la garantía de integridad del acceso queda reducida. Defecto menor en cuanto a barrera, pero con segregación recomendable según procedimiento.",
    "Comprueba que la lengüeta está completa y la anilla continua, sin bordes blanquecinos de rotura (típico del plástico estirado). Gira la botella para ver toda la circunferencia del coronamiento. Un borde blanquecino irregular o una lengüeta ausente confirman el defecto, aunque el plástico parezca en su sitio.",
    "Segrega la unidad conforme al criterio establecido (habitualmente rechazo) y regístra el estado exacto de la anilla. Revisa el proceso logístico de la zona donde se detectó: las anillas rotas suelen indicar rozamientos en bandejas o manipulación brusca de los sobres. Comprueba unidades contiguas del mismo embalaje.",
    "Diseño de embalaje que evite rozamiento del coronamiento, formación en apertura correcta de sobres y control de calidad del componente plástico en recepción. Registra las anillas rotas por lote: su tendencia delata problemas de manipulación en almacenaje o transporte.",
    REG.TAPON
  ),

  /* ─────────────── ETIQUETADO ─────────────── */
  D026: c(
    "La desalineación proviene de un ajuste incorrecto de la etiquetadora tras cambio de formato, velcro o guías desgastadas que descentran el envase, o variaciones de diámetro de la botella fuera de tolerancia. La velocidad excesiva de la línea también genera desplazamientos sistemáticos en un mismo sentido.",
    "Una etiqueta inclinada dificulta la lectura de datos críticos en la cabina de administración y delata una línea mal ajustada, pero no compromete la esterilidad ni el contenido. Su riesgo principal es la confusión de producto si impide ver correctamente concentración o vía de administración. Defecto menor con registro.",
    "Comprueba la paralelidad de los bordes de la etiqueta con el eje del envase a la altura de los ojos y la simetría de los márgenes superior e inferior. La referencia del fabricante (posición nominal impresa o marca física) establece la tolerancia admisible. La desviación visible a simple vista suele exceder tolerancia.",
    "Aplica el criterio de la especificación visual: desviaciones dentro de tolerancia se aceptan con registro estadístico. Segrega si la lectura de datos críticos resulta dificultosa o si la desviación es manifiesta. Si el defecto se repite con el mismo sentido de giro, avisa al ajuste de la etiquetadora.",
    "Ajuste documentado de la etiquetadora en cada cambio de formato con verificación de primer artículo, mantenimiento de guías y velcro, y control dimensional de envases. Registra las desalineaciones por turno como indicador del estado de ajuste de la línea.",
    REG.ETIQUETADO
  ),
  D027: c(
    "Las burbujas bajo la etiqueta se generan por humedad residual del envase al etiquetar, adhesivo mal activado por temperatura baja o presión insuficiente de las rodillos. También aparecen cuando la superficie del vidrio tiene microtexturas que impiden el asiento completo. Se concentran en partidas etiquetadas tras lavados recientes.",
    "El riesgo principal es el desprendimiento progresivo de la etiqueta durante la vida útil, con pérdida potencial de trazabilidad e información crítica. No afecta al contenido ni a la esterilidad. Defecto menor que debe monitorizarse porque su evolución temporal empeora.",
    "Observa la etiqueta a la luz rasante: los ojales de aire se ven como áreas circulares traslúcidas y brillantes, generalmente cerca de los bordes. Al pasar suavemente la vista (sin arrastrar el dedo si el procedimiento lo prohíbe), la etiqueta no asienta plano y el borde puede levantarse ligeramente.",
    "Acepta la unidad si los ojales son pequeños, periféricos y la etiqueta permanece adherida conforme a la especificación; regístrala como observación. Segrega si existen burbujas extensas, la etiqueta está levantada o los datos críticos quedan afectados. Vigila las partidas etiquetadas tras cambio de turno de lavado.",
    "Control de humedad del envase antes del etiquetado, validación de la temperatura de activación del adhesivo y mantenimiento de la presión de los rodillos. Ajusta el tiempo de secado tras el lavado y registra las burbujas por lote para correlacionar con las condiciones de línea.",
    REG.ETIQUETADO
  ),
  D028: c(
    "La impresión defectuosa procede de rodillos o cabezas de impresión desgastados, tinta con viscosidad incorrecta, o alimentación de etiquetas con superficie contaminada. Los cambios de lote de tinta sin verificación y los ajustes de contraste de los sistemas de impresión digital son causas habituales de caracteres incompletos.",
    "Sin una lectura clara del rótulo, el personal sanitario puede confundir el producto, la concentración o la vía, con riesgo clínico directo. La trazabilidad del lote también queda comprometida si el número no es legible. Defecto mayor que exige segregación de todas las unidades afectadas del intervalo de impresión.",
    "Comprueba la legibilidad de todos los campos impresos, especialmente producto, concentración, volumen, lote y caducidad, a la distancia de lectura habitual y con la iluminación de la zona. Busca caracteres incompletos, tinta difusa o contrastes insuficientes. Compara con la etiqueta de referencia del lote.",
    "Segrega la unidad y revisa el intervalo de impresión completo: los fallos de impresión son sistemáticos y afectan a grupos consecutivos. Registra el hallazgo y comunica al responsable de la etiquetadora para verificación de cabezas y tinta antes de reanudar. No aceptes unidades con campos críticos dudosos.",
    "Verificación de primer artículo tras cada cambio de tinta o formato, mantenimiento preventivo de cabezas de impresión y control de calidad del material de etiqueta. Establece una comprobación periódica de legibilidad durante la producción con plantilla de verificación.",
    REG.ETIQUETADO
  ),
  D029: c(
    "La caducidad errónea o ilegible se origina por un error de datos en el sistema de impresión (plantilla incorrecta, fecha mal calculada tras cambio de formato), doble impresión solapada o verificación humana insuficiente del primer artículo. Es una de las no conformidades más graves del rotulado pese a su simplicidad técnica.",
    "La administración de un producto caducado puede carecer de eficacia o haber generado degradados con riesgo toxicológico, y una caducidad ilegible impide al hospital gestionar su stock de forma segura. Es un defecto crítico que además tiene implicaciones regulatorias directas de trazabilidad y falsificación.",
    "Lee expresamente el campo de caducidad en cada unidad inspeccionada y contrástalo con la orden de producción o el rótulo de referencia: verifica día, mes y año completos, sin solapes ni caracteres dudosos. Cualquier ambigüedad se trata como error: la caducidad debe ser inequívoca.",
    "Detén la inspección de la unidad y segúrrala de inmediato. Comprueba el resto de unidades del intervalo de impresión y el primer artículo del cambio de formato implicado. Notifica a Calidad con prioridad: una caducidad errónea impresa en serie puede obligar a bloquear el lote completo y a notificar la desviación.",
    "Verificación obligatoria del primer artículo con doble firma tras cada cambio de formato o de datos, validación de las plantillas de impresión con control de cambios, y sistemas de lectura óptica en línea cuando sea posible. La formación del inspector debe incluir el contraste con la orden de producción.",
    REG.ETIQUETADO
  ),
  D030: c(
    "El lote ausente procede de una impresora que no ha estampado en el intervalo correspondiente (fallo de sensor, etiquetas alimentadas sin ciclo de impresión) o de etiquetas incorrectas sin el campo de lote en la partida montada. El cambio de formato sin verificación del primer artículo es la causa raíz más habitual.",
    "Sin número de lote es imposible la trazabilidad del producto: ante cualquier incidencia posterior (reclamación, retirada, hemovigilancia de reacciones), el hospital no puede identificar las unidades afectadas. La dispensación de unidades sin lote no es aceptable conforme a la normativa de identificaciÃ³n única. Defecto crítico.",
    "Verifica expresamente la presencia del lote estampado o impreso en cada unidad, en la posición definida por el rótulo de referencia. Una zona lisa sin relieve ni tinta donde debería figurar el lote confirma el defecto. Aprovecha la comprobación para contrastar el formato del lote con la orden de producción.",
    "Segrega la unidad y suspende la inspección para verificar el primer artículo de la partida de etiquetas en uso: si falta el lote en toda la partida, el problema afecta a miles de unidades y exige bloqueo inmediato. Registra el hallazgo y activa la investigación de Calidad con trazado del intervalo de etiquetadora.",
    "Control de cambios de partida de etiquetas con doble verificación del primer artículo, sensores de impresión con alarma de fallo y conciliación de etiquetas usadas/destruidas al final del lote. La conciliación es el control sistemático que detecta partidas sin estampar.",
    REG.ETIQUETADO
  ),
  D031: c(
    "El desgarro de la etiqueta proviene de rozamientos con guías desgastadas, manipulación brusca en el paletizado o choques entre unidades. También se genera al abrir los sobres de transporte si el diseño permite el contacto directo con la etiqueta. Las esquinas levantadas suelen preceder al desgarro completo.",
    "Una etiqueta desgarrada puede perder información crítica y facilita el desprendimiento completo durante la manipulación hospitalaria, con la consiguiente pérdida de trazabilidad. Si el desgarro expone el vidrio, puede acompañarse de otros defectos mecánicos. Defecto mayor cuando afecta a datos o extensión significativa del rótulo.",
    "Observa bordes fibrosos, esquinas levantadas o fragmento ausente y comprueba que la información esencial (producto, lote, caducidad) sigue completa y legible. Revisa el resto del envase ante un desgarro: suele venir acompañado de otros signos de impacto que deben evaluarse conjuntamente.",
    "Segrega la unidad si faltan datos críticos, si el desgarro es extenso o si la etiqueta corre riesgo de desprendimiento completo; en caso contrario aplica el criterio de la especificación con registro. Comprueba unidades vecinas del mismo embalaje, porque los rozamientos suelen afectar a varias unidades.",
    "Diseño de embalaje sin rozamiento de etiquetas, mantenimiento de guías de la línea y formación en paletizado correcto. Registra los desgarros por posición en la paleta: la correlación con zonas de presión permite ajustar el patrón de apilado y las protecciones.",
    REG.ETIQUETADO
  ),
  D032: c(
    "La doble etiqueta se produce por alimentación doble en la etiquetadora (dos etiquetas separadas mal por el sistema de pegado), reaplicación de etiqueta sobre otra previa tras un reproceso, o error de cambio de formato que monta dos juegos de rótulos. Es poco frecuente pero de gran impacto cuando ocurre.",
    "La información puede quedar oculta o contradecirse entre capas: el hospital puede leer datos de caducidad o concentración distintos según la capa visible, con riesgo de error de medicación directo. Además invalida la trazabilidad por conciliación de etiquetas. Defecto mayor con segregación e investigación de la causa.",
    "Comprueba visualmente el borde inferior y superior del rótulo: la doble capa muestra borde doble perceptible, distinto brillo entre zonas y a veces elevación palpable en el canto. Si la unidad pasa por reproceso, verifica expresamente que no exista etiqueta previa bajo la actual.",
    "Segrega la unidad y regístra la procedencia (línea directa o reproceso). Revisa la conciliación de etiquetas del lote implicado: una doble etiqueta desajusta el recuento y puede delatar reaplicaciones no documentadas. Comprueba si el dato visible coincide con la orden de producción antes de descartar contradicciones.",
    "Conciliación estricta de etiquetas con recuento de usadas y destruidas, procedimiento documentado de reetiquetado con retirada física de la etiqueta previa, y sensores de doble alimentación en la etiquetadora. El control del reproceso es la barrera más eficaz frente a este defecto.",
    REG.ETIQUETADO
  ),

  /* ─────────────── EMBALAJE ─────────────── */
  D033: c(
    "Las microperforaciones del envolvente proceden de rozamientos con superficies rugosas durante el transporte, pinzas o anillos en la manipulación, o fallos del material (Tyvek con poros excesivos fuera de especificación). El apilado con exceso de presión también genera perforaciones puntiformes en el contacto con esquinas.",
    "La barrera estéril pierde su función: aunque la botella parezca intacta, el contenido se considera expuesto a la contaminación ambiental desde el momento de la perforación. La unidad no puede garantizarse estéril y su uso está contraindicado. Defecto mayor que se evalúa como crítico según el procedimiento de la planta.",
    "Suspende el sobre a contra luz y busca puntos translúcidos localizados, contrastando con la textura uniforme del material sano. Palpa visualmente las zonas de esquina y pliegue, que son las más afectadas. Compara con una muestra de referencia del envolvente correcto para calibrar el criterio visual.",
    "Segrega la unidad: el envolvente perforado invalida la garantía de esterilidad con independencia del estado de la botella. Registra el hallazgo con la localización de la perforación y revisa las unidades contiguas del mismo embalaje de transporte, donde el rozamiento suele haber afectado a más de una unidad.",
    "Manipulación sin anillos ni objetos punzantes, superficies de trabajo lisas y limpias, y control de calidad del material de envolvente en recepción (porosidad y resistencia). Registra las perforaciones por posición en la caja para identificar zonas de presión del apilado.",
    REG.EMBALAJE
  ),
  D034: c(
    "La barrera abierta proviene de errores de manipulación (sobre abierto y recerrado sin documentar), fallos del adhesivo del cierre o del procesos de repackaje no autorizado. También aparece cuando el sellado térmico ha fallado parcialmente y la solapa cede con el transporte. Siempre delata una pérdida de garantía del sistema estéril.",
    "La esterilidad del conjunto no puede garantizarse: el interior del sobre se considera contaminado desde la apertura, con riesgo directo de infección nosocomial si la unidad se administra. Además impide verificar la integridad de la botella en condiciones controladas. Defecto crítico de rechazo obligatorio.",
    "Comprueba que la solapa está completamente sellada en todo el perímetro y que no existen trazas de apertura: adhesivo expuesto, solapa curvada hacia fuera, marcas de reintento o suciedad en el interior del cierre. Un sobre correctamente sellado se abre solo destruyendo el cierre de garantía.",
    "Segrega la unidad de inmediato como defecto crítico e investiga el origen: abierto en planta (error de manipulación) o en origen del proveedor (cierre defectuoso). Revisa las unidades contiguas del mismo lote de envolvente y notifica la desviación a Calidad con trazado del embalaje de procedencia.",
    "Sellado térmico validado con registro de parámetros, cierres de garantía irreversibles y formación en manipulación que prohíba la apertura y recolocación de unidades. El control visual del sello perimetral en la recepción detecta los fallos de origen del proveedor.",
    REG.EMBALAJE
  ),
  D035: c(
    "Las manchas proceden de humedad de almacenamiento, condensaciones tras ciclos térmicos, fugas de otras unidades o contacto con líquidos de limpieza durante la manipulación. Una aureola amarillenta puede delatar migración del contenido de una unidad vecina con fuga. El material húmedo pierde parcialmente su función de barrera.",
    "La humedad en el envolvente facilita la penetración de microorganismos por capilaridad y degrada el Tyvek, comprometiendo la esterilidad del conjunto con el tiempo. Aunque la botella esté intacta, la garantía estéril no puede mantenerse. Defecto mayor con evaluación de rechazo según extensión y naturaleza de la mancha.",
    "Observa aureolas de contorno irregular, zonas más oscuras o con brillo húmedo, y contrasta la textura: el material afectado se ve ondulado o endurecido. Diferénciales de las marcas de impresión del sobre, que son nítidas y sistemáticas. Revisa si la mancha procede de una unidad vecina con fuga visible.",
    "Segrega la unidad y las vecinas si la mancha sugiere fuga de origen. Regístra la localización, el color y la extensión aproximada. Si detectas varias manchas húmedas, revisa el pallet completo: las fugas en tránsito suelen afectar a grupos de unidades y exigen verificación del embalaje exterior.",
    "Almacenamiento seco y sobre estibas, protección frente a condensaciones en el transporte y separación de unidades con sospecha de fuga. El control de humedad relativa del almacén y la rotación de stock (FEFO) son las barreras preventivas principales.",
    REG.EMBALAJE
  ),
  D036: c(
    "Los defectos del sellado térmico se originan por temperatura, presión o tiempo fuera de los parámetros validados, material de envolvente con espesor variable, o contaminación en la zona de sellado (polvo, restos de producto). Las arrugas atravesantes aparecen cuando el material se pliega al introducir la unidad en el sobre.",
    "Un canal en el sello es una vía de entrada microbiológica directa: la unidad no puede considerarse estéril aunque su contenido esté intacto. Los tramos sin sellar permiten además la apertura involuntaria durante el transporte. Defecto crítico cuando el canal atraviesa la línea de cierre completa.",
    "Examina la línea de cierre completo buscando tramos brillantes sin textura de sellado, arrugas que atraviesan la banda de cierre de lado a lado, o desbordes de material fundido. Compara con el sellado de referencia validado. Cualquier discontinuidad visible en la banda continua se considera defecto.",
    "Segrega la unidad como defecto crítico si existe canal o tramo sin sellar, y regístra la posición del fallo en la línea de cierre. Revisa las unidades contiguas del mismo ciclo de sellado: los fallos térmicos son sistemáticos y afectan a grupos. Notifica al responsable del equipo de envasado con los datos del turno.",
    "Validación y calibración del equipo de sellado con registro de parámetros (temperatura, presión, tiempo), verificación periódica con papel de tornasol físico y control del material de envolvente. La inspección de la línea de cierre debe incluirse en la formación específica del inspector de embalaje.",
    REG.EMBALAJE
  ),

  /* ─────────────── DEFORMACIONES ─────────────── */
  D037: c(
    "La abolladura proviene de impactos mecánicos durante el paletizado, transporte o manipulación con carretilla, y de caídas de bandejas individuales. El vidrio deformado sin rotura delata un golpe absorbido que puede haber generado tensiones internas no visibles en la zona del hundimiento.",
    "Aunque la unidad no presente rotura, la zona abollada concentra tensiones que pueden evolucionar a fisura tras ciclos térmicos posteriores o nuevos impactos. Además dificulta el manejo en las cabinas de administración. Defecto mayor con segregación y evaluación del resto de unidades del embalaje implicado.",
    "Observa el reflejo regular de la superficie: la abolladura distorsiona el reflejo con un hundimiento de contorno suave, generalmente elíptico. Rota la botella a la luz rasante para localizar deformaciones que no se ven frontalmente. Comprueba si existen marcas de impacto concéntricas (típicas del contacto con superficie dura).",
    "Segrega la unidad y regístra la localización y el diámetro aproximado del hundimiento. Revisa las unidades del mismo embalaje de transporte: las abolladuras suelen indicar golpes de paletizado que afectan a varias unidades contiguas. Evalúa si existen fisuras asociadas antes de clasificar el rechazo.",
    "Diseño de embalaje con absorción de impactos, formación en paletizado estable y control de aceleraciones del transporte. Mantén las guías de la línea sin salientes y registra las abolladuras por posición en la paleta para ajustar el patrón de estibado.",
    REG.DEFORMACION
  ),
  D038: c(
    "La base deformada procede de moldeado con temperatura insuficiente del fondo, apoyo sobre objetos duros durante el enfriamiento o impactos en la base que han desplazado la geometría sin llegar a craterizar. Las botellas apoyadas sobre restos de vidrio en las cubetas desarrollan punturas en el fondo con facilidad.",
    "Una base irregular impide el apoyo estable del envase en la cabina de administración y en los soportes hospitalarios, con riesgo de vuelco y derrame del contenido. La deformación también concentra tensiones que pueden derivar en fisura de base. Defecto mayor que debe detectarse antes de la distribución.",
    "Sitúa la botella sobre superficie plana y comprueba que no bascula: el envase correcto apoya estable y sin balanceo. Complementa con la inspección visual del fondo a contra luz buscando puntas, salientes o zonas de contacto anómalo. La prueba de rotación sobre la mesa revela el apoyo irregular.",
    "Segrega la unidad y regístra el tipo de deformación (punta, hundimiento, ovalización del fondo). Si el defecto se repite en el lote, consulta el certificado dimensional del fabricante de vidrio y el control de entrada: puede ser una partida completa fuera de tolerancia. Informa a Calidad de la tendencia.",
    "Control dimensional de entrada por lotes de vidrio con comprobación de apoyo en superficie de referencia, mantenimiento de cubetas y racks sin residuos duros, y calificación del proveedor con seguimiento de reclamos dimensionales. Registra las bases deformadas por lote de vidrio.",
    REG.DEFORMACION
  ),
  D039: c(
    "La ovalización se genera en el moldeado por una distribución desigual del fundido o una temperatura de molde baja, y posteriormente por presiones laterales en el transporte (paletizado excesivamente apretado o cintas de sujeción tensadas). El vidrio mantiene memoria de la presión aplicada en caliente.",
    "Una sección elíptica fuera de tolerancia afecta al encaje del envase en soportes y cabina de administración, y puede impedir el cierre correcto en la zona del gollete si la ovalización alcanza el cuello. La resistencia mecánica queda reducida en los ejes mayor. Defecto mayor con segregación de la unidad.",
    "Observa la silueta girando la botella frente a una referencia circular: el achatado se aprecia como variación del ancho aparente al rotar. Compara el ancho en dos ejes perpendiculares con una regla o con la plantilla dimensional si el procedimiento la contempla. La vista desde arriba revela la elipticidad del cuello.",
    "Segrega la unidad si la ovalización es visible a simple vista o supera la tolerancia dimensional. Registra la orientación del eje mayor: si es sistemática, apunta a la dirección de presión del paletizado. Verifica unidades contiguas de la misma capa de estiba antes de cerrar la evaluación.",
    "Control de presión de paletizado con límites definidos, calibración de las cintas de sujeción y control dimensional en recepción de vidrio. Evita estibas que presionen lateralmente las unidades y revisa la temperatura de moldeo con el proveedor si la tendencia se mantiene.",
    REG.DEFORMACION
  ),
  D040: c(
    "El peso fuera de rango proviene de variaciones del volumen de llenado (dosificadora desviada), de envases con espesor de pared anómalo o de conjuntos con componentes (tapón, sello) de otra referencia. Las balanzas mal calibradas o con deriva también generan falsos desvíos que deben distinguirse del defecto real.",
    "Un peso bajo indica falta de contenido (infra dosis al paciente) y un peso alto sugiere sobredosificación o exceso de presión interna, ambos clínicamente relevantes en sueros con principio activo. Es el control agregado que detecta problemas sistemáticos del proceso de llenado. Defecto mayor con investigación del intervalo implicado.",
    "La detección se realiza en báscula de control: compara el peso bruto con los límites establecidos para la referencia. Complementa con la inspección visual del nivel de llenado y de la cámara de aire. Un desvío sistemático en el mismo sentido apunta a calibración de la dosificadora; uno aleatorio, a variabilidad de proceso.",
    "Segrega la unidad y verifica el peso con segunda báscula calibrada antes de confirmar el rechazo. Registra el valor y analiza el intervalo de llenado correspondiente: si existen más desvíos, amplia el muestreo y solicita verificación de la dosificadora. Documenta la decisión conforme al procedimiento de Calidad.",
    "Verificación diaria de las básculas de control con pesas patrón, control estadístico del peso medio del lote y correlación con el volumen dosificado. Establece límites de acción intermedios para detectar derivas antes de superar la especificación del peso bruto.",
    REG.DEFORMACION
  ),
};
