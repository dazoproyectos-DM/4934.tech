// P3 – Computo de Horas por Especialidad
// Reference criteria sourced from VALIDACION LD and HS ING sheets (YPF standard)

import type {
  SpecialtyHours,
  InputDocument,
  DocumentHours,
  ReportData,
} from '@/types/p3';
import { DISCIPLINE_NAMES } from '@/types/p3';

type DistFactor = Record<keyof SpecialtyHours, number>;

interface HoursRef {
  baseHours: number;
  description: string;
  dist: DistFactor;
}

const Z: DistFactor = {
  psEIPr: 0, psMp: 0, psCs: 0,
  pjEIPr: 0, pjMp: 0, pjCs: 0,
  cad: 0, maqueta: 0,
};

function dist(overrides: Partial<DistFactor>): DistFactor {
  return { ...Z, ...overrides };
}

// ---------------------------------------------------------------------------
// Reference hours table
// Key: "{DisciplineCode}-{TypeCode}"  e.g. "R-PI", "P-IS", "E-DN"
// baseHours: YPF standard hours per sheet (from VALIDACION LD EA- sheet)
// dist: fractional distribution across the 8 specialty columns (must sum ≤ 1)
// ---------------------------------------------------------------------------
const HOURS_TABLE: Record<string, HoursRef> = {
  // GENERAL
  'G-LD':    { baseHours: 60,  description: 'Listado de Documentos',              dist: dist({ psEIPr: 0.60, pjEIPr: 0.10, cad: 0.30 }) },
  'G-LISSD': { baseHours: 12,  description: 'LISSD',                              dist: dist({ psEIPr: 0.60, pjEIPr: 0.10, cad: 0.30 }) },
  'G-MD':    { baseHours: 40,  description: 'Memoria Descriptiva',                dist: dist({ psEIPr: 0.70, pjEIPr: 0.20, cad: 0.10 }) },

  // PROCESO
  'R-PI':    { baseHours: 42,  description: 'Diagrama de Proceso P&ID',           dist: dist({ psEIPr: 0.80, pjEIPr: 0.05, cad: 0.15 }) },
  'R-LL':    { baseHours: 40,  description: 'Listado de Líneas',                  dist: dist({ psEIPr: 0.75, pjEIPr: 0.10, cad: 0.15 }) },
  'R-LT':    { baseHours: 35,  description: 'Listado de Tie-In',                  dist: dist({ psEIPr: 0.70, psMp: 0.10,   pjEIPr: 0.05, cad: 0.15 }) },
  'R-MD':    { baseHours: 40,  description: 'Memoria Descriptiva Proceso',        dist: dist({ psEIPr: 0.75, pjEIPr: 0.15, cad: 0.10 }) },
  'R-HD':    { baseHours: 30,  description: 'Hoja de Datos Proceso',              dist: dist({ psEIPr: 0.70, pjEIPr: 0.20, cad: 0.10 }) },
  'R-LM':    { baseHours: 35,  description: 'Lista de Materiales Proceso',        dist: dist({ psEIPr: 0.70, pjEIPr: 0.20, cad: 0.10 }) },
  'R-HC':    { baseHours: 45,  description: 'Hoja de Cálculo Proceso',            dist: dist({ psEIPr: 0.80, pjEIPr: 0.15, cad: 0.05 }) },

  // PIPING
  'P-LY':    { baseHours: 63,  description: 'Layout de Cañerías',                 dist: dist({ psMp: 0.65, pjMp: 0.20, cad: 0.15 }) },
  'P-PL':    { baseHours: 60,  description: 'Planos de Cañerías',                 dist: dist({ psMp: 0.65, pjMp: 0.20, cad: 0.15 }) },
  'P-IS':    { baseHours: 90,  description: 'Cuadernillo de Isométricos',         dist: dist({ psMp: 0.50, pjMp: 0.35, cad: 0.15 }) },
  'P-LM':    { baseHours: 54,  description: 'Lista de Materiales Piping',         dist: dist({ psMp: 0.55, pjMp: 0.25, cad: 0.20 }) },
  'P-LV':    { baseHours: 50,  description: 'Listado de Válvulas',                dist: dist({ psMp: 0.55, pjMp: 0.30, cad: 0.15 }) },
  'P-MQ':    { baseHours: 50,  description: 'Maqueta',                            dist: dist({ maqueta: 1.0 }) },
  'P-MC':    { baseHours: 50,  description: 'Memoria de Cálculo Piping',          dist: dist({ psMp: 0.70, pjMp: 0.20, cad: 0.10 }) },
  'P-HD':    { baseHours: 30,  description: 'Hoja de Datos Piping',               dist: dist({ psMp: 0.70, pjMp: 0.20, cad: 0.10 }) },
  'P-LL':    { baseHours: 40,  description: 'Listado de Líneas Piping',           dist: dist({ psMp: 0.65, pjMp: 0.25, cad: 0.10 }) },

  // CIVIL
  'C-LY':    { baseHours: 42,  description: 'Layout Civil / Implantación',        dist: dist({ psCs: 0.55, pjCs: 0.30, cad: 0.15 }) },
  'C-PL':    { baseHours: 32,  description: 'Cuadernillo de Bases y Soportes',   dist: dist({ psCs: 0.55, pjCs: 0.30, cad: 0.15 }) },
  'C-MS':    { baseHours: 47,  description: 'Movimiento de Suelos',               dist: dist({ psCs: 0.60, pjCs: 0.30, cad: 0.10 }) },
  'C-MC':    { baseHours: 50,  description: 'Memoria de Cálculo Civil',           dist: dist({ psCs: 0.65, pjCs: 0.25, cad: 0.10 }) },
  'C-MD':    { baseHours: 40,  description: 'Memoria Descriptiva Civil',          dist: dist({ psCs: 0.70, pjCs: 0.20, cad: 0.10 }) },
  'C-HD':    { baseHours: 25,  description: 'Hoja de Datos Civil',                dist: dist({ psCs: 0.60, pjCs: 0.30, cad: 0.10 }) },
  'C-LM':    { baseHours: 30,  description: 'Lista de Materiales Civil',          dist: dist({ psCs: 0.60, pjCs: 0.30, cad: 0.10 }) },

  // TOPOGRAFÍA
  'T-PL':    { baseHours: 46,  description: 'Planialtimetría',                    dist: dist({ psCs: 0.60, pjCs: 0.30, cad: 0.10 }) },
  'T-HD':    { baseHours: 12,  description: 'Hoja de Datos Topografía',           dist: dist({ psCs: 0.60, pjCs: 0.30, cad: 0.10 }) },
  'T-INF':   { baseHours: 12,  description: 'Informe Topográfico',                dist: dist({ psCs: 0.65, pjCs: 0.35 }) },
  'T-LY':    { baseHours: 40,  description: 'Layout Topográfico',                 dist: dist({ psCs: 0.60, pjCs: 0.30, cad: 0.10 }) },

  // ESTRUCTURA
  'S-PL':    { baseHours: 45,  description: 'Planos de Estructuras',              dist: dist({ psCs: 0.55, pjCs: 0.30, cad: 0.15 }) },
  'S-SP':    { baseHours: 20,  description: 'Soportes / Plataformas',             dist: dist({ psCs: 0.55, pjCs: 0.30, cad: 0.15 }) },
  'S-CAR':   { baseHours: 11,  description: 'Cartelería',                         dist: dist({ psCs: 0.55, pjCs: 0.35, cad: 0.10 }) },
  'S-MC':    { baseHours: 50,  description: 'Memoria de Cálculo Estructural',     dist: dist({ psCs: 0.70, pjCs: 0.20, cad: 0.10 }) },
  'S-LY':    { baseHours: 35,  description: 'Layout Estructural',                 dist: dist({ psCs: 0.55, pjCs: 0.30, cad: 0.15 }) },
  'S-HD':    { baseHours: 25,  description: 'Hoja de Datos Estructural',          dist: dist({ psCs: 0.60, pjCs: 0.30, cad: 0.10 }) },
  'S-LM':    { baseHours: 30,  description: 'Lista de Materiales Estructural',    dist: dist({ psCs: 0.60, pjCs: 0.30, cad: 0.10 }) },

  // ELECTRICIDAD
  'E-LY':    { baseHours: 45,  description: 'Layout Eléctrico (PAT/Ilumin./Canaliz.)', dist: dist({ psEIPr: 0.20, psCs: 0.30, pjEIPr: 0.15, pjCs: 0.20, cad: 0.15 }) },
  'E-LM':    { baseHours: 20,  description: 'Lista de Materiales Eléctricos',     dist: dist({ psEIPr: 0.20, psCs: 0.30, pjEIPr: 0.15, pjCs: 0.20, cad: 0.15 }) },
  'E-LC':    { baseHours: 40,  description: 'Lista de Cables',                    dist: dist({ psEIPr: 0.50, pjEIPr: 0.30, cad: 0.20 }) },
  'E-LE':    { baseHours: 50,  description: 'Lista de Equipos',                   dist: dist({ psEIPr: 0.50, pjEIPr: 0.30, cad: 0.20 }) },
  'E-DN':    { baseHours: 40,  description: 'Diagrama Funcional',                 dist: dist({ psEIPr: 0.55, pjEIPr: 0.25, cad: 0.20 }) },
  'E-DU':    { baseHours: 40,  description: 'Diagrama Unifilar',                  dist: dist({ psEIPr: 0.55, pjEIPr: 0.25, cad: 0.20 }) },
  'E-ET':    { baseHours: 40,  description: 'Tablero Eléctrico',                  dist: dist({ psEIPr: 0.50, psCs: 0.10, pjEIPr: 0.25, pjCs: 0.05, cad: 0.10 }) },
  'E-HD':    { baseHours: 50,  description: 'Hoja de Datos Eléctrica',            dist: dist({ psEIPr: 0.55, pjEIPr: 0.30, cad: 0.15 }) },
  'E-MC':    { baseHours: 40,  description: 'Memoria de Cálculo Eléctrica',       dist: dist({ psEIPr: 0.65, pjEIPr: 0.25, cad: 0.10 }) },
  'E-PL':    { baseHours: 33,  description: 'Planos Eléctricos',                  dist: dist({ psEIPr: 0.20, psCs: 0.30, pjEIPr: 0.15, pjCs: 0.20, cad: 0.15 }) },
  'E-TC':    { baseHours: 33,  description: 'Planos Tracing Eléctrico',           dist: dist({ psEIPr: 0.30, psMp: 0.10, psCs: 0.15, pjEIPr: 0.15, pjMp: 0.10, pjCs: 0.05, cad: 0.15 }) },
  'E-TM':    { baseHours: 29,  description: 'Tendido Mat. Catódica',              dist: dist({ psEIPr: 0.25, psCs: 0.30, pjEIPr: 0.15, pjCs: 0.15, cad: 0.15 }) },
  'E-CAT':   { baseHours: 29,  description: 'Lista de Materiales Catódica',       dist: dist({ psEIPr: 0.25, psCs: 0.30, pjEIPr: 0.15, pjCs: 0.15, cad: 0.15 }) },

  // INSTRUMENTACIÓN
  'I-HD':    { baseHours: 50,  description: 'Hoja de Datos Instrumentos',         dist: dist({ psEIPr: 0.55, pjEIPr: 0.30, cad: 0.15 }) },
  'I-LD':    { baseHours: 35,  description: 'Listado de Instrumentos',            dist: dist({ psEIPr: 0.55, pjEIPr: 0.30, cad: 0.15 }) },
  'I-DN':    { baseHours: 45,  description: 'Diagrama Funcional Instrumentación', dist: dist({ psEIPr: 0.60, pjEIPr: 0.25, cad: 0.15 }) },
  'I-LC':    { baseHours: 40,  description: 'Lista de Cables Instrumentación',    dist: dist({ psEIPr: 0.55, pjEIPr: 0.30, cad: 0.15 }) },
  'I-MC':    { baseHours: 40,  description: 'Memoria de Cálculo Instrumentación', dist: dist({ psEIPr: 0.70, pjEIPr: 0.20, cad: 0.10 }) },
  'I-LM':    { baseHours: 35,  description: 'Lista de Materiales Instr.',         dist: dist({ psEIPr: 0.55, pjEIPr: 0.30, cad: 0.15 }) },

  // MECÁNICA
  'M-HD':    { baseHours: 50,  description: 'Hoja de Datos Mecánica',             dist: dist({ psMp: 0.60, pjMp: 0.25, cad: 0.15 }) },
  'M-LM':    { baseHours: 40,  description: 'Lista de Materiales Mecánica',       dist: dist({ psMp: 0.60, pjMp: 0.25, cad: 0.15 }) },
  'M-MC':    { baseHours: 50,  description: 'Memoria de Cálculo Mecánica',        dist: dist({ psMp: 0.70, pjMp: 0.20, cad: 0.10 }) },
  'M-PL':    { baseHours: 45,  description: 'Planos Mecánicos',                   dist: dist({ psMp: 0.60, pjMp: 0.25, cad: 0.15 }) },
};

