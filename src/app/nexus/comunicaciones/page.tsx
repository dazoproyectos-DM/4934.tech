'use client';

import { useState } from 'react';
import { Send, FileText, UserMinus, RotateCcw, CreditCard, CheckSquare } from 'lucide-react';
import { useNexus, useRecursosFiltrados } from '@/hooks/useNexusStore';
import { borradorExistente, fmtFecha } from '@/lib/nexus/engine';
import { MOTIVO_BAJA_EVIDENCIA, MOTIVO_BAJA_LABEL, OSPE_MOTIVOS } from '@/lib/nexus/constants';
import { SectionCard, EmptyState, OspeEstadoBadge } from '@/components/nexus/ui';
import type { MotivoBaja } from '@/types/nexus';

export default function ComunicacionesPage() {
  const {
    ordenesTrabajo, empresaPorId, comunicacionesOspe, agregarComunicacionOspe, actualizarComunicacionOspe,
    empresaSeleccionada, desafectarRecurso, reactivarRecurso, invalidarTarjeta, agregarEvento,
  } = useNexus();
  const recursos = useRecursosFiltrados();

  const [otId, setOtId] = useState(ordenesTrabajo[0]?.id ?? '');
  const [motivo, setMotivo] = useState(OSPE_MOTIVOS[0]);
  const [descripcion, setDescripcion] = useState('');
  const [bajaMotivo, setBajaMotivo] = useState<Record<string, MotivoBaja>>({});

  const otSeleccionada = ordenesTrabajo.find(o => o.id === otId);
  const draft = otId ? borradorExistente(comunicacionesOspe, otId) : undefined;

  const comunicacionesVisibles = empresaSeleccionada === 'todas'
    ? comunicacionesOspe
    : comunicacionesOspe.filter(c => c.empresaId === empresaSeleccionada);

  const crearPE = (comoBorrador: boolean) => {
    if (!otSeleccionada || !descripcion.trim()) return;
    if (comoBorrador && draft) return; // solo un borrador por área contractual
    const nueva = {
      id: `ospe-${Date.now()}`,
      tipo: 'pedido_empresa' as const,
      otId: otSeleccionada.id,
      empresaId: otSeleccionada.empresaId,
      motivo,
      descripcion: descripcion.trim(),
      estado: comoBorrador ? ('borrador' as const) : ('enviada' as const),
      autor: empresaPorId[otSeleccionada.empresaId]?.razonSocial ?? 'Empresa',
      fecha: new Date().toISOString(),
    };
    agregarComunicacionOspe(nueva);
    if (!comoBorrador) {
      agregarEvento({
        id: `ev-${Date.now()}`,
        tipo: 'comunicacion_enviada',
        empresaId: nueva.empresaId,
        fecha: new Date().toISOString(),
        detalle: `Pedido de Empresa enviado: "${motivo}" (${otSeleccionada.codigo}). Notificación automática al Inspector.`,
      });
    }
    setDescripcion('');
  };

  const enviarBorrador = (id: string) => {
    actualizarComunicacionOspe(id, { estado: 'enviada' });
    const c = comunicacionesOspe.find(x => x.id === id);
    if (c) agregarEvento({ id: `ev-${Date.now()}`, tipo: 'comunicacion_enviada', empresaId: c.empresaId, fecha: new Date().toISOString(), detalle: `Borrador enviado: "${c.motivo}".` });
  };

  const recursosActivos = recursos.filter(r => r.activo);
  const recursosDados = recursos.filter(r => !r.activo);

  const confirmarBaja = (recursoId: string) => {
    const m = bajaMotivo[recursoId] ?? 'renuncia';
    desafectarRecurso(recursoId, m);
    agregarEvento({
      id: `ev-${Date.now()}`,
      tipo: 'baja',
      recursoId,
      empresaId: recursos.find(r => r.id === recursoId)?.empresaId ?? '',
      fecha: new Date().toISOString(),
      detalle: `Desafectación registrada: ${MOTIVO_BAJA_LABEL[m]}.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-blue-400">Comunicaciones</h1>
        <p className="text-sm text-gray-400 mt-1">
          Módulo OS/PE — canal formal con el Inspector YPF — y proceso de Bajas / Desafectación de recursos.
        </p>
      </div>

      {/* Nuevo PE */}
      <SectionCard title="Nuevo Pedido de Empresa (PE)" subtitle="Iniciar comunicación o responder una Orden de Servicio (OS)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-gray-500 uppercase">Orden de Trabajo</span>
            <select value={otId} onChange={e => setOtId(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-200">
              {ordenesTrabajo.map(o => <option key={o.id} value={o.id}>{o.codigo}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-gray-500 uppercase">Motivo</span>
            <select value={motivo} onChange={e => setMotivo(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-200">
              {OSPE_MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-gray-500 uppercase">Área contractual</span>
            <p className="text-xs text-gray-400 px-3 py-1.5">{otSeleccionada?.areaContractual}</p>
          </div>
        </div>
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Descripción detallada…"
          rows={3}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
        />
        {draft && (
          <p className="text-[11px] text-amber-400 mt-2">
            Ya existe un borrador para esta área contractual — solo se permite uno a la vez. Envíelo o edítelo antes de crear uno nuevo.
          </p>
        )}
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={() => crearPE(true)}
            disabled={!!draft || !descripcion.trim()}
            className="inline-flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 px-3 py-1.5 rounded-lg border border-gray-700"
          >
            <FileText className="size-3.5" /> Guardar borrador
          </button>
          <button
            onClick={() => crearPE(false)}
            disabled={!descripcion.trim()}
            className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-4 py-1.5 rounded-lg text-white font-medium"
          >
            <Send className="size-3.5" /> Enviar
          </button>
        </div>
      </SectionCard>

      {/* Historial OS/PE */}
      <SectionCard title="Historial de OS/PE" subtitle="Trazabilidad completa del hilo de comunicación">
        {comunicacionesVisibles.length === 0 ? (
          <EmptyState text="Sin comunicaciones registradas." />
        ) : (
          <ul className="space-y-2.5">
            {comunicacionesVisibles.map(c => (
              <li key={c.id} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">{c.tipo === 'orden_servicio' ? 'Orden de Servicio' : 'Pedido de Empresa'}</span>
                      <span className="text-[10px] text-gray-600">{ordenesTrabajo.find(o => o.id === c.otId)?.codigo}</span>
                      {c.hiloRespuestaDeId && <span className="text-[10px] text-gray-600">↳ respuesta</span>}
                    </div>
                    <p className="text-xs text-gray-200 font-medium mt-1">{c.motivo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.descripcion}</p>
                    <p className="text-[11px] text-gray-600 mt-1">{c.autor} · {fmtFecha(c.fecha)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <OspeEstadoBadge estado={c.estado} />
                    {c.estado === 'borrador' && (
                      <button onClick={() => enviarBorrador(c.id)} className="text-[11px] text-blue-400 hover:text-blue-300">Enviar</button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Bajas y desafectación */}
      <SectionCard title="Bajas y Desafectación" subtitle="El SRC no permite fecha anterior a la actual; el portal SRC-Digitalización bloquea la carga de evidencia hasta desafectar">
        {recursosActivos.length === 0 ? (
          <EmptyState text="No hay recursos activos para desafectar." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recursosActivos.map(r => (
              <div key={r.id} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3 space-y-2">
                <p className="text-xs text-gray-200 font-medium">{r.nombre}</p>
                <p className="text-[11px] text-gray-500">{empresaPorId[r.empresaId]?.razonSocial}</p>
                <div className="flex items-center gap-2">
                  <select
                    value={bajaMotivo[r.id] ?? 'renuncia'}
                    onChange={e => setBajaMotivo(prev => ({ ...prev, [r.id]: e.target.value as MotivoBaja }))}
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-[11px] text-gray-200"
                  >
                    {Object.entries(MOTIVO_BAJA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button
                    onClick={() => confirmarBaja(r.id)}
                    className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 whitespace-nowrap"
                  >
                    <UserMinus className="size-3.5" /> Desafectar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {recursosDados.length > 0 && (
        <SectionCard title="Recursos dados de baja" subtitle="Evidencia requerida por motivo (SRC-Digitalización) y revocación de accesos">
          <div className="space-y-3">
            {recursosDados.map(r => (
              <div key={r.id} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs text-gray-200 font-medium">{r.nombre} <span className="text-gray-500 font-normal">— {empresaPorId[r.empresaId]?.razonSocial}</span></p>
                    <p className="text-[11px] text-amber-400 mt-0.5">{r.bajaMotivo && MOTIVO_BAJA_LABEL[r.bajaMotivo]} · {r.bajaFecha && fmtFecha(r.bajaFecha)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!r.bajaTarjetaInvalidada ? (
                      <button onClick={() => invalidarTarjeta(r.id)} className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">
                        <CreditCard className="size-3.5" /> Invalidar tarjeta (GIP)
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400"><CheckSquare className="size-3.5" /> Tarjeta invalidada</span>
                    )}
                    <button onClick={() => reactivarRecurso(r.id)} className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-200">
                      <RotateCcw className="size-3.5" /> Reactivar ficha
                    </button>
                  </div>
                </div>
                {r.bajaMotivo && (
                  <ul className="mt-2 pl-4 list-disc text-[11px] text-gray-500 space-y-0.5">
                    {MOTIVO_BAJA_EVIDENCIA[r.bajaMotivo].map((ev, i) => <li key={i}>{ev}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
