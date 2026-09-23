const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  TableOfContents, Header, Footer, PageNumber, NumberFormat,
  convertInchesToTwip, ImageRun, Tab, TabStopPosition, TabStopType,
  VerticalAlign, PageBreak
} = require("docx");
const fs = require("fs");

// ============================================================
// DATA
// ============================================================

const proyecto = {
  codigo: "VCD25213",
  obra: "Obra 05",
  nombre: "Gas Lift PAD LAA-43",
  descripcion: "Línea de gas lift de 4\" entre Colector PTC2 LACH y PAD LAA-43",
  yacimiento: "LACH",
  clasificacion: "No Convencional",
  nomenclatura: "LACh-DUCGASLIFTPAD43-VCD25213",
  contratista: "CODESIN SA",
  cliente: "YPF S.A.",
  fechaInforme: "07/09/2026",
  responsable: "D.M.",
};

const cronograma = {
  inicioIngenieria: "02/02/2026",
  finIngRev0: "03/07/2026",
  inicioObra: "04/02/2026",
  fechaPEM: "22/04/2026",
  disciplinas: [
    { nombre: "Relevamiento de campo", inicio: "02/02/2026", fin: "04/02/2026", avance: 100 },
    { nombre: "Electricidad", inicio: "02/02/2026", fin: "24/04/2026", avance: 100 },
    { nombre: "Ingeniería General", inicio: "23/03/2026", fin: "07/05/2026", avance: 100 },
    { nombre: "Civil", inicio: "06/04/2026", fin: "05/05/2026", avance: 90 },
    { nombre: "Piping / Cañerías", inicio: "07/04/2026", fin: "12/05/2026", avance: 100 },
    { nombre: "Procesos", inicio: "27/04/2026", fin: "04/05/2026", avance: 100 },
    { nombre: "Mecánica", inicio: "01/07/2026", fin: "03/07/2026", avance: 85 },
  ],
};

const kpis = {
  avanceIng: 85,
  dataBook: 90,
  cao: 85,
  balanceMateriales: 100,
  desvio: 0,
  prioridad: "Alta",
  criticidad: "Alta",
};

const documentos = [
  { disciplina: "General", codigo: "G-LD-019001", descripcion: "Listado de Documentos", rev: "OA", estado: "Emitido", fecha: "15/07/2026" },
  { disciplina: "General", codigo: "G-IF-019001", descripcion: "Informes Técnicos", rev: "-", estado: "Pendiente", fecha: "-" },
  { disciplina: "General", codigo: "G-MD-019001", descripcion: "Memoria Descriptiva", rev: "-", estado: "Pendiente", fecha: "-" },
  { disciplina: "General", codigo: "G-PL-019001", descripcion: "Plano de Interferencias - Geo Radar", rev: "E0", estado: "Emitido", fecha: "13/05/2026" },
  { disciplina: "Procesos", codigo: "R-PI-019001", descripcion: "Diagrama de Proceso P&ID", rev: "OA", estado: "Emitido", fecha: "15/07/2026" },
  { disciplina: "Procesos", codigo: "R-LT-019001", descripcion: "Listado de Tie Ins", rev: "-", estado: "Pendiente", fecha: "-" },
  { disciplina: "Cañerías", codigo: "P-LY-019001", descripcion: "Layout de Cañerías Zona 1 y 2", rev: "OA", estado: "Emitido", fecha: "15/07/2026" },
  { disciplina: "Cañerías", codigo: "P-PL-019001", descripcion: "Planialtimetría Ducto", rev: "E0", estado: "Emitido", fecha: "15/07/2026" },
  { disciplina: "Cañerías", codigo: "P-IS-019001", descripcion: "Cuadernillo de Isométricos", rev: "-", estado: "Pendiente", fecha: "-" },
  { disciplina: "Cañerías", codigo: "P-TI-019001", descripcion: "Típico Cuello de Cisne Ducto", rev: "E0", estado: "Emitido", fecha: "07/04/2026" },
  { disciplina: "Cañerías", codigo: "P-TI-019002", descripcion: "Típico Zona Cauce Corte A-A y B-B", rev: "E0", estado: "Emitido", fecha: "15/04/2026" },
  { disciplina: "Civil", codigo: "C-PL-019001", descripcion: "Cuadernillo Bases para Soportes", rev: "E0", estado: "Emitido", fecha: "15/04/2026" },
  { disciplina: "Civil", codigo: "C-PL-019002", descripcion: "Muertos de Anclaje", rev: "E0", estado: "Emitido", fecha: "07/04/2026" },
  { disciplina: "Civil", codigo: "C-TI-019001", descripcion: "Típico Cruce de Camino", rev: "E0", estado: "Emitido", fecha: "07/04/2026" },
  { disciplina: "Mecánica", codigo: "M-MC-019001", descripcion: "Memoria de Cálculo de Colectores", rev: "-", estado: "Pendiente", fecha: "-" },
  { disciplina: "E&I", codigo: "I-MC-019001", descripcion: "MC Eléctrica / Instrumentación", rev: "-", estado: "Pendiente", fecha: "-" },
];