const DEFAULT_DIST_BY_DISCIPLINE: Record<string, DistFactor> = {
  G: dist({ psEIPr: 0.60, pjEIPr: 0.10, cad: 0.30 }),
  R: dist({ psEIPr: 0.75, psMp: 0.05, pjEIPr: 0.05, cad: 0.15 }),
  P: dist({ psMp: 0.60, pjMp: 0.25, cad: 0.15 }),
  C: dist({ psCs: 0.55, pjCs: 0.30, cad: 0.15 }),
  T: dist({ psCs: 0.60, pjCs: 0.30, cad: 0.10 }),
  S: dist({ psCs: 0.55, pjCs: 0.30, cad: 0.15 }),
  E: dist({ psEIPr: 0.35, psCs: 0.20, pjEIPr: 0.15, pjCs: 0.15, cad: 0.15 }),
  I: dist({ psEIPr: 0.55, pjEIPr: 0.30, cad: 0.15 }),
  A: dist({ psEIPr: 0.55, pjEIPr: 0.30, cad: 0.15 }),
  M: dist({ psMp: 0.60, pjMp: 0.25, cad: 0.15 }),
};

const DEFAULT_BASE_HOURS = 40;

// ---------------------------------------------------------------------------
// Code parser
// Format: {yac}-{area}-{vpd}-{EspCode}-{TypeCode}-{num}
// The discipline code is a SINGLE uppercase letter, e.g.  "…-G-LD-019001"
// ---------------------------------------------------------------------------
export function parseCode(code: string): {
  yacimiento: string;
  area: string;
  vpd: string;
  disciplineCode: string;
  typeCode: string;
  number: string;
} | null {
  const parts = code.trim().split('-');
  if (parts.length < 6) return null;

  // Find the single-letter discipline code
  let espIdx = -1;
  for (let i = 1; i < parts.length - 2; i++) {
    if (/^[A-Z]$/.test(parts[i])) {
      espIdx = i;
      break;
    }
  }
  if (espIdx === -1) return null;

  return {
    yacimiento: parts[0],
    area: parts[1],
    vpd: parts.slice(2, espIdx).join('-'),
    disciplineCode: parts[espIdx],
    typeCode: parts[espIdx + 1],
    number: parts.slice(espIdx + 2).join('-'),
  };
}

