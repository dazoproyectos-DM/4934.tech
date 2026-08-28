'use client';

import { ArrowRight, XCircle, Clock, Sparkles } from 'lucide-react';
import { useNexus, useRecursosFiltrados } from '@/hooks/useNexusStore';
import { ESTADO_AVAL_LABEL, ESTADO_AVAL_ORDER, PLAZO_AVAL_ALTA_HORAS, TIPO_RECURSO_LABEL } from '@/lib/nexus/constants';
import { fmtFecha } from '@/lib/nexus/engine';
import { SectionCard, EmptyState } from '@/components/nexus/ui';
import type { EstadoAval } from '@/types/nexus';

const COLUMN_HINT: Record<EstadoAval, string> = {
  nuevo: 'Carga inicial de la ficha y solicitud de afectación.',
  pendiente_inspector: 'Seguimiento de la validación del Inspector de YPF.',
  aprobada: 'Se habilita la carga en el portal SRC-Digitalización.',
  avalado: `Resultado final tras la auditoría (${PLAZO_AVAL_ALTA_HORAS}hs altas / 72hs bajas). Habilita el acceso físico.`,
  rechazado: 'Requiere corrección de documentación antes de reingresar al flujo.',
};

function horasTranscurridas(fechaISO: string): number {
  return Math.round((Date.now() - new Date(fechaISO).getTime()) / (1000 * 60 * 60));
}

export default function AprobacionesPage() {
  const { ordenesTrabajo, empresaPorId, cambiarEstadoAval, agregarEvento } = useNexus();
  const recursos = useRecursosFiltrados().filter(r => r.activo);

  const avanzar = (id: string, actual: EstadoAval) => {
    const idx = ESTADO_AVAL_ORDER.indexOf(actual);
    const siguiente = ESTADO_AVAL_ORDER[Math.min(idx + 1, ESTADO_AVAL_ORDER.length - 1)];
    cambiarEstadoAval(id, siguiente);
    agregarEvento({
      id: `ev-${Date.now()}`,
      tipo: 'cambio_estado',
      recursoId: id,
      empresaId: recursos.find(r => r.id === id)?.empresaId ?? '',
      fecha: new Date().toISOString(),
      detalle: `Recurso pasó de "${ESTADO_AVAL_LABEL[actual]}" a "${ESTADO_AVAL_LABEL[siguiente]}".`,
    });
  };

  const rechazar = (id: string) => {
    cambiarEstadoAval(id, 'rechazado');
    agregarEvento({
      id: `ev-${Date.now()}`,
      tipo: 'cambio_estado',
      recursoId: id,
      empresaId: recursos.find(r => r.id === id)?.empresaId ?? '',
      fecha: new Date().toISOString(),
      detalle: 'Recurso rechazado por el Inspector — requiere corrección de documentación.',
    });
  };

  const columnas: EstadoAval[] = ['nuevo', 'pendiente_inspector', 'aprobada', 'avalado'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-blue-400">Seguimiento y Flujo de Aprobación</h1>
        <p className="text-sm text-gray-400 mt-1">Dashboard &quot;Nexus&quot; — replica en tiempo real el estado del recurso en el SRC.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {columnas.map(estado => {
          const items = recursos.filter(r => r.estadoAval === estado);
          return (
            <div key={estado} className="rounded-xl border border-gray-800 bg-gray-900/30 flex flex-col min-h-[200px]">
              <div className="px-3 py-2.5 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wide">{ESTADO_AVAL_LABEL[estado]}</h3>
                  <span className="text-[11px] text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">{items.length}</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-snug">{COLUMN_HINT[estado]}</p>
              </div>
              <div className="p-2 flex-1 space-y-2 overflow-y-auto">
                {items.length === 0 && <p className="text-[11px] text-gray-600 italic px-2 py-4 text-center">Sin recursos</p>}
                {items.map(r => {
                  const ot = ordenesTrabajo.find(o => o.id === r.otId);
                  const horas = horasTranscurridas(r.fechaAfectacion);
                  const fueraSla = estado !== 'avalado' && horas > PLAZO_AVAL_ALTA_HORAS;
                  return (
                    <div key={r.id} className="bg-gray-950 border border-gray-800 rounded-lg p-2.5 space-y-1.5">
                      <p className="text-xs text-gray-200 font-medium leading-snug">{r.nombre}</p>
                      <p className="text-[10px] text-gray-500">{TIPO_RECURSO_LABEL[r.tipo]} · {empresaPorId[r.empresaId]?.razonSocial}</p>
                      <p className="text-[10px] text-gray-600">{ot?.codigo}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] ${fueraSla ? 'text-red-400' : 'text-gray-500'}`}>
                          <Clock className="size-3" /> {horas}h
                        </span>
                        <div className="flex items-center gap-2">
                          {estado !== 'avalado' && (
                            <button onClick={() => rechazar(r.id)} title="Rechazar" className="text-gray-600 hover:text-red-400">
                              <XCircle className="size-3.5" />
                            </button>
                          )}
                          {estado !== 'avalado' && (
                            <button onClick={() => avanzar(r.id, estado)} title="Avanzar estado" className="text-gray-500 hover:text-emerald-400">
                              <ArrowRight className="size-3.5" />
                            </button>
                          )}
                          {estado === 'avalado' && r.fechaAvalado && (
                            <span className="text-[10px] text-emerald-400">{fmtFecha(r.fechaAvalado)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <SectionCard title="Rechazados" subtitle="Requieren corrección antes de reingresar al flujo">
        {recursos.filter(r => r.estadoAval === 'rechazado').length === 0 ? (
          <EmptyState text="No hay recursos rechazados." />
        ) : (
          <ul className="space-y-2">
            {recursos.filter(r => r.estadoAval === 'rechazado').map(r => (
              <li key={r.id} className="flex items-center justify-between text-xs bg-red-950/20 border border-red-900/40 rounded-lg px-3 py-2">
                <span className="text-gray-200">{r.nombre} — {empresaPorId[r.empresaId]?.razonSocial}</span>
                <button
                  onClick={() => cambiarEstadoAval(r.id, 'nuevo')}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                >
                  <Sparkles className="size-3" /> Reingresar como Nuevo
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
