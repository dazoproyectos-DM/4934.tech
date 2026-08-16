'use client';

import { useMemo, useState } from 'react';
import { FileBarChart2, Download, History, ListChecks } from 'lucide-react';
import { useNexus, useRecursosFiltrados } from '@/hooks/useNexusStore';
import { generarReporteSemanal, inicioSemanaActual, fmtFecha } from '@/lib/nexus/engine';
import { SectionCard, EmptyState, StatCard, ProgressBar } from '@/components/nexus/ui';
import { ESTADO_AVAL_LABEL } from '@/lib/nexus/constants';
import type { EstadoAval } from '@/types/nexus';

export default function AuditoriaPage() {
  const {
    recursos, eventosAuditoria, ordenesTrabajo, empresaSeleccionada, empresaPorId,
    reportesSemanales, agregarReporteSemanal,
  } = useNexus();
  const recursosVisibles = useRecursosFiltrados();

  const semanaDefault = inicioSemanaActual();
  const [desde, setDesde] = useState(semanaDefault.desde.toISOString().slice(0, 10));
  const [hasta, setHasta] = useState(semanaDefault.hasta.toISOString().slice(0, 10));
  const [reporteActual, setReporteActual] = useState(reportesSemanales[0] ?? null);

  const tipoContratoPorOt = useMemo(() => Object.fromEntries(ordenesTrabajo.map(o => [o.id, o.tipoContrato])), [ordenesTrabajo]);

  const generar = () => {
    const reporte = generarReporteSemanal(
      recursos,
      eventosAuditoria,
      tipoContratoPorOt,
      empresaSeleccionada,
      new Date(`${desde}T00:00:00`),
      new Date(`${hasta}T23:59:59`)
    );
    agregarReporteSemanal(reporte);
    setReporteActual(reporte);
  };

  const exportarXls = async () => {
    if (!reporteActual) return;
    const XLSX = await import('xlsx');

    const resumen = [
      ['REPORTE SEMANAL — NEXUS EMPRESARIAL'],
      ['Generado', fmtFecha(reporteActual.generadoEl)],
      ['Período', `${fmtFecha(reporteActual.semanaDesde)} — ${fmtFecha(reporteActual.semanaHasta)}`],
      ['Empresa', reporteActual.empresaId === 'todas' ? 'Todas' : empresaPorId[reporteActual.empresaId]?.razonSocial ?? reporteActual.empresaId],
      [],
      ['Total recursos', reporteActual.totalRecursos],
      ['Avalados', reporteActual.avalados],
      ['Pendientes', reporteActual.pendientes],
      ['Rechazados', reporteActual.rechazados],
      ['Vencimientos próximos (45 días)', reporteActual.vencimientosProximos],
      ['Documentos faltantes/vencidos', reporteActual.documentosFaltantes],
      ['Cumplimiento (%)', reporteActual.cumplimientoPct],
      ['Eventos de auditoría en la semana', reporteActual.eventos],
    ];

    const empresaFiltro = reporteActual.empresaId === 'todas' ? recursos : recursos.filter(r => r.empresaId === reporteActual.empresaId);
    const detalle = [
      ['Recurso', 'Empresa', 'OT', 'Estado Aval', 'Activo'],
      ...empresaFiltro.map(r => [
        r.nombre,
        empresaPorId[r.empresaId]?.razonSocial ?? r.empresaId,
        ordenesTrabajo.find(o => o.id === r.otId)?.codigo ?? r.otId,
        ESTADO_AVAL_LABEL[r.estadoAval],
        r.activo ? 'Sí' : 'No',
      ]),
    ];

    const eventosSemana = eventosAuditoria.filter(e => {
      if (reporteActual.empresaId !== 'todas' && e.empresaId !== reporteActual.empresaId) return false;
      const f = new Date(e.fecha);
      return f >= new Date(reporteActual.semanaDesde) && f <= new Date(reporteActual.semanaHasta);
    });
    const eventosSheet = [
      ['Fecha', 'Tipo', 'Empresa', 'Detalle'],
      ...eventosSemana.map(e => [fmtFecha(e.fecha), e.tipo, empresaPorId[e.empresaId]?.razonSocial ?? e.empresaId, e.detalle]),
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), 'Resumen');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detalle), 'Recursos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(eventosSheet), 'Eventos');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `Reporte_Semanal_Nexus_${date}.xlsx`);
  };

  const porEstado = (['nuevo', 'pendiente_inspector', 'aprobada', 'avalado', 'rechazado'] as EstadoAval[]).map(estado => ({
    estado,
    count: recursosVisibles.filter(r => r.activo && r.estadoAval === estado).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-blue-400">Sector de Auditoría</h1>
        <p className="text-sm text-gray-400 mt-1">Generación del Reporte Semanal de cumplimiento — alertas de auditoría al modificar registros.</p>
      </div>

      <SectionCard title="Generar Reporte Semanal" subtitle="Selecciona el período; el filtro de empresa activo en la barra superior se aplica automáticamente">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-gray-500 uppercase">Desde</span>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-200" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-gray-500 uppercase">Hasta</span>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-200" />
          </label>
          <button onClick={generar} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg">
            <FileBarChart2 className="size-3.5" /> Generar reporte
          </button>
          {reporteActual && (
            <button onClick={exportarXls} className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium px-4 py-2 rounded-lg">
              <Download className="size-3.5" /> Exportar XLS
            </button>
          )}
        </div>
      </SectionCard>

      {reporteActual && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Recursos evaluados" value={reporteActual.totalRecursos} />
            <StatCard label="Cumplimiento" value={`${reporteActual.cumplimientoPct}%`} tone={reporteActual.cumplimientoPct >= 80 ? 'good' : reporteActual.cumplimientoPct >= 50 ? 'warn' : 'bad'} />
            <StatCard label="Vencimientos próximos" value={reporteActual.vencimientosProximos} tone={reporteActual.vencimientosProximos > 0 ? 'warn' : 'default'} />
            <StatCard label="Documentos faltantes" value={reporteActual.documentosFaltantes} tone={reporteActual.documentosFaltantes > 0 ? 'bad' : 'good'} />
          </div>

          <SectionCard title="Distribución por estado" subtitle={`Semana ${fmtFecha(reporteActual.semanaDesde)} — ${fmtFecha(reporteActual.semanaHasta)}`}>
            <div className="space-y-3">
              {porEstado.map(({ estado, count }) => (
                <div key={estado} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">{ESTADO_AVAL_LABEL[estado]}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <ProgressBar
                    pct={reporteActual.totalRecursos ? (count / reporteActual.totalRecursos) * 100 : 0}
                    tone={estado === 'avalado' ? 'good' : estado === 'rechazado' ? 'bad' : 'default'}
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}

      <SectionCard title="Historial de reportes" subtitle="Reportes semanales generados en esta sesión" action={<History className="size-4 text-gray-600" />}>
        {reportesSemanales.length === 0 ? (
          <EmptyState text="Todavía no se generaron reportes. Usá el panel superior para crear el primero." />
        ) : (
          <ul className="divide-y divide-gray-800">
            {reportesSemanales.map(r => (
              <li key={r.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <ListChecks className="size-3.5 text-gray-500 shrink-0" />
                  <span className="text-gray-300 truncate">
                    {fmtFecha(r.semanaDesde)} — {fmtFecha(r.semanaHasta)} · {r.empresaId === 'todas' ? 'Todas las empresas' : empresaPorId[r.empresaId]?.razonSocial}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-gray-500">{r.cumplimientoPct}% cumplimiento</span>
                  <button onClick={() => setReporteActual(r)} className="text-blue-400 hover:text-blue-300">Ver</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