// ---------------------------------------------------------------------------
// Hours calculator
// ---------------------------------------------------------------------------
function applyDist(baseHours: number, d: DistFactor): SpecialtyHours {
  const r = (v: number) => Math.round(v * 10) / 10;
  return {
    psEIPr:  r(baseHours * d.psEIPr),
    psMp:    r(baseHours * d.psMp),
    psCs:    r(baseHours * d.psCs),
    pjEIPr:  r(baseHours * d.pjEIPr),
    pjMp:    r(baseHours * d.pjMp),
    pjCs:    r(baseHours * d.pjCs),
    cad:     r(baseHours * d.cad),
    maqueta: r(baseHours * d.maqueta),
  };
}

export function zeroHours(): SpecialtyHours {
  return { psEIPr: 0, psMp: 0, psCs: 0, pjEIPr: 0, pjMp: 0, pjCs: 0, cad: 0, maqueta: 0 };
}

export function sumHours(a: SpecialtyHours, b: SpecialtyHours): SpecialtyHours {
  return {
    psEIPr:  a.psEIPr  + b.psEIPr,
    psMp:    a.psMp    + b.psMp,
    psCs:    a.psCs    + b.psCs,
    pjEIPr:  a.pjEIPr  + b.pjEIPr,
    pjMp:    a.pjMp    + b.pjMp,
    pjCs:    a.pjCs    + b.pjCs,
    cad:     a.cad     + b.cad,
    maqueta: a.maqueta + b.maqueta,
  };
}

