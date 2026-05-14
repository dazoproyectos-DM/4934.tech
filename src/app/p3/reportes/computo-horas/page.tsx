'use client';

import { useState, useCallback, useRef } from 'react';
import type { InputDocument, DocumentHours, ReportData } from '@/types/p3';
import { SPECIALTY_HOUR_KEYS, SPECIALTY_HOUR_LABELS, DISCIPLINE_NAMES } from '@/types/p3';
import {
  processDocuments,
  generateReport,
  parseXlsRows,
  zeroHours,
  sumHours,
  totalSpecialty,
} from '@/lib/p3/hours-calculator';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const fmt = (n: number) => (n === 0 ? '' : n.toFixed(1));
const fmtTotal = (n: number) => n.toFixed(1);

function emptyDoc(): InputDocument {
  return { code: '', description: '', revision: '', format: '', sheets: 1 };
}

// Group documents by discipline for the report subtotals
function groupByDiscipline(docs: DocumentHours[]) {
  const map: Record<string, DocumentHours[]> = {};
  for (const d of docs) {
    if (!map[d.disciplineCode]) map[d.disciplineCode] = [];
    map[d.disciplineCode].push(d);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ComputoHorasPage() {
  // Project meta
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [yacimiento, setYacimiento] = useState('');

  // Document list
  const [docs, setDocs] = useState<InputDocument[]>([emptyDoc()]);

  // Report
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState('');

  // XLS upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // -------------------------------------------------------------------------
  // Document list CRUD
  // -------------------------------------------------------------------------
  const updateDoc = (i: number, field: keyof InputDocument, value: string | number) => {
    setDocs(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const addDoc = () => setDocs(prev => [...prev, emptyDoc()]);

  const removeDoc = (i: number) =>
    setDocs(prev => (prev.length === 1 ? [emptyDoc()] : prev.filter((_, idx) => idx !== i)));

  const clearAll = () => {
    setDocs([emptyDoc()]);
    setReport(null);
    setError('');
  };

  // -------------------------------------------------------------------------
  // XLS upload
  // -------------------------------------------------------------------------
  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'buffer' });

      // Try known sheet names first, then fall back to first sheet
      const targetNames = ['REV. ACTUAL LD- DOCUMENTUM', 'HS ING - TOTALES PROY -FM', 'CARATULA'];
      const sheetName = wb.SheetNames.find(n => targetNames.some(t => n.includes(t.slice(0, 10))))
        ?? wb.SheetNames[0];

      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
      const parsed = parseXlsRows(rows);

      if (parsed.length === 0) {
        setError('No se encontraron documentos válidos en el archivo. Verifique el formato.');
        return;
      }

      // Auto-fill project meta from first row if available
      for (const row of rows) {
        const r = row as string[];
        const cell = r.find(c => typeof c === 'string' && c.includes('PROYECTO'));
        if (cell) {
          const match = String(cell).match(/PROYECTO[:\s]+(.+)/i);
          if (match) setProjectName(match[1].trim());
          break;
        }
      }

      setDocs(parsed);
      setReport(null);
    } catch {
      setError('Error al leer el archivo. Asegúrese de que es un archivo XLS/XLSX válido.');
    } finally {
      setUploading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Calculate
  // -------------------------------------------------------------------------
  const calculate = () => {
    setError('');
    const filled = docs.filter(d => d.code.trim());
    if (filled.length === 0) {
      setError('Ingrese al menos un código de documento.');
      return;
    }
    const processed = processDocuments(filled);
    const r = generateReport(processed, {
      projectName: projectName || 'SIN NOMBRE',
      projectCode: projectCode || '',
      yacimiento: yacimiento || '',
    });
    setReport(r);
  };

  // -------------------------------------------------------------------------
  // Export to XLS
  // -------------------------------------------------------------------------
  const exportXls = async () => {
    if (!report) return;
    const XLSX = await import('xlsx');

    const header = [
      'DOCUMENTO Nro.',
      'DESCRIPCION',
      'ESPECIALIDAD',
      'REV.',
      'FORM',
      'HOJAS',
      'HS BASE',
      ...SPECIALTY_HOUR_KEYS.map(k => SPECIALTY_HOUR_LABELS[k]),
      'TOTAL HS',
    ];

    const dataRows = report.documents.map(d => [
      d.code,
      d.description,
      d.disciplineName,
      d.revision,
      d.format,
      d.sheets,
      d.baseHours,
      ...SPECIALTY_HOUR_KEYS.map(k => d.hours[k] || ''),
      d.totalHours,
    ]);

    const totalRow = [
      '', 'TOTAL HS POR ESPECIALIDAD', '', '', '', '',
      report.documents.reduce((s, d) => s + d.baseHours, 0),
      ...SPECIALTY_HOUR_KEYS.map(k => report.totals[k]),
      report.grandTotal,
    ];

    const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows, [], totalRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HS ING - TOTALES PROY');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `Computo_Horas_${date}.xlsx`);
  };

  // -------------------------------------------------------------------------
  // Grouped totals for summary
  // -------------------------------------------------------------------------
  const disciplineGroups = report ? groupByDiscipline(report.documents) : {};

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 border-b border-gray-700 pb-4">
          <h1 className="text-2xl font-bold tracking-wide text-blue-400">
            COMPUTO DE HORAS POR ESPECIALIDAD
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            P3 — Docs, Reportes &amp; Materiales · Generación de Informe
          </p>
        </div>

        {/* Project meta */}
        <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Proyecto</span>
            <input
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Nombre del proyecto"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Código</span>
            <input
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="ej. VCD16130"
              value={projectCode}
              onChange={e => setProjectCode(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Yacimiento</span>
            <input
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="ej. CHACHAHUEN"
              value={yacimiento}
              onChange={e => setYacimiento(e.target.value)}
            />
          </label>
        </section>

        {/* Document list input */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Listado de Documentos
            </h2>
            <div className="flex gap-2">
              {/* XLS upload */}
              <input
                ref={fileRef}
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-1.5 rounded border border-gray-600 transition-colors"
              >
                {uploading ? 'Cargando…' : 'Importar XLS'}
              </button>
              <button
                onClick={addDoc}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded border border-gray-600 transition-colors"
              >
                + Agregar fila
              </button>
              <button
                onClick={clearAll}
                className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-700 text-gray-400 transition-colors"
              >
                Limpiar todo
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded px-3 py-2">
              {error}
            </div>
          )}

          {/* Input table */}
          <div className="overflow-x-auto rounded border border-gray-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-800 text-gray-400">
                  <th className="text-left px-3 py-2 font-medium w-[280px]">CÓDIGO DOCUMENTO</th>
                  <th className="text-left px-3 py-2 font-medium">DESCRIPCIÓN</th>
                  <th className="text-left px-3 py-2 font-medium w-16">REV.</th>
                  <th className="text-left px-3 py-2 font-medium w-20">FORMATO</th>
                  <th className="text-left px-3 py-2 font-medium w-16">HOJAS</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {docs.map((doc, i) => (
                  <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/30">
                    <td className="px-2 py-1">
                      <input
                        className="w-full bg-transparent border border-gray-700 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-blue-500"
                        placeholder="ChuS-BAT-VCD-G-LD-001"
                        value={doc.code}
                        onChange={e => updateDoc(i, 'code', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-full bg-transparent border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                        placeholder="Descripción"
                        value={doc.description}
                        onChange={e => updateDoc(i, 'description', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-full bg-transparent border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                        placeholder="E0"
                        value={doc.revision}
                        onChange={e => updateDoc(i, 'revision', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-full bg-transparent border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                        placeholder="A4"
                        value={doc.format}
                        onChange={e => updateDoc(i, 'format', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        min={1}
                        className="w-full bg-transparent border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-center"
                        value={doc.sheets}
                        onChange={e => updateDoc(i, 'sheets', parseInt(e.target.value) || 1)}
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button
                        onClick={() => removeDoc(i)}
                        className="text-gray-600 hover:text-red-400 transition-colors text-base leading-none"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={calculate}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2 rounded transition-colors"
            >
              CALCULAR HORAS
            </button>
          </div>
        </section>

        {/* Report */}
        {report && (
          <section>
            {/* Report header */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-blue-300">
                  DISTRIBUCIÓN DE HORAS POR ESPECIALIDAD
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {report.projectName}
                  {report.projectCode && ` · ${report.projectCode}`}
                  {report.yacimiento && ` · ${report.yacimiento}`}
                  {' · '}{report.date}
                </p>
              </div>
              <button
                onClick={exportXls}
                className="text-xs bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors font-medium"
              >
                Exportar XLS
              </button>
            </div>

            {/* Main hours table */}
            <div className="overflow-x-auto rounded border border-gray-700 mb-6">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-800 text-gray-300">
                    <th className="text-left px-3 py-2 font-medium">DOCUMENTO Nro.</th>
                    <th className="text-left px-3 py-2 font-medium">DESCRIPCIÓN</th>
                    <th className="text-left px-3 py-2 font-medium">ESP.</th>
                    <th className="text-left px-3 py-2 font-medium">REV.</th>
                    <th className="text-right px-3 py-2 font-medium">HS BASE</th>
                    {SPECIALTY_HOUR_KEYS.map(k => (
                      <th key={k} className="text-right px-2 py-2 font-medium text-blue-300 whitespace-nowrap">
                        {SPECIALTY_HOUR_LABELS[k]}
                      </th>
                    ))}
                    <th className="text-right px-3 py-2 font-medium text-yellow-300">TOTAL</th>
                  </tr>
                  {/* Column codes row */}
                  <tr className="bg-gray-900 text-gray-600">
                    <th colSpan={5} />
                    {SPECIALTY_HOUR_KEYS.map((k, i) => (
                      <th key={k} className="text-right px-2 pb-1 font-mono">
                        {[91,90,89,94,93,92,95,96][i]}
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {/* Documents grouped by discipline */}
                  {Object.entries(disciplineGroups).map(([disc, group]) => {
                    const subtotal = group.reduce((acc, d) => sumHours(acc, d.hours), zeroHours());
                    const subtotalHrs = totalSpecialty(subtotal);
                    return (
                      <>
                        {/* Discipline separator */}
                        <tr key={`head-${disc}`} className="bg-gray-800/60">
                          <td
                            colSpan={5 + SPECIALTY_HOUR_KEYS.length + 1}
                            className="px-3 py-1 text-gray-400 font-semibold uppercase text-[10px] tracking-widest"
                          >
                            {DISCIPLINE_NAMES[disc] ?? disc}
                          </td>
                        </tr>
                        {/* Documents */}
                        {group.map((doc, i) => (
                          <tr key={`${disc}-${i}`} className="border-t border-gray-800/60 hover:bg-gray-800/20">
                            <td className="px-3 py-1.5 font-mono text-gray-300 whitespace-nowrap">{doc.code}</td>
                            <td className="px-3 py-1.5 text-gray-300 max-w-[250px] truncate">{doc.description}</td>
                            <td className="px-3 py-1.5 text-gray-400">{doc.disciplineCode}-{doc.typeCode}</td>
                            <td className="px-3 py-1.5 text-gray-400">{doc.revision}</td>
                            <td className="px-3 py-1.5 text-right text-gray-400">{doc.baseHours}</td>
                            {SPECIALTY_HOUR_KEYS.map(k => (
                              <td key={k} className="px-2 py-1.5 text-right text-gray-200">
                                {fmt(doc.hours[k])}
                              </td>
                            ))}
                            <td className="px-3 py-1.5 text-right font-semibold text-yellow-300">
                              {fmtTotal(doc.totalHours)}
                            </td>
                          </tr>
                        ))}
                        {/* Discipline subtotal */}
                        <tr key={`sub-${disc}`} className="bg-gray-800/40 border-t border-gray-700">
                          <td colSpan={4} className="px-3 py-1.5 text-[10px] text-gray-500 italic">
                            Subtotal {DISCIPLINE_NAMES[disc] ?? disc}
                          </td>
                          <td className="px-3 py-1.5 text-right text-gray-500 text-[10px]">
                            {group.reduce((s, d) => s + d.baseHours, 0)}
                          </td>
                          {SPECIALTY_HOUR_KEYS.map(k => (
                            <td key={k} className="px-2 py-1.5 text-right text-gray-400 text-[10px]">
                              {fmt(subtotal[k])}
                            </td>
                          ))}
                          <td className="px-3 py-1.5 text-right text-gray-400 text-[10px]">
                            {fmtTotal(subtotalHrs)}
                          </td>
                        </tr>
                      </>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-950/60 border-t-2 border-blue-700">
                    <td colSpan={4} className="px-3 py-2 font-bold text-blue-300 uppercase text-xs tracking-wide">
                      TOTAL HS POR ESPECIALIDAD — ING. DETALLE
                    </td>
                    <td className="px-3 py-2 text-right text-gray-300 font-semibold">
                      {report.documents.reduce((s, d) => s + d.baseHours, 0)}
                    </td>
                    {SPECIALTY_HOUR_KEYS.map(k => (
                      <td key={k} className="px-2 py-2 text-right font-bold text-blue-200">
                        {fmtTotal(report.totals[k])}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-bold text-yellow-300 text-sm">
                      {fmtTotal(report.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {SPECIALTY_HOUR_KEYS.map(k => (
                <div key={k} className="bg-gray-800 rounded-lg border border-gray-700 p-3">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                    {SPECIALTY_HOUR_LABELS[k]}
                  </div>
                  <div className="text-2xl font-bold text-blue-300">
                    {fmtTotal(report.totals[k])}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {report.grandTotal > 0
                      ? ((report.totals[k] / report.grandTotal) * 100).toFixed(1) + '%'
                      : '—'}
                  </div>
                </div>
              ))}
            </div>

            {/* Discipline summary */}
            <div className="rounded border border-gray-700 overflow-hidden">
              <div className="bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Resumen por Especialidad
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-900 text-gray-500">
                    <th className="text-left px-4 py-2">ESPECIALIDAD</th>
                    <th className="text-center px-3 py-2">DOCS</th>
                    {SPECIALTY_HOUR_KEYS.map(k => (
                      <th key={k} className="text-right px-2 py-2">{SPECIALTY_HOUR_LABELS[k]}</th>
                    ))}
                    <th className="text-right px-4 py-2 text-yellow-400">TOTAL</th>
                    <th className="text-right px-4 py-2">% INC.</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(disciplineGroups).map(([disc, group]) => {
                    const sub = group.reduce((acc, d) => sumHours(acc, d.hours), zeroHours());
                    const subTotal = totalSpecialty(sub);
                    return (
                      <tr key={disc} className="border-t border-gray-800 hover:bg-gray-800/20">
                        <td className="px-4 py-2 font-medium text-gray-300">
                          {DISCIPLINE_NAMES[disc] ?? disc}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-400">{group.length}</td>
                        {SPECIALTY_HOUR_KEYS.map(k => (
                          <td key={k} className="px-2 py-2 text-right text-gray-300">
                            {fmt(sub[k])}
                          </td>
                        ))}
                        <td className="px-4 py-2 text-right font-bold text-yellow-300">
                          {fmtTotal(subTotal)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-400">
                          {report.grandTotal > 0
                            ? ((subTotal / report.grandTotal) * 100).toFixed(1) + '%'
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-600 bg-gray-800/60">
                    <td className="px-4 py-2 font-bold text-gray-200">TOTAL GENERAL</td>
                    <td className="px-3 py-2 text-center font-bold text-gray-200">
                      {report.documents.length}
                    </td>
                    {SPECIALTY_HOUR_KEYS.map(k => (
                      <td key={k} className="px-2 py-2 text-right font-bold text-blue-200">
                        {fmtTotal(report.totals[k])}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right font-bold text-yellow-300 text-sm">
                      {fmtTotal(report.grandTotal)}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-gray-200">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
