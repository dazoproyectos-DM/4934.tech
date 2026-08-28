'use client';

import { useMemo } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { useNexus, useRecursosFiltrados } from '@/hooks/useNexusStore';
import { checklistRecurso, documentosFaltantesOVencidos, semaforoRecurso } from '@/lib/nexus/engine';
import { TIPO_CONTRATO_LABEL, TIPO_RECURSO_LABEL } from '@/lib/nexus/constants';
import { SectionCard, EmptyState, SemaforoDot, EstadoAvalBadge, ProgressBar } from '@/components/nexus/ui';
import type { Semaforo } from '@/types/nexus';

export default function ControlPage() {
  const { empresas, empresaPorId, ordenesTrabajo, tipoContratoPorOt } = useNexus();
  const recursos = useRecursosFiltrados().filter(r => r.activo);

  const filas = useMemo(
    () =>
      recursos.map(r => {
        const tipoContrato = tipoContratoPorOt[r.otId];
        const semaforo = semaforoRecurso(r, tipoContrato);
        const faltantes = documentosFaltantesOVencidos(r, tipoContrato);
        const checklist = checklistRecurso(r, tipoContrato);
        return { recurso: r, semaforo, faltantes, total: checklist.length };
      }),
    [recursos, tipoContratoPorOt]
  );

  const resumen = { verde: filas.filter(f => f.semaforo === 'verde').length, amarillo: filas.filter(f => f.semaforo === 'amarillo').length, rojo: filas.filter(f => f.semaforo === 'rojo').length };

  const porEmpresa = empresas.map(emp => {
    const propias = filas.filter(f => f.recurso.empresaId === emp.id);
    const cumplimiento = propias.length === 0 ? 100 : Math.round((propias.filter(f => f.semaforo === 'verde').length / propias.length) * 100);
    return { empresa: emp, total: propias.length, cumplimiento, rojo: propias.filter(f => f.semaforo === 'rojo').length, amarillo: propias.filter(f => f.semaforo === 'amarillo').length };
  }).filter(p => p.total > 0);

  const ordenPrioridad: Record<Semaforo, number> = { rojo: 0, amarillo: 1, verde: 2 };
  const filasOrdenadas = [...filas].sort((a, b) => ordenPrioridad[a.semaforo] - ordenPrioridad[b.semaforo]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-blue-400">Sector de Control</h1>
        <p className="text-sm text-gray-400 mt-1">Semáforo de cumplimiento: qué le falta a cada recurso para alcanzar el estado &quot;Avalado&quot;.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-4 flex items-center gap-3">
          <ShieldCheck className="size-6 text-emerald-400" />
          <div>
            <p className="text-2xl font-bold text-emerald-300">{resumen.verde}</p>
            <p className="text-[11px] text-gray-400">En regla (avalado, vigente, sin faltantes)</p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-4 flex items-center gap-3">
          <ShieldAlert className="size-6 text-amber-400" />
          <div>
            <p className="text-2xl font-bold text-amber-300">{resumen.amarillo}</p>
            <p className="text-[11px] text-gray-400">Atención: pendiente de inspector o vencimiento próximo</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-900/40 bg-red-950/10 p-4 flex items-center gap-3">
          <ShieldX className="size-6 text-red-400" />
          <div>
            <p className="text-2xl font-bold text-red-300">{resumen.rojo}</p>
            <p className="text-[11px] text-gray-400">Crítico: documentación faltante, vencida o rechazado</p>
          </div>
        </div>
      </div>

      <SectionCard title="Cumplimiento por empresa">
        {porEmpresa.length === 0 ? (
          <EmptyState text="Sin datos." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {porEmpresa.map(p => (
              <div key={p.empresa.id} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-200 font-medium truncate">{p.empresa.razonSocial}</p>
                  <span className="text-xs font-bold text-gray-300">{p.cumplimiento}%</span>
                </div>
                <ProgressBar pct={p.cumplimiento} tone={p.cumplimiento >= 80 ? 'good' : p.cumplimiento >= 50 ? 'warn' : 'bad'} />
                <p className="text-[10px] text-gray-500">{p.total} recursos · {p.rojo} crítico · {p.amarillo} atención</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Matriz de Auditoría" subtitle="Requisitos Empresa y Recursos · Informe de Cumplimiento por recurso">
        {filasOrdenadas.length === 0 ? (
          <EmptyState text="Sin recursos activos." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-800">
                  <th className="py-2 pr-3 font-medium">Semáforo</th>
                  <th className="py-2 pr-3 font-medium">Recurso</th>
                  <th className="py-2 pr-3 font-medium">Empresa</th>
                  <th className="py-2 pr-3 font-medium">Tipo Contrato</th>
                  <th className="py-2 pr-3 font-medium">Estado Aval</th>
                  <th className="py-2 pr-3 font-medium text-right">Documentos OK</th>
                </tr>
              </thead>
              <tbody>
                {filasOrdenadas.map(({ recurso, semaforo, faltantes, total }) => {
                  const ot = ordenesTrabajo.find(o => o.id === recurso.otId);
                  return (
                    <tr key={recurso.id} className="border-b border-gray-900 hover:bg-gray-900/40">
                      <td className="py-2 pr-3"><SemaforoDot estado={semaforo} /></td>
                      <td className="py-2 pr-3">
                        <p className="text-gray-200">{recurso.nombre}</p>
                        <p className="text-gray-600">{TIPO_RECURSO_LABEL[recurso.tipo]}</p>
                      </td>
                      <td className="py-2 pr-3 text-gray-400">{empresaPorId[recurso.empresaId]?.razonSocial}</td>
                      <td className="py-2 pr-3 text-gray-400">{ot && TIPO_CONTRATO_LABEL[ot.tipoContrato]}</td>
                      <td className="py-2 pr-3"><EstadoAvalBadge estado={recurso.estadoAval} /></td>
                      <td className="py-2 pr-3 text-right">
                        <span className={faltantes > 0 ? 'text-red-400' : 'text-emerald-400'}>{total - faltantes}/{total}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