export function totalSpecialty(h: SpecialtyHours): number {
  return h.psEIPr + h.psMp + h.psCs + h.pjEIPr + h.pjMp + h.pjCs + h.cad + h.maqueta;
}

export function processDocuments(inputs: InputDocument[]): DocumentHours[] {
  return inputs
    .filter(d => d.code.trim())
    .map(input => {
      const parsed = parseCode(input.code);
      const disciplineCode = parsed?.disciplineCode ?? 'G';
      const typeCode = parsed?.typeCode ?? 'LD';
      const key = `${disciplineCode}-${typeCode}`;
      const ref = HOURS_TABLE[key] ?? {
        baseHours: DEFAULT_BASE_HOURS,
        description: `${disciplineCode}-${typeCode}`,
        dist: DEFAULT_DIST_BY_DISCIPLINE[disciplineCode] ?? DEFAULT_DIST_BY_DISCIPLINE.G,
      };

      const sheets = Math.max(1, input.sheets ?? 1);
      const baseHours = ref.baseHours * sheets;
      const hours = applyDist(baseHours, ref.dist);

      return {
        code: input.code.trim(),
        yacimiento: parsed?.yacimiento ?? '',
        area: parsed?.area ?? '',
        vpd: parsed?.vpd ?? '',
        disciplineCode,
        disciplineName: DISCIPLINE_NAMES[disciplineCode] ?? disciplineCode,
        typeCode,
        number: parsed?.number ?? '',
        description: input.description.trim() || ref.description,
        revision: input.revision?.trim() ?? '',
        format: input.format?.trim() ?? '',
        sheets,
        baseHoursPerSheet: ref.baseHours,
        baseHours,
        hours,
        totalHours: totalSpecialty(hours),
      };
    });
}