const bloqueos = [
  {
    id: "BLQ-01",
    tipo: "Técnico",
    descripcion: "Discrepancia de espesores entre Memoria de Cálculo (7,14 mm) y Estudio de Riesgo Hídrico (6,02 mm). Mínimo de integridad mecánica: 5,40 mm.",
    impacto: "Alto",
    accion: "Emisión de Consulta Técnica (TQ) formal para unificar criterio de pedido de materiales.",
    responsable: "Ingeniería / YPF",
    estado: "Abierto",
  },
  {
    id: "BLQ-02",
    tipo: "Geodésico",
    descripcion: "Desplazamiento de coordenadas entre Estudio Hidrológico y OMA de diseño: hasta 67 m en PRH 4. Riesgo de soterramiento fuera de cauce real.",
    impacto: "Crítico",
    accion: "Validación y corrección mediante hallazgos de cateos y geodetección.",
    responsable: "Topografía / Campo",
    estado: "En validación",
  },
  {
    id: "BLQ-03",
    tipo: "Documental",
    descripcion: "Inconsistencia de control de versiones: Memoria Técnica Rev.2 (externo) vs Rev.0 (interno). Nomenclatura dual ID1173 vs VCD25213/03.",
    impacto: "Alto",
    accion: "Emitir nueva revisión unificada que vincule ambas nomenclaturas.",
    responsable: "Ingeniería General",
    estado: "Pendiente",
  },
  {
    id: "BLQ-04",
    tipo: "Técnico",
    descripcion: "Falta de análisis de estrés mecánico. Reportado como pendiente desde 15/06/2026.",
    impacto: "Alto",
    accion: "Asignar ingeniería para análisis de estrés y completar cierre CAO.",
    responsable: "Ingeniería Mecánica",
    estado: "Pendiente",
  },
  {
    id: "BLQ-05",
    tipo: "Técnico",
    descripcion: "Omisión de PRH 5 y 6 en tablas de cálculo de erosión. Discrepancia de longitud: 177,34 m vs 117,34 m en soterramiento.",
    impacto: "Alto",
    accion: "Integrar cálculos de socavación y resolver discrepancia vía TQ.",
    responsable: "Ingeniería Civil / Hidrología",
    estado: "Abierto",
  },
  {
    id: "BLQ-06",
    tipo: "Interferencia",
    descripcion: "Ducto paralelo LOC-LAA-43 a CONSUR3 con datos de localización aproximados. Máxima criticidad en tramo norte.",
    impacto: "Crítico",
    accion: "Cateos manuales cada 70 m y restricción de maquinaria pesada (sin retro 320/416).",
    responsable: "Supervisión de Campo",
    estado: "En ejecución",
  },
  {
    id: "BLQ-07",
    tipo: "Documental",
    descripcion: "Pendientes civiles en Data Book (90% completado). Falta cierre de documentación civil para entrega completa DB+CAO.",
    impacto: "Medio",
    accion: "Completar documentación civil pendiente. Entrega comprometida: 24/07/2026.",
    responsable: "Ingeniería Civil / Calidad",
    estado: "En proceso",
  },
];

const planAcciones = [
  { nro: 1, accion: "Emisión de TQ de espesores (7,14 mm vs 6,02 mm)", prioridad: "Urgente", fechaLimite: "Inmediato", responsable: "Ingeniería", estado: "Pendiente" },
  { nro: 2, accion: "Validación de coordenadas PRH mediante cateos y geodetección", prioridad: "Urgente", fechaLimite: "Previo a zanjeo", responsable: "Topografía", estado: "En validación" },
  { nro: 3, accion: "Resolución discrepancia longitud soterramientos PRH 5-6 (177m vs 117m)", prioridad: "Urgente", fechaLimite: "Inmediato", responsable: "Ingeniería Civil", estado: "Pendiente" },
  { nro: 4, accion: "Unificación de nomenclatura documental (ID1173 ↔ VCD25213/03)", prioridad: "Alta", fechaLimite: "Próxima revisión", responsable: "Ingeniería Gral.", estado: "Pendiente" },
  { nro: 5, accion: "Completar análisis de estrés mecánico", prioridad: "Alta", fechaLimite: "15/09/2026", responsable: "Ing. Mecánica", estado: "Pendiente" },
  { nro: 6, accion: "Completar documentación civil pendiente en Data Book", prioridad: "Alta", fechaLimite: "30/09/2026", responsable: "Ing. Civil", estado: "En proceso" },
  { nro: 7, accion: "Cierre CAO integral (actualmente 85%)", prioridad: "Alta", fechaLimite: "15/10/2026", responsable: "Calidad", estado: "En proceso" },
  { nro: 8, accion: "Emisión de isométricos 'Aptos para Construcción' post-TQ espesores", prioridad: "Media", fechaLimite: "Post TQ", responsable: "Cañerías", estado: "Bloqueado" },
  { nro: 9, accion: "Carga completa Data Book en Documentum", prioridad: "Media", fechaLimite: "30/10/2026", responsable: "Calidad / Doc. Control", estado: "Pendiente" },
  { nro: 10, accion: "Asistencia a PEM y Comisionado", prioridad: "Media", fechaLimite: "Según cronograma", responsable: "Equipo proyecto", estado: "Programado" },
];

// ============================================================
// HELPERS
// ============================================================

const COLORS = {
  ypfBlue: "003366",
  headerBg: "1F4E79",
  headerText: "FFFFFF",
  altRow: "D6E4F0",
  greenBg: "C6EFCE",
  yellowBg: "FFEB9C",
  redBg: "FFC7CE",
  orangeBg: "F4B084",
  lightGray: "F2F2F2",
  darkGray: "404040",
  black: "000000",
  white: "FFFFFF",
};

