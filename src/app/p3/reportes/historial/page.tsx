'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getHistory, deleteReport, clearHistory, formatDate } from '@/lib/p3/report-storage';
import type { StoredReport } from '@/lib/p3/report-storage';
import { exportToXls, exportToCsv, exportToPdf } from '@/lib/p3/export-utils';

export default function HistorialPage() {
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const history = getHistory();
    setReports(history);
    setLoading(false);
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este reporte?')) {
      deleteReport(id);
      setReports(reports.filter(r => r.id !== id));
    }
  };

  const handleClearAll = () => {
    if (confirm('¿Está seguro que desea eliminar TODOS los reportes guardados?')) {
      clearHistory();
      setReports([]);
    }
  };

  const handleExport = async (report: StoredReport, format: 'xls' | 'csv' | 'pdf') => {
    try {
      switch (format) {
        case 'xls':
          await exportToXls(report.data);
          break;
        case 'csv':
          exportToCsv(report.data);
          break;
        case 'pdf':
          await exportToPdf(report.data, { template: 'detailed' });
          break;
      }
    } catch {
      alert(`Error al exportar en formato ${format.toUpperCase()}`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-6 border-b border-gray-700 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-blue-400">
              HISTORIAL DE REPORTES
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              P3 — Reportes guardados (últimos 50)
            </p>
          </div>
          <Link
            href="/p3/reportes/computo-horas"
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors font-medium"
          >
            ← Volver a Computo
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Cargando historial...</div>
        ) : reports.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No hay reportes guardados aún.</p>
            <Link
              href="/p3/reportes/computo-horas"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Crear un nuevo reporte →
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleClearAll}
                className="text-xs bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded transition-colors"
              >
                🗑️ Limpiar historial
              </button>
            </div>

            <div className="grid gap-4">
              {reports.map(report => (
                <div key={report.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/80 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-blue-300">{report.projectName}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-gray-500">Código:</span>
                          <span className="ml-2 text-gray-200">{report.projectCode || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Yacimiento:</span>
                          <span className="ml-2 text-gray-200">{report.yacimiento || '—'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Documentos:</span>
                          <span className="ml-2 text-yellow-300 font-semibold">{report.documentCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Horas Total:</span>
                          <span className="ml-2 text-yellow-300 font-semibold">{report.totalHours.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        📅 {formatDate(report.timestamp)}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleExport(report, 'xls')}
                        className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors"
                      >
                        XLS
                      </button>
                      <button
                        onClick={() => handleExport(report, 'csv')}
                        className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => handleExport(report, 'pdf')}
                        className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                      >
                        🗑️ Del
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