export function generateReport(
  documents: DocumentHours[],
  meta: { projectName: string; projectCode: string; yacimiento: string }
): ReportData {
  const totals = documents.reduce((acc, d) => sumHours(acc, d.hours), zeroHours());
  return {
    ...meta,
    date: new Date().toLocaleDateString('es-AR'),
    documents,
    totals,
    grandTotal: totalSpecialty(totals),
  };
}

// ---------------------------------------------------------------------------
// XLS parser (client-side via SheetJS)
// Expects the sheet structure of "REV. ACTUAL LD- DOCUMENTUM":
//   col 0 = doc code, col 7 = description, col 8 = revision, col 9 = format, col 10 = sheets
// Also handles simple 2-column lists: CODE | DESCRIPTION
// ---------------------------------------------------------------------------
export function parseXlsRows(rows: unknown[][]): InputDocument[] {
  const docs: InputDocument[] = [];
  for (const row of rows) {
    if (!row || !row[0]) continue;
    const code = String(row[0]).trim();
    if (!code || code.startsWith('-') || !/[A-Z]-[A-Z]/.test(code)) continue;
    docs.push({
      code,
      description:  String(row[7] ?? row[1] ?? '').trim(),
      revision:     String(row[8] ?? row[2] ?? '').trim(),
      format:       String(row[9] ?? row[3] ?? '').trim(),
      sheets:       parseFloat(String(row[10] ?? row[4] ?? '1')) || 1,
    });
  }
  return docs;
}
