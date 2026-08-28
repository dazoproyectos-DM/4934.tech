'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronRight, FileUp, Zap } from 'lucide-react';
import { useNexus, useRecursosFiltrados } from '@/hooks/useNexusStore';
import { checklistRecurso, fmtFecha } from '@/lib/nexus/engine';
import {
  TIPO_CONTRATO_LABEL,
  TIPO_CONTRATO_DESC,
  TIPO_RECURSO_LABEL,
} from '@/lib/nexus/constants';
import { EstadoAvalBadge, EstadoDocumentoBadge, SectionCard, EmptyState } from '@/components/nexus/ui';
import type { EstadoDocumento, TipoContrato, TipoRecurso } from '@/types/nexus';

const TIPO_CONTRATO_TAGS: Record<TipoContrato, string> = {
  auditable: 'bg-blue-500/10 text-blue-300 ring-blue-500/30',
  control_especial: 'bg-purple-500/10 text-purple-300 ring-purple-500/30',
  subcontrato: 'bg-orange-500/10 text-orange-300 ring-orange-500/30',
};

export default function RecursosPage() {
  const { ordenesTrabajo, empresaPorId, tipoContratoPorOt, actualizarDocumento, agregarEvento } = useNexus();
  const recursos = useRecursosFiltrados();

  const [busqueda, setBusqueda] = useState('');
  const [filtroTipoContrato, setFiltroTipoContrato] = useState<TipoContrato | 'todos'>('todos');
  const [filtroTipoRecurso, setFiltroTipoRecurso] = useState<TipoRecurso | 'todos'>('todos');
  const [soloActivos, setSoloActivos] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    return recursos.filter(r => {
      if (soloActivos && !r.activo) return false;
      if (filtroTipoRecurso !== 'todos' && r.tipo !== filtroTipoRecurso) return false;
      const tipoContrato = tipoContratoPorOt[r.otId];
      if (filtroTipoContrato !== 'todos' && tipoContrato !== filtroTipoContrato) return false;
      if (busqueda && !r.nombre.toLowerCase().includes(busqueda.toLowerCase()) && !r.identificador.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [recursos, soloActivos, filtroTipoRecurso, filtroTipoContrato, busqueda, tipoContratoPorOt]);

  const marcarDocumento = (recursoId: string, requisitoId: string, estado: EstadoDocumento, cargaPrevia?: boolean) => {
    actualizarDocumento(recursoId, requisitoId, {
      estado,
      fechaCarga: estado === 'pendiente' ? undefined : new Date().toISOString(),
      cargaPrevia,
    });
    agregarEvento({
      id: `ev-${Date.now()}`,
      tipo: 'documento_cargado',
      recursoId,
      empresaId: recursos.find(r => r.id === recursoId)?.empresaId ?? '',
      fecha: new Date().toISOString(),
      detalle: `Documento actualizado a "${estado}"${cargaPrevia ? ' (Carga Previa, antes del aval de afectación)' : ''}.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-blue-400">Recursos & Órdenes de Trabajo</h1>
        <p className="text-sm text-gray-400 mt-1">
          Módulo de Configuración por OT y Tipo de Contrato + Motor de Requisitos y Documentación (Fase de Alta).
        </p>
      </div>

      {/* Tipos de contrato */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.keys(TIPO_CONTRATO_LABEL) as TipoContrato[]).map(tipo => (
          <div key={tipo} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset mb-2 ${TIPO_CONTRATO_TAGS[tipo]}`}>
              {TIPO_CONTRATO_LABEL[tipo]}
            </span>
            <p className="text-xs text-gray-500 leading-relaxed">{TIPO_CONTRATO_DESC[tipo]}</p>
          </div>
        ))}
      </div>

      {/* Órdenes de trabajo */}
      <SectionCard title="Órdenes de Trabajo activas" subtitle="Clasificación que determina el nivel de aval requerido">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-800">
                <th className="py-2 pr-3 font-medium">OT</th>
                <th className="py-2 pr-3 font-medium">Empresa</th>
                <th className="py-2 pr-3 font-medium">Tipo</th>
                <th className="py-2 pr-3 font-medium">Inspector YPF</th>
                <th className="py-2 pr-3 font-medium">Vence</th>
                <th className="py-2 pr-3 font-medium">Subcontrato</th>
              </tr>
            </thead>
            <tbody>
              {ordenesTrabajo.map(ot => (
                <tr key={ot.id} className="border-b border-gray-900 hover:bg-gray-900/40">
                  <td className="py-2 pr-3">
                    <p className="text-gray-200 font-medium">{ot.codigo}</p>
                    <p className="text-gray-600">{ot.descripcion}</p>
                  </td>
                  <td className="py-2 pr-3 text-gray-300">{empresaPorId[ot.empresaId]?.razonSocial}</td>
                  <td className="py-2 pr-3">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${TIPO_CONTRATO_TAGS[ot.tipoContrato]}`}>
                      {TIPO_CONTRATO_LABEL[ot.tipoContrato]}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-gray-400">{ot.inspectorYpf}</td>
                  <td className="py-2 pr-3 text-gray-400">{fmtFecha(ot.fechaVencimiento)}</td>
                  <td className="py-2 pr-3 text-gray-400">
                    {ot.tipoContrato === 'subcontrato'
                      ? ot.comunicacionSubcontratoAprobada ? <span className="text-emerald-400">Aprobado</span> : <span className="text-amber-400">Pendiente Inspector</span>
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 flex-1 min-w-[200px]">
          <Search className="size-3.5 text-gray-500" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o identificador…"
            className="bg-transparent text-xs text-gray-200 focus:outline-none flex-1"
          />
        </div>
        <select
          value={filtroTipoRecurso}
          onChange={e => setFiltroTipoRecurso(e.target.value as TipoRecurso | 'todos')}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300"
        >
          <option value="todos">Todos los tipos de recurso</option>
          {(Object.keys(TIPO_RECURSO_LABEL) as TipoRecurso[]).map(t => (
            <option key={t} value={t}>{TIPO_RECURSO_LABEL[t]}</option>
          ))}
        </select>
        <select
          value={filtroTipoContrato}
          onChange={e => setFiltroTipoContrato(e.target.value as TipoContrato | 'todos')}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300"
        >
          <option value="todos">Todos los contratos</option>
          {(Object.keys(TIPO_CONTRATO_LABEL) as TipoContrato[]).map(t => (
            <option key={t} value={t}>{TIPO_CONTRATO_LABEL[t]}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-gray-400">
          <input type="checkbox" checked={soloActivos} onChange={e => setSoloActivos(e.target.checked)} className="accent-blue-500" />
          Solo activos
        </label>
      </div>

      {/* Listado de recursos con checklist */}
      <SectionCard title={`Recursos (${filtrados.length})`} subtitle="Expandí un recurso para ver su checklist documental">
        {filtrados.length === 0 ? (
          <EmptyState text="No hay recursos que coincidan con los filtros." />
        ) : (
          <div className="divide-y divide-gray-800">
            {filtrados.map(r => {
              const ot = ordenesTrabajo.find(o => o.id === r.otId)!;
              const checklist = checklistRecurso(r, ot.tipoContrato);
              const completos = checklist.filter(c => c.documento?.estado === 'validado').length;
              const isOpen = expandido === r.id;
              return (
                <div key={r.id}>
                  <button
                    onClick={() => setExpandido(isOpen ? null : r.id)}
                    className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-gray-900/30 px-1 -mx-1 rounded"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isOpen ? <ChevronDown className="size-3.5 text-gray-500 shrink-0" /> : <ChevronRight className="size-3.5 text-gray-500 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm text-gray-200 truncate">{r.nombre}</p>
                        <p className="text-[11px] text-gray-500">{TIPO_RECURSO_LABEL[r.tipo]} · {r.identificador} · {empresaPorId[r.empresaId]?.razonSocial}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {!r.activo && <span className="text-[10px] text-gray-500 uppercase">Inactivo</span>}
                      <span className="text-[11px] text-gray-500 hidden sm:inline">{completos}/{checklist.length} docs</span>
                      <EstadoAvalBadge estado={r.estadoAval} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="pb-4 pl-6">
                      <div className="rounded-lg border border-gray-800 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-900/60 text-gray-500 text-left">
                              <th className="py-2 px-3 font-medium">Requisito</th>
                              <th className="py-2 px-3 font-medium">Referencia</th>
                              <th className="py-2 px-3 font-medium">Vence</th>
                              <th className="py-2 px-3 font-medium">Estado</th>
                              <th className="py-2 px-3 font-medium text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {checklist.map(({ requisito, documento }) => (
                              <tr key={requisito.id} className="border-t border-gray-900">
                                <td className="py-2 px-3 text-gray-300">{requisito.label}</td>
                                <td className="py-2 px-3 text-gray-600">{requisito.referencia}</td>
                                <td className="py-2 px-3 text-gray-500">{documento?.fechaVencimiento ? fmtFecha(documento.fechaVencimiento) : '—'}</td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <EstadoDocumentoBadge estado={documento?.estado ?? 'pendiente'} />
                                    {documento?.cargaPrevia && (
                                      <span title="Carga Previa: subido antes del aval de afectación" className="text-amber-400">
                                        <Zap className="size-3" />
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {(!documento || documento.estado === 'pendiente') && (
                                    <button
                                      onClick={() => marcarDocumento(r.id, requisito.id, 'cargado', r.estadoAval !== 'aprobada' && r.estadoAval !== 'avalado')}
                                      className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                                    >
                                      <FileUp className="size-3" /> Cargar
                                    </button>
                                  )}
                                  {documento?.estado === 'cargado' && (
                                    <button
                                      onClick={() => marcarDocumento(r.id, requisito.id, 'validado')}
                                      className="text-[11px] text-emerald-400 hover:text-emerald-300"
                                    >
                                      Validar
                                    </button>
                                  )}
                                  {(documento?.estado === 'vencido' || documento?.estado === 'rechazado') && (
                                    <button
                                      onClick={() => marcarDocumento(r.id, requisito.id, 'cargado')}
                                      className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                                    >
                                      <FileUp className="size-3" /> Recargar
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
