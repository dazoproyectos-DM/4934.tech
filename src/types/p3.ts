// P3 Project – Docs, Reportes & Materiales
// Types for "Computo de Horas por Especialidad"

export interface SpecialtyHours {
  psEIPr: number;   // PS E/I/Pr  – col 91
  psMp: number;     // PS M/P     – col 90
  psCs: number;     // PS C/S     – col 89
  pjEIPr: number;   // PJ E/I/Pr  – col 94
  pjMp: number;     // PJ M/P     – col 93
  pjCs: number;     // PJ C/S     – col 92
  cad: number;      // CAD        – col 95
  maqueta: number;  // MAQUETA    – col 96
}

export const SPECIALTY_HOUR_KEYS: (keyof SpecialtyHours)[] = [
  'psEIPr', 'psMp', 'psCs', 'pjEIPr', 'pjMp', 'pjCs', 'cad', 'maqueta',
];

export const SPECIALTY_HOUR_LABELS: Record<keyof SpecialtyHours, string> = {
  psEIPr: 'PS E/I/Pr',
  psMp:   'PS M/P',
  psCs:   'PS C/S',
  pjEIPr: 'PJ E/I/Pr',
  pjMp:   'PJ M/P',
  pjCs:   'PJ C/S',
  cad:    'CAD',
  maqueta:'MAQUETA',
};

export const SPECIALTY_COL_CODES: Record<keyof SpecialtyHours, number> = {
  psEIPr: 91, psMp: 90, psCs: 89,
  pjEIPr: 94, pjMp: 93, pjCs: 92,
  cad: 95, maqueta: 96,
};

export const DISCIPLINE_NAMES: Record<string, string> = {
  G: 'GENERAL',
  C: 'CIVIL',
  R: 'PROCESO',
  P: 'PIPING',
  S: 'ESTRUCTURA',
  E: 'ELECTRICIDAD',
  T: 'TOPOGRAFÍA',
  I: 'INSTRUMENTACIÓN',
  A: 'AUTOMATIZACIÓN',
  M: 'MECÁNICA',
};

export interface InputDocument {
  code: string;
  description: string;
  revision?: string;
  format?: string;
  sheets?: number;
}

export interface DocumentHours {
  code: string;
  yacimiento: string;
  area: string;
  vpd: string;
  disciplineCode: string;
  disciplineName: string;
  typeCode: string;
  number: string;
  description: string;
  revision: string;
  format: string;
  sheets: number;
  baseHoursPerSheet: number;
  baseHours: number;
  hours: SpecialtyHours;
  totalHours: number;
}

export interface ReportData {
  projectName: string;
  projectCode: string;
  yacimiento: string;
  date: string;
  documents: DocumentHours[];
  totals: SpecialtyHours;
  grandTotal: number;
}