function headerCell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text, bold: true, color: COLORS.headerText, size: 18, font: "Calibri" })],
    })],
  });
}

function dataCell(text, opts = {}) {
  const bgColor = opts.bg || (opts.altRow ? COLORS.altRow : COLORS.white);
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before: 30, after: 30 },
      children: [new TextRun({
        text: String(text),
        size: 18,
        font: "Calibri",
        bold: opts.bold || false,
        color: opts.color || COLORS.darkGray,
      })],
    })],
  });
}

function statusColor(estado) {
  const e = (estado || "").toLowerCase();
  if (e.includes("emitido") || e.includes("completo") || e === "100") return COLORS.greenBg;
  if (e.includes("proceso") || e.includes("validación") || e.includes("ejecución")) return COLORS.yellowBg;
  if (e.includes("pendiente") || e.includes("bloqueado") || e.includes("abierto")) return COLORS.redBg;
  return COLORS.white;
}

function impactoColor(impacto) {
  const i = (impacto || "").toLowerCase();
  if (i === "crítico") return COLORS.redBg;
  if (i === "alto") return COLORS.orangeBg;
  if (i === "medio") return COLORS.yellowBg;
  return COLORS.greenBg;
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, color: COLORS.ypfBlue, font: "Calibri" })],
  });
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({
      text,
      size: 20,
      font: "Calibri",
      bold: opts.bold || false,
      italics: opts.italic || false,
    })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 20, font: "Calibri" })],
  });
}

function separator() {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.headerBg } },
    children: [],
  });
}

function kpiBar(label, value, total = 100) {
  const pct = Math.round((value / total) * 100);
  const filled = Math.round(pct / 5);
  const empty = 20 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  const color = pct >= 90 ? "00B050" : pct >= 70 ? "FFC000" : "FF0000";
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({ text: `${label}: `, size: 20, font: "Calibri", bold: true }),
      new TextRun({ text: bar, size: 20, font: "Consolas", color }),
      new TextRun({ text: ` ${pct}%`, size: 20, font: "Calibri", bold: true, color }),
    ],
  });
}

// ============================================================
// BUILD DOCUMENT
// ============================================================

