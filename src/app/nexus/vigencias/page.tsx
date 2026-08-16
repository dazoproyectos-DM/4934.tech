'use client';

import { AlertTriangle, CalendarClock, Gauge, CheckCircle2, Lock } from 'lucide-react';
import { useNexus, useRecursosFiltrados } from '@/hooks/useNexusStore';
import { alertasVencimiento, fmtFecha } from '@/lib/nexus/engine';
import { PLAZO_ALERTA_VENCIMIENTO_DIAS } from '@/lib/nexus/constants';
import { SectionCard, EmptyState } from '@/components/nexus/ui';

export default function VigenciasPage() {
  const { requisitoLabelById, empresaPorId, aplicacionesMensuales, actualizarAplicacionMensual, empresaSeleccionada, agregarEvento } = useNexus();
  const recursos = useRecursosFiltrados();

  const alertas = alertasVencimiento(recursos, requisitoLabelById);
  const vencidas = alertas.filter(a => a.diasRestantes < 0);
  const proximas = alertas.filter(a => a.diasRestantes >= 0);

  const aplicaciones = aplicacionesMensuales.filter(a => empresaSeleccionada === 'todas' || a.empresaId === empresaSeleccionada);

  const marcarDeclarado = (id: string) => {
    actualizarAplicacionMensual(id, { diasHorasDeclarados: true });
    const ap = aplicaciones.find(a => a.id === id);
    if (ap) agregarEvento({ id: `ev-${Date.now()}`, tipo: 'modificacion_registro', empresaId: ap.empresaId, fecha: new Date().toISOString(), detalle: `Declaración de días y horas trabajadas completada para ${ap.periodo}.` });
  };

  const marcarGia = (id: string) => {
    actualizarAplicacionMensual(id, { planillaGiaCargada: true });
    const ap = aplicaciones.find(a => a.id === id);
    if (ap) agregarEvento({ id: `ev-${Date.now()}`, tipo: 'modificacion_registro', empresaId: ap.empresaId, fecha: new Date().toISOString(), detalle: `Planilla GIA de accidentabilidad cargada para ${ap.periodo}.` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-blue-400">Control de Vigencias y Auditoría Mensual</h1>
        <p className="text-sm text-gray-400 mt-1">
          Alertas automáticas a {PLAZO_ALERTA_VENCIMIENTO_DIAS} días, bloqueo de aplicación mensual y Planilla GIA de accidentabilidad.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vencidos */}
        <SectionCard title="Documentos vencidos" subtitle="Requieren regularización inmediata" className={vencidas.length > 0 ? 'ring-1 ring-red-900/40' : ''}>
          {vencidas.length === 0 ? (
            <EmptyState text="Sin documentos vencidos." />
          ) : (
            <ul className="space-y-2">
              {vencidas.map((a, i) => (
                <li key={i} className="flex items-start gap-2 bg-red-950/20 border border-red-900/40 rounded-lg px-3 py-2 text-xs">
                  <AlertTriangle className="size-3.5 text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-200">{a.recursoNombre}</p>
                    <p className="text-gray-500">{a.requisitoLabel} · {empresaPorId[a.empresaId]?.razonSocial}</p>
                  </div>
                  <span className="text-red-400 font-semibold whitespace-nowrap">Vencido hace {Math.abs(a.diasRestantes)}d</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Próximos a vencer */}
        <SectionCard title={`Vencen dentro de ${PLAZO_ALERTA_VENCIMIENTO_DIAS} días`} subtitle="Notificación automática al contratista">
          {proximas.length === 0 ? (
            <EmptyState text="Sin vencimientos próximos." />
          ) : (
            <ul className="space-y-2">
              {proximas.map((a, i) => (
                <li key={i} className="flex items-start gap-2 bg-amber-950/10 border border-amber-900/30 rounded-lg px-3 py-2 text-xs">
                  <CalendarClock className="size-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-200">{a.recursoNombre}</p>
                    <p className="text-gray-500">{a.requisitoLabel} · {empresaPorId[a.empresaId]?.razonSocial}</p>
                    <p className="text-gray-600">Vence {fmtFecha(a.fechaVencimiento)}</p>
                  </div>
                  <span className={`whitespace-nowrap font-medium ${a.diasRestantes <= 15 ? 'text-amber-400' : 'text-gray-400'}`}>{a.diasRestantes} días</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Aplicación mensual */}
      <SectionCard
        title="Bloqueo de Aplicación Mensual"
        subtitle="Declaración de días y horas trabajadas (1° al 3° día hábil) y carga de Planilla GIA"
        action={<span className="inline-flex items-center gap-1 text-[11px] text-gray-500"><Lock className="size-3" /> Período 2026-08</span>}
      >
        {aplicaciones.length === 0 ? (
          <EmptyState text="Sin registros de aplicación mensual." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {aplicaciones.map(ap => (
              <div key={ap.id} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-200">{empresaPorId[ap.empresaId]?.razonSocial}</p>
                  <span className="text-[10px] text-gray-500">{ap.periodo}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Días y horas declarados</span>
                  {ap.diasHorasDeclarados ? (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  ) : (
                    <button onClick={() => marcarDeclarado(ap.id)} className="text-[11px] text-blue-400 hover:text-blue-300">Declarar</button>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Planilla GIA cargada</span>
                  {ap.planillaGiaCargada ? (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  ) : (
                    <button onClick={() => marcarGia(ap.id)} className="text-[11px] text-blue-400 hover:text-blue-300">Cargar GIA</button>
                  )}
                </div>
                {(ap.kmRecorridos !== undefined || ap.indiceConductaManejo !== undefined || ap.horasFormacionMass !== undefined) && (
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-gray-800">
                    <div className="text-center">
                      <p className="text-[9px] text-gray-500 uppercase flex items-center justify-center gap-0.5"><Gauge className="size-2.5" />KM</p>
                      <p className="text-[11px] text-gray-300">{ap.kmRecorridos ?? '—'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-gray-500 uppercase">Conducta</p>
                      <p className="text-[11px] text-gray-300">{ap.indiceConductaManejo ?? '—'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-gray-500 uppercase">Hs MASS</p>
                      <p className="text-[11px] text-gray-300">{ap.horasFormacionMass ?? '—'}</p>
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-gray-600">Límite: {fmtFecha(ap.fechaLimiteDeclaracion)}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
