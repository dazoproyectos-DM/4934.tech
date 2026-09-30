'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { ReportData } from '@/types/p3';
import { processDocuments, generateReport, parseXlsRows } from '@/lib/p3/hours-calculator';

export interface BatchReport {
  fileName: string;
  projectName: string;
  documentCount: number;
  totalHours: number;
  status: 'success' | 'error';
  error?: string;
  report?: ReportData;
}

export default function BatchReportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<BatchReport[]>([]);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processBatch = async () => {
    if (files.length === 0) {
      setError('Seleccione al menos un archivo.');
      return;
    }

    setProcessing(true);
    setError('');
    setResults([]);

    const batchResults: BatchReport[] = [];

    for (const file of files) {
      try {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
        const docs = parseXlsRows(rows);

        if (docs.length === 0) {
          batchResults.push({
            fileName: file.name,
            projectName: 'ERROR',
            documentCount: 0,
            totalHours: 0,
            status: 'error',
            error: 'No documents found in file',
          });
          continue;
        }

        const processed = processDocuments(docs);
        const projectName = extractProjectName(rows) || file.name;
        const report = generateReport(processed, {
          projectName,
          projectCode: extractProjectCode(rows) || '',
          yacimiento: extractYacimiento(rows) || '',
        });

        batchResults.push({
          fileName: file.name,
          projectName: report.projectName,
          documentCount: report.documents.length,
          totalHours: report.grandTotal,
          status: 'success',
          report,
        });
      } catch (err) {
        batchResults.push({
          fileName: file.name,
          projectName: 'ERROR',
          documentCount: 0,
          totalHours: 0,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    setResults(batchResults);
    setProcessing(false);
  };

  const exportBatchAsXls = async () => {
    if (results.length === 0) return;

    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = results.map(r => [
      r.fileName,
      r.projectName,
      r.documentCount,
      r.totalHours.toFixed(1),
      r.status === 'success' ? 'OK' : `ERROR: ${r.error}`,
    ]);

    const summaryWs = XLSX.utils.aoa_to_sheet([
      ['Archivo', 'Proyecto', 'Documentos', 'Horas Total', 'Estado'],
      ...summaryData,
    ]);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

    // Individual sheets for successful reports
    for (const result of results) {
      if (result.status === 'success' && result.report) {
        const sheetName = result.projectName.substring(0, 31);
        const data = result.report.documents.map(d => [
          d.code,
          d.description,
          d.disciplineName,
          d.baseHours,
          d.totalHours,
        ]);
        const ws = XLSX.utils.aoa_to_sheet([
          ['Documento', 'Descripción', 'Especialidad', 'HS Base', 'Total'],
          ...data,
        ]);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    }

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Batch_Reports_${date}.xlsx`);
  };

  const exportBatchAsJson = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      totalFiles: results.length,
      successCount: results.filter(r => r.status === 'success').length,
      reports: results.map(r => ({
        fileName: r.fileName,
        projectName: r.projectName,
        documentCount: r.documentCount,
        totalHours: r.totalHours,
        status: r.status,
        error: r.error,
        report: r.report,
      })),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Batch_Reports_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const totalHours = results.reduce((sum, r) => sum + (r.status === 'success' ? r.totalHours : 0), 0);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-6 border-b border-gray-700 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-blue-400">
              PROCESAMIENTO EN LOTE
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              P3 — Procesa múltiples archivos XLS simultáneamente
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/p3/reportes/computo-horas"
              className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded border border-gray-600 transition-colors"
            >
              ← Volver
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded px-3 py-2">
            {error}
          </div>
        )}

        {/* File upload */}
        <section className="mb-6 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">
            Seleccionar Archivos
          </h2>

          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".xls,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors font-medium"
            >
              + Agregar archivos
            </button>
            {files.length > 0 && (
              <button
                onClick={() => setFiles([])}
                className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>

          {files.length > 0 && (
            <div className="space-y-2 mb-4">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-900 p-2 rounded">
                  <span className="text-sm text-gray-300">{file.name}</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <button
              onClick={processBatch}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2 rounded transition-colors"
            >
              {processing ? 'Procesando...' : `Procesar ${files.length} archivo${files.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </section>

        {/* Results */}
        {results.length > 0 && (
          <section className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-900 border-b border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-300">{results.length}</div>
                <div className="text-xs text-gray-500">Archivos procesados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-300">{successCount}</div>
                <div className="text-xs text-gray-500">Exitosos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-300">{results.length - successCount}</div>
                <div className="text-xs text-gray-500">Con error</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-300">{totalHours.toFixed(1)}</div>
                <div className="text-xs text-gray-500">Horas totales</div>
              </div>
            </div>

            {/* Export buttons */}
            {successCount > 0 && (
              <div className="p-4 border-b border-gray-700 flex gap-2">
                <button
                  onClick={exportBatchAsXls}
                  className="text-xs bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors font-medium"
                >
                  Exportar como XLS
                </button>
                <button
                  onClick={exportBatchAsJson}
                  className="text-xs bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded transition-colors font-medium"
                >
                  Exportar como JSON
                </button>
              </div>
            )}

            {/* Results table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900 text-gray-400">
                    <th className="text-left px-4 py-2 font-medium">Archivo</th>
                    <th className="text-left px-4 py-2 font-medium">Proyecto</th>
                    <th className="text-center px-4 py-2 font-medium">Docs</th>
                    <th className="text-right px-4 py-2 font-medium">Horas</th>
                    <th className="text-center px-4 py-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, i) => (
                    <tr key={i} className="border-t border-gray-700 hover:bg-gray-800/50">
                      <td className="px-4 py-2 text-gray-300 font-mono text-xs">{result.fileName}</td>
                      <td className="px-4 py-2 text-gray-300">{result.projectName}</td>
                      <td className="px-4 py-2 text-center text-gray-400">{result.documentCount}</td>
                      <td className="px-4 py-2 text-right text-yellow-300 font-semibold">
                        {result.totalHours.toFixed(1)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {result.status === 'success' ? (
                          <span className="inline-block bg-green-900 text-green-200 px-2 py-1 rounded text-xs">
                            ✓ OK
                          </span>
                        ) : (
                          <span className="inline-block bg-red-900 text-red-200 px-2 py-1 rounded text-xs" title={result.error}>
                            ✕ Error
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function extractProjectName(rows: unknown[][]): string {
  for (const row of rows) {
    const r = row as string[];
    const cell = r.find(c => typeof c === 'string' && c.includes('PROYECTO'));
    if (cell) {
      const match = String(cell).match(/PROYECTO[:\s]+(.+)/i);
      if (match) return match[1].trim();
    }
  }
  return '';
}

function extractProjectCode(rows: unknown[][]): string {
  for (const row of rows) {
    const r = row as string[];
    const cell = r.find(c => typeof c === 'string' && /^[A-Z0-9-]{10,}$/.test(String(c)));
    if (cell) return String(cell).trim();
  }
  return '';
}

function extractYacimiento(rows: unknown[][]): string {
  for (const row of rows) {
    const r = row as string[];
    const cell = r.find(c => typeof c === 'string' && c.includes('YACIMIENTO'));
    if (cell) {
      const match = String(cell).match(/YACIMIENTO[:\s]+(.+)/i);
      if (match) return match[1].trim();
    }
  }
  return '';
}