const doc = new Document({
  creator: "CODESIN SA",
  title: `Informe de Ingeniería VCD25213 - Gas Lift PAD LAA-43`,
  description: "Informe de estado de ingeniería, KPIs, plan de acciones y bloqueos",
  styles: {
    default: {
      document: {
        run: { size: 20, font: "Calibri" },
        paragraph: { spacing: { line: 276 } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.8),
            bottom: convertInchesToTwip(0.8),
            left: convertInchesToTwip(0.9),
            right: convertInchesToTwip(0.9),
          },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "CODESIN SA", bold: true, size: 16, font: "Calibri", color: COLORS.ypfBlue }),
              new TextRun({ text: "  |  ", size: 16, font: "Calibri", color: "999999" }),
              new TextRun({ text: `VCD25213 - Gas Lift PAD LAA-43`, size: 16, font: "Calibri", color: "666666" }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Pág. ", size: 16, font: "Calibri", color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Calibri", color: "999999" }),
              new TextRun({ text: " de ", size: 16, font: "Calibri", color: "999999" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: "Calibri", color: "999999" }),
            ],
          })],
        }),
      },
      children: [
        // ========== CARÁTULA ==========
        new Paragraph({ spacing: { before: 600 }, children: [] }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "CODESIN SA", bold: true, size: 40, font: "Calibri", color: COLORS.ypfBlue })],
        }),

        separator(),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 100 },
          children: [new TextRun({ text: "INFORME DE INGENIERÍA", bold: true, size: 36, font: "Calibri", color: COLORS.headerBg })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: "Estatus, KPIs, Plan de Acciones y Bloqueos", size: 28, font: "Calibri", color: COLORS.darkGray })],
        }),

        separator(),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        // Tabla de datos del proyecto
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              dataCell("Proyecto:", { bold: true, width: 25 }),
              dataCell(proyecto.nombre, { width: 75 }),
            ]}),
            new TableRow({ children: [
              dataCell("Código YPF:", { bold: true }),
              dataCell(proyecto.codigo + " / " + proyecto.obra),
            ]}),
            new TableRow({ children: [
              dataCell("Descripción:", { bold: true }),
              dataCell(proyecto.descripcion),
            ]}),
            new TableRow({ children: [
              dataCell("Yacimiento:", { bold: true }),
              dataCell(proyecto.yacimiento + " (" + proyecto.clasificacion + ")"),
            ]}),
            new TableRow({ children: [
              dataCell("Nomenclatura:", { bold: true }),
              dataCell(proyecto.nomenclatura),
            ]}),
            new TableRow({ children: [
              dataCell("Contratista:", { bold: true }),
              dataCell(proyecto.contratista),
            ]}),
            new TableRow({ children: [
              dataCell("Cliente:", { bold: true }),
              dataCell(proyecto.cliente),
            ]}),
            new TableRow({ children: [
              dataCell("Fecha de informe:", { bold: true }),
              dataCell(proyecto.fechaInforme),
            ]}),
            new TableRow({ children: [
              dataCell("Responsable:", { bold: true }),
              dataCell(proyecto.responsable),
            ]}),
          ],
        }),

        new Paragraph({
          spacing: { before: 600 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "DOCUMENTO CONFIDENCIAL - USO INTERNO", size: 18, font: "Calibri", italics: true, color: "999999" })],
        }),

        // ========== PÁGINA 2: ÍNDICE ==========
        new Paragraph({ children: [new PageBreak()] }),

        heading("ÍNDICE"),
        separator(),
        bodyText("1. Estatus de Ingeniería"),
        bodyText("2. KPIs del Proyecto"),
        bodyText("3. Cronograma por Disciplina"),
        bodyText("4. Estado de Emisión de Documentos"),
        bodyText("5. Lista de Bloqueos y Definiciones Pendientes"),
        bodyText("6. Plan de Acciones para Cumplimiento"),
        bodyText("7. Diagrama de Avance y Gráficas"),
        bodyText("8. Discrepancias Técnicas Críticas"),
        bodyText("9. Conclusiones y Próximos Pasos"),

        // ========== 1. ESTATUS DE INGENIERÍA ==========
        new Paragraph({ children: [new PageBreak()] }),

        heading("1. Estatus de Ingeniería"),
        separator(),

        bodyText("El proyecto VCD25213 - Gas Lift PAD LAA-43 se encuentra en fase de cierre de ingeniería de detalle con documentación CAO al 85%. Se reportan pendientes civiles y análisis de estrés mecánico que condicionan la entrega integral del Data Book."),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              headerCell("Indicador", { width: 35 }),
              headerCell("Valor", { width: 25 }),
              headerCell("Objetivo", { width: 20 }),
              headerCell("Estado", { width: 20 }),
            ]}),
            new TableRow({ children: [
              dataCell("Avance Ingeniería", { bold: true }),
              dataCell("85%", { center: true }),
              dataCell("100%", { center: true }),
              dataCell("En curso", { center: true, bg: COLORS.yellowBg }),
            ]}),
            new TableRow({ children: [
              dataCell("Data Book", { bold: true }),
              dataCell("90%", { center: true }),
              dataCell("100%", { center: true }),
              dataCell("Pendientes C", { center: true, bg: COLORS.yellowBg }),
            ]}),
            new TableRow({ children: [
              dataCell("CAO (Conforme a Obra)", { bold: true }),
              dataCell("85%", { center: true }),
              dataCell("100%", { center: true }),
              dataCell("En proceso", { center: true, bg: COLORS.yellowBg }),
            ]}),
            new TableRow({ children: [
              dataCell("Balance de Materiales", { bold: true }),
              dataCell("100%", { center: true }),
              dataCell("100%", { center: true }),
              dataCell("Completo", { center: true, bg: COLORS.greenBg }),
            ]}),
            new TableRow({ children: [
              dataCell("Desvío de Avance", { bold: true }),
              dataCell("0%", { center: true }),
              dataCell("0%", { center: true }),
              dataCell("Sin desvío", { center: true, bg: COLORS.greenBg }),
            ]}),
          ],
        }),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        bodyText("Fuente de datos: Status Planning 02/07/2026, actualización de Planificación (J. L. Dimarco). Última revisión de la Matriz Maestra: Rev. 4.", { italic: true }),

        // ========== 2. KPIs ==========
        new Paragraph({ children: [new PageBreak()] }),

        heading("2. KPIs del Proyecto"),
        separator(),

        bodyText("Indicadores clave de rendimiento al corte del presente informe:"),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        kpiBar("Ingeniería Detalle  ", kpis.avanceIng),
        kpiBar("Data Book           ", kpis.dataBook),
        kpiBar("CAO                 ", kpis.cao),
        kpiBar("Balance Materiales  ", kpis.balanceMateriales),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              headerCell("KPI", { width: 40 }),
              headerCell("Valor", { width: 20 }),
              headerCell("Semáforo", { width: 20 }),
              headerCell("Tendencia", { width: 20 }),
            ]}),
            new TableRow({ children: [
              dataCell("Prioridad del proyecto"),
              dataCell("Alta", { center: true, bold: true }),
              dataCell("●", { center: true, color: "FF0000", bg: COLORS.redBg }),
              dataCell("Estable", { center: true }),
            ]}),
            new TableRow({ children: [
              dataCell("Criticidad"),
              dataCell("Alta", { center: true, bold: true }),
              dataCell("●", { center: true, color: "FF0000", bg: COLORS.redBg }),
              dataCell("Estable", { center: true }),
            ]}),
            new TableRow({ children: [
              dataCell("Desvío programado"),
              dataCell("0%", { center: true, bold: true }),
              dataCell("●", { center: true, color: "00B050", bg: COLORS.greenBg }),
              dataCell("Positiva", { center: true }),
            ]}),
            new TableRow({ children: [
              dataCell("Bloqueos abiertos"),
              dataCell("7", { center: true, bold: true }),
              dataCell("●", { center: true, color: "FF0000", bg: COLORS.redBg }),
              dataCell("Atención", { center: true }),
            ]}),
            new TableRow({ children: [
              dataCell("Documentos emitidos / total"),
              dataCell("10 / 16", { center: true, bold: true }),
              dataCell("●", { center: true, color: "FFC000", bg: COLORS.yellowBg }),
              dataCell("Avanzando", { center: true }),
            ]}),
          ],
        }),

        // ========== 3. CRONOGRAMA ==========
        new Paragraph({ children: [new PageBreak()] }),

        heading("3. Cronograma por Disciplina"),
        separator(),

        bodyText("Fechas clave del proyecto según cronograma Rev.02 (reprogramación):"),

        new Paragraph({ spacing: { before: 100 }, children: [] }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              headerCell("Hito", { width: 50 }),
              headerCell("Fecha", { width: 25 }),
              headerCell("Estado", { width: 25 }),
            ]}),
            new TableRow({ children: [
              dataCell("Inicio de ingeniería"),
              dataCell(cronograma.inicioIngenieria, { center: true }),
              dataCell("Cumplido", { center: true, bg: COLORS.greenBg }),
            ]}),
            new TableRow({ children: [
              dataCell("Fin ingeniería Rev.0"),
              dataCell(cronograma.finIngRev0, { center: true }),
              dataCell("Cumplido", { center: true, bg: COLORS.greenBg }),
            ]}),
            new TableRow({ children: [
              dataCell("Inicio de obra"),
              dataCell(cronograma.inicioObra, { center: true }),
              dataCell("Cumplido", { center: true, bg: COLORS.greenBg }),
            ]}),
            new TableRow({ children: [
              dataCell("Fecha PEM (cronograma)"),
              dataCell(cronograma.fechaPEM, { center: true }),
              dataCell("Vencido", { center: true, bg: COLORS.redBg }),
            ]}),
          ],
        }),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        bodyText("Avance por disciplina:"),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              headerCell("Disciplina", { width: 30 }),
              headerCell("Inicio", { width: 15 }),
              headerCell("Fin", { width: 15 }),
              headerCell("% Avance", { width: 15 }),
              headerCell("Estado", { width: 25 }),
            ]}),
            ...cronograma.disciplinas.map((d, i) =>
              new TableRow({ children: [
                dataCell(d.nombre, { altRow: i % 2 === 1 }),
                dataCell(d.inicio, { center: true, altRow: i % 2 === 1 }),
                dataCell(d.fin, { center: true, altRow: i % 2 === 1 }),
                dataCell(d.avance + "%", { center: true, altRow: i % 2 === 1, bold: true }),
                dataCell(d.avance === 100 ? "Completo" : "En curso", {
                  center: true,
                  bg: d.avance === 100 ? COLORS.greenBg : COLORS.yellowBg,
                }),
              ]})
            ),
          ],
        }),

        // Diagrama Gantt textual
        new Paragraph({ spacing: { before: 200 }, children: [] }),
        bodyText("Diagrama de barras por disciplina (representación proporcional):"),
        new Paragraph({ spacing: { before: 100 }, children: [] }),

        ...cronograma.disciplinas.map(d => {
          const startDate = new Date(d.inicio.split("/").reverse().join("-"));
          const endDate = new Date(d.fin.split("/").reverse().join("-"));
          const projStart = new Date("2026-02-02");
          const projEnd = new Date("2026-07-03");
          const totalDays = (projEnd - projStart) / (1000 * 60 * 60 * 24);
          const offsetDays = Math.max(0, (startDate - projStart) / (1000 * 60 * 60 * 24));
          const durationDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
          const offsetChars = Math.round((offsetDays / totalDays) * 30);
          const barChars = Math.max(1, Math.round((durationDays / totalDays) * 30));
          const bar = " ".repeat(offsetChars) + "█".repeat(barChars);
          const color = d.avance === 100 ? "00B050" : "FFC000";

          return new Paragraph({
            spacing: { before: 30, after: 30 },
            children: [
              new TextRun({ text: d.nombre.padEnd(24), size: 16, font: "Consolas" }),
              new TextRun({ text: bar, size: 16, font: "Consolas", color }),
              new TextRun({ text: ` ${d.avance}%`, size: 16, font: "Consolas", bold: true }),
            ],
          });
        }),

        new Paragraph({
          spacing: { before: 40 },
          children: [
            new TextRun({ text: "                        ", size: 16, font: "Consolas" }),
            new TextRun({ text: "Feb   Mar   Abr   May   Jun   Jul", size: 14, font: "Consolas", color: "999999" }),
          ],
        }),

        // ========== 4. EMISIÓN DOCUMENTOS ==========
        new Paragraph({ children: [new PageBreak()] }),

        heading("4. Estado de Emisión de Documentos"),
        separator(),

        bodyText(`Listado master de documentos del proyecto según LD Rev. OA (15/07/2026). Nomenclatura base: ${proyecto.nomenclatura}.`),

        new Paragraph({ spacing: { before: 100 }, children: [] }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              headerCell("Disciplina", { width: 12 }),
              headerCell("Código", { width: 18 }),
              headerCell("Descripción", { width: 32 }),
              headerCell("Rev.", { width: 8 }),
              headerCell("Estado", { width: 14 }),
              headerCell("Fecha", { width: 16 }),
            ]}),
            ...documentos.map((d, i) =>
              new TableRow({ children: [
                dataCell(d.disciplina, { altRow: i % 2 === 1 }),
                dataCell(d.codigo, { altRow: i % 2 === 1 }),
                dataCell(d.descripcion, { altRow: i % 2 === 1 }),
                dataCell(d.rev, { center: true, altRow: i % 2 === 1 }),
                dataCell(d.estado, { center: true, bg: statusColor(d.estado) }),
                dataCell(d.fecha, { center: true, altRow: i % 2 === 1 }),
              ]})
            ),
          ],
        }),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        // Resumen emisión
        new Table({
          width: { size: 60, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              headerCell("Resumen de Emisión", { width: 60 }),
              headerCell("Cantidad", { width: 40 }),
            ]}),
            new TableRow({ children: [
              dataCell("Documentos emitidos (E0 / OA)"),
              dataCell(String(documentos.filter(d => d.estado === "Emitido").length), { center: true, bold: true, bg: COLORS.greenBg }),
            ]}),
            new TableRow({ children: [
              dataCell("Documentos pendientes"),
              dataCell(String(documentos.filter(d => d.estado === "Pendiente").length), { center: true, bold: true, bg: COLORS.redBg }),
            ]}),
            new TableRow({ children: [
              dataCell("Total documentos"),
              dataCell(String(documentos.length), { center: true, bold: true }),
            ]}),
          ],
        }),

        // ========== 5. BLOQUEOS ==========
        new Paragraph({ children: [new PageBreak()] }),

        heading("5. Lista de Bloqueos y Definiciones Pendientes"),
        separator(),

        bodyText("Se identifican los siguientes bloqueos y definiciones pendientes que impactan el cumplimiento de lo programado:"),

        new Paragraph({ spacing: { before: 100 }, children: [] }),

        ...bloqueos.flatMap((b, i) => [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [
                headerCell(b.id, { width: 10 }),
                headerCell(b.tipo, { width: 15 }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({
                    alignment: AlignmentType.LEFT,
                    spacing: { before: 40, after: 40 },
                    children: [new TextRun({ text: "Impacto: ", bold: true, color: COLORS.headerText, size: 18, font: "Calibri" })],
                  })],
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  shading: { fill: impactoColor(b.impacto), type: ShadingType.CLEAR },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: b.impacto, bold: true, size: 18, font: "Calibri" })],
                  })],
                }),
              ]}),
              new TableRow({ children: [
                new TableCell({
                  columnSpan: 4,
                  children: [new Paragraph({
                    spacing: { before: 60, after: 60 },
                    children: [
                      new TextRun({ text: "Descripción: ", bold: true, size: 18, font: "Calibri" }),
                      new TextRun({ text: b.descripcion, size: 18, font: "Calibri" }),
                    ],
                  })],
                }),
              ]}),
              new TableRow({ children: [
                new TableCell({
                  columnSpan: 4,
                  children: [new Paragraph({
                    spacing: { before: 60, after: 60 },
                    children: [
                      new TextRun({ text: "Acción requerida: ", bold: true, size: 18, font: "Calibri" }),
                      new TextRun({ text: b.accion, size: 18, font: "Calibri" }),
                    ],
                  })],
                }),
              ]}),
              new TableRow({ children: [
                new TableCell({
                  columnSpan: 2,
                  children: [new Paragraph({
                    spacing: { before: 40, after: 40 },
                    children: [
                      new TextRun({ text: "Responsable: ", bold: true, size: 18, font: "Calibri" }),
                      new TextRun({ text: b.responsable, size: 18, font: "Calibri" }),
                    ],
                  })],
                }),
                new TableCell({
                  columnSpan: 2,
                  shading: { fill: statusColor(b.estado), type: ShadingType.CLEAR },
                  children: [new Paragraph({
                    spacing: { before: 40, after: 40 },
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: "Estado: ", bold: true, size: 18, font: "Calibri" }),
                      new TextRun({ text: b.estado, bold: true, size: 18, font: "Calibri" }),
                    ],
                  })],
                }),
              ]}),
            ],
          }),
          new Paragraph({ spacing: { before: 100, after: 100 }, children: [] }),
        ]),

        // ========== 6. PLAN DE ACCIONES ==========
        new Paragraph({ children: [new PageBreak()] }),

        heading("6. Plan de Acciones para Cumplimiento de lo Programado"),
        separator(),

        bodyText("Acciones requeridas para alcanzar el cierre integral del proyecto y la entrega de DB + CAO:"),

        new Paragraph({ spacing: { before: 100 }, children: [] }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              headerCell("#", { width: 5 }),
              headerCell("Acción", { width: 33 }),
              headerCell("Prioridad", { width: 12 }),
              headerCell("Fecha Límite", { width: 15 }),
              headerCell("Responsable", { width: 15 }),
              headerCell("Estado", { width: 20 }),
            ]}),
            ...planAcciones.map((a, i) =>
              new TableRow({ children: [
                dataCell(String(a.nro), { center: true, altRow: i % 2 === 1 }),
                dataCell(a.accion, { altRow: i % 2 === 1 }),
                dataCell(a.prioridad, { center: true, bg: a.prioridad === "Urgente" ? COLORS.redBg : a.prioridad === "Alta" ? COLORS.orangeBg : COLORS.yellowBg }),
                dataCell(a.fechaLimite, { center: true, altRow: i % 2 === 1 }),
                dataCell(a.responsable, { center: true, altRow: i % 2 === 1 }),
                dataCell(a.estado, { center: true, bg: statusColor(a.estado) }),
              ]})
            ),
          ],
        }),

        // ========== 7. GRÁFICAS ==========
        new Paragraph({ children: [new PageBreak()] }),

        heading("7. Diagrama de Avance y Gráficas"),
        separator(),

        bodyText("Representación visual del avance del proyecto por indicador:"),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        // Gráfico de barras horizontal textual
        heading("7.1 Avance por Indicador", HeadingLevel.HEADING_2),

        ...[
          { label: "Ingeniería Detalle", value: 85 },
          { label: "Data Book", value: 90 },
          { label: "CAO", value: 85 },
          { label: "Balance de Materiales", value: 100 },
        ].map(item => {
          const filled = Math.round(item.value / 2.5);
          const bar = "█".repeat(filled) + "░".repeat(40 - filled);
          const color = item.value >= 95 ? "00B050" : item.value >= 80 ? "FFC000" : "FF0000";
          return new Paragraph({
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({ text: item.label.padEnd(25), size: 18, font: "Consolas", bold: true }),
              new TextRun({ text: bar, size: 18, font: "Consolas", color }),
              new TextRun({ text: ` ${item.value}%`, size: 18, font: "Consolas", bold: true, color }),
            ],
          });
        }),

        new Paragraph({ spacing: { before: 300 }, children: [] }),

        heading("7.2 Distribución de Documentos por Estado", HeadingLevel.HEADING_2),

        new Paragraph({ spacing: { before: 100 }, children: [] }),

        new Table({
          width: { size: 70, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              headerCell("Estado", { width: 30 }),
              headerCell("Cantidad", { width: 15 }),
              headerCell("Porcentaje", { width: 20 }),
              headerCell("Representación", { width: 35 }),
            ]}),
            ...[
              { estado: "Emitido", count: documentos.filter(d => d.estado === "Emitido").length, color: COLORS.greenBg },
              { estado: "Pendiente", count: documentos.filter(d => d.estado === "Pendiente").length, color: COLORS.redBg },
            ].map(s => {
              const pct = Math.round((s.count / documentos.length) * 100);
              const barLen = Math.round(pct / 5);
              return new TableRow({ children: [
                dataCell(s.estado, { bold: true }),
                dataCell(String(s.count), { center: true, bold: true }),
                dataCell(pct + "%", { center: true }),
                new TableCell({
                  shading: { fill: s.color, type: ShadingType.CLEAR },
                  children: [new Paragraph({
                    spacing: { before: 30, after: 30 },
                    children: [new TextRun({ text: "█".repeat(barLen), size: 18, font: "Consolas" })],
                  })],
                }),
              ]});
            }),
          ],
        }),

        new Paragraph({ spacing: { before: 300 }, children: [] }),

        heading("7.3 Mapa de Riesgo - Bloqueos por Impacto", HeadingLevel.HEADING_2),

        new Table({
          width: { size: 80, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              headerCell("Nivel de Impacto", { width: 25 }),
              headerCell("Cantidad", { width: 15 }),
              headerCell("IDs", { width: 25 }),
              headerCell("Indicador", { width: 35 }),
            ]}),
            ...[
              { nivel: "Crítico", items: bloqueos.filter(b => b.impacto === "Crítico"), color: COLORS.redBg },
              { nivel: "Alto", items: bloqueos.filter(b => b.impacto === "Alto"), color: COLORS.orangeBg },
              { nivel: "Medio", items: bloqueos.filter(b => b.impacto === "Medio"), color: COLORS.yellowBg },
            ].map(g => new TableRow({ children: [
              dataCell(g.nivel, { bold: true, bg: g.color }),
              dataCell(String(g.items.length), { center: true, bold: true }),
              dataCell(g.items.map(b => b.id).join(", ")),
              new TableCell({
                shading: { fill: g.color, type: ShadingType.CLEAR },
                children: [new Paragraph({
                  spacing: { before: 30, after: 30 },
                  children: [new TextRun({ text: "▓".repeat(g.items.length * 4), size: 18, font: "Consolas" })],
                })],
              }),
            ]})),
          ],
        }),

        // ========== 8. DISCREPANCIAS TÉCNICAS ==========
        new Paragraph({ children: [new PageBreak()] }),

        heading("8. Discrepancias Técnicas Críticas"),
        separator(),

        bodyText("Se resumen las discrepancias técnicas identificadas en la auditoría de ingeniería básica que condicionan la ejecución segura del proyecto:"),

        new Paragraph({ spacing: { before: 100 }, children: [] }),

        heading("8.1 Discrepancia de Espesores de Ducto", HeadingLevel.HEADING_2),

        new Table({
          width: { size: 80, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              headerCell("Fuente"),
              headerCell("Espesor (mm)"),
              headerCell("Observación"),
            ]}),
            new TableRow({ children: [
              dataCell("Memoria de Cálculo"),
              dataCell("7,14", { center: true, bold: true }),
              dataCell("Valor de diseño adoptado"),
            ]}),
            new TableRow({ children: [
              dataCell("Estudio de Riesgo Hídrico"),
              dataCell("6,02", { center: true, bold: true }),
              dataCell("Valor resultante del ERH"),
            ]}),
            new TableRow({ children: [
              dataCell("Mínimo integridad mecánica"),
              dataCell("5,40", { center: true, bold: true, bg: COLORS.greenBg }),
              dataCell("Ambos superan el mínimo"),
            ]}),
          ],
        }),

        bodyText("Acción: Emisión de TQ formal para unificar criterio antes de emitir isométricos 'Aptos para Construcción'."),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        heading("8.2 Desplazamientos de Coordenadas PRH", HeadingLevel.HEADING_2),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              headerCell("Punto"),
              headerCell("Coord. Hidrológica"),
              headerCell("Coord. OMA (Diseño)"),
              headerCell("Desplazamiento"),
              headerCell("Riesgo"),
            ]}),
            new TableRow({ children: [
              dataCell("PRH 1", { bold: true }),
              dataCell("Y: 2.531.519,50"),
              dataCell("Y: 2.531.560,12"),
              dataCell("~40,6 m", { bold: true, bg: COLORS.orangeBg }),
              dataCell("Exposición lateral"),
            ]}),
            new TableRow({ children: [
              dataCell("PRH 1 bis", { bold: true }),
              dataCell("X: 5.764.306,64"),
              dataCell("X: 5.764.317,20"),
              dataCell("~10,6 m", { bold: true, bg: COLORS.yellowBg }),
              dataCell("Desalineación con canal"),
            ]}),
            new TableRow({ children: [
              dataCell("PRH 4", { bold: true }),
              dataCell("Y: 2.531.989,76"),
              dataCell("Y: 2.531.983,25"),
              dataCell("~67 m", { bold: true, bg: COLORS.redBg }),
              dataCell("CRÍTICO - Fuera de cauce"),
            ]}),
          ],
        }),

        bodyText("Diagnóstico: un desplazamiento de 40 a 67 m implica soterramiento fuera del cauce real, con riesgo de socavación lateral y esfuerzos mecánicos por arrastre de sedimentos durante evento TR100."),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        heading("8.3 Inconsistencias de Control de Versiones", HeadingLevel.HEADING_2),

        bullet("Memoria Técnica: identificada externamente como Rev. 2 pero internamente como Rev. 0."),
        bullet("Nomenclatura dual: ID1173 (referencia ERH) vs VCD25213/03 (referencia MT)."),
        bullet("Riesgo: invalidación de registros END/NDT y pruebas hidráulicas en futuras auditorías de integridad."),

        // ========== 9. CONCLUSIONES ==========
        new Paragraph({ children: [new PageBreak()] }),

        heading("9. Conclusiones y Próximos Pasos"),
        separator(),

        bodyText("El proyecto VCD25213 - Gas Lift PAD LAA-43 se encuentra en una etapa avanzada de cierre de ingeniería (85%) y documentación CAO (85%), con entrega integral de DB+CAO comprometida. Sin embargo, existen bloqueos técnicos y documentales que requieren resolución inmediata para garantizar la integridad del ducto y la validez del paquete de entrega."),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        heading("Acciones Prioritarias", HeadingLevel.HEADING_2),

        bullet("Resolver discrepancia de espesores (7,14 mm vs 6,02 mm) mediante TQ formal - Precondición para isométricos ApC."),
        bullet("Validar coordenadas PRH en campo (desplazamiento de hasta 67 m en PRH 4) - Impacto crítico en soterramiento."),
        bullet("Completar análisis de estrés mecánico - Pendiente desde 15/06/2026."),
        bullet("Cerrar documentación civil pendiente en Data Book (actualmente 90%)."),
        bullet("Unificar nomenclatura documental ID1173 ↔ VCD25213/03 en próxima revisión."),
        bullet("Resolver discrepancia longitud soterramiento PRH 5-6 (177,34 m vs 117,34 m)."),

        new Paragraph({ spacing: { before: 200 }, children: [] }),

        heading("Próximos Hitos", HeadingLevel.HEADING_2),

        new Table({
          width: { size: 80, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              headerCell("Hito"),
              headerCell("Fecha"),
              headerCell("Responsable"),
            ]}),
            new TableRow({ children: [
              dataCell("Cierre análisis de estrés"),
              dataCell("15/09/2026", { center: true }),
              dataCell("Ing. Mecánica", { center: true }),
            ]}),
            new TableRow({ children: [
              dataCell("Cierre documentación civil DB"),
              dataCell("30/09/2026", { center: true }),
              dataCell("Ing. Civil", { center: true }),
            ]}),
            new TableRow({ children: [
              dataCell("Cierre CAO integral"),
              dataCell("15/10/2026", { center: true }),
              dataCell("Calidad", { center: true }),
            ]}),
            new TableRow({ children: [
              dataCell("Carga DB en Documentum"),
              dataCell("30/10/2026", { center: true }),
              dataCell("Doc. Control", { center: true }),
            ]}),
          ],
        }),

        new Paragraph({ spacing: { before: 300 }, children: [] }),

        separator(),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({
            text: "Fin del Informe",
            size: 20,
            font: "Calibri",
            italics: true,
            color: "999999",
          })],
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({
            text: `Emitido por: ${proyecto.contratista} — ${proyecto.fechaInforme}`,
            size: 18,
            font: "Calibri",
            color: "666666",
          })],
        }),
      ],
    },
  ],
});

// ============================================================
// GENERATE
// ============================================================

const outputPath = "Informe_Ingenieria_VCD25213_GasLift_PAD_LAA43.docx";

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`\n✔ Informe generado exitosamente: ${outputPath}`);
  console.log(`  Tamaño: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log(`  Proyecto: ${proyecto.codigo} - ${proyecto.nombre}`);
  console.log(`  Secciones: 9 (Estatus, KPIs, Cronograma, Emisión, Bloqueos, Plan, Gráficas, Discrepancias, Conclusiones)`);
  console.log(`  Fecha: ${proyecto.fechaInforme}\n`);
}).catch(err => {
  console.error("Error generando informe:", err);
  process.exit(1);
});
