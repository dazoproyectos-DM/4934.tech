'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  AplicacionMensual,
  ComunicacionOSPE,
  ComunicacionSubcontratacion,
  DocumentoRecurso,
  Empresa,
  EstadoAval,
  EstadoDocumento,
  EventoAuditoria,
  MotivoBaja,
  OrdenDeTrabajo,
  Recurso,
  ReporteSemanal,
} from '@/types/nexus';
import { NEXUS_SEED } from '@/lib/nexus/mock-data';
import { REQUISITOS } from '@/lib/nexus/constants';

const STORAGE_KEY = 'nexus-empresarial-store-v1';

interface NexusState {
  empresas: Empresa[];
  ordenesTrabajo: OrdenDeTrabajo[];
  comunicacionesSubcontratacion: ComunicacionSubcontratacion[];
  recursos: Recurso[];
  comunicacionesOspe: ComunicacionOSPE[];
  aplicacionesMensuales: AplicacionMensual[];
  eventosAuditoria: EventoAuditoria[];
  reportesSemanales: ReporteSemanal[];
}

function loadInitialState(): NexusState {
  return { ...NEXUS_SEED, reportesSemanales: [] };
}

interface NexusContextValue extends NexusState {
  empresaSeleccionada: string | 'todas';
  setEmpresaSeleccionada: (id: string | 'todas') => void;
  tipoContratoPorOt: Record<string, OrdenDeTrabajo['tipoContrato']>;
  otPorId: Record<string, OrdenDeTrabajo>;
  empresaPorId: Record<string, Empresa>;
  requisitoLabelById: Record<string, string>;
  cambiarEstadoAval: (recursoId: string, nuevoEstado: EstadoAval) => void;
  actualizarDocumento: (recursoId: string, requisitoId: string, cambios: Partial<DocumentoRecurso>) => void;
  desafectarRecurso: (recursoId: string, motivo: MotivoBaja) => void;
  reactivarRecurso: (recursoId: string) => void;
  invalidarTarjeta: (recursoId: string) => void;
  agregarRecurso: (recurso: Recurso) => void;
  agregarComunicacionOspe: (com: ComunicacionOSPE) => void;
  actualizarComunicacionOspe: (id: string, cambios: Partial<ComunicacionOSPE>) => void;
  actualizarAplicacionMensual: (id: string, cambios: Partial<AplicacionMensual>) => void;
  agregarEvento: (evento: EventoAuditoria) => void;
  agregarReporteSemanal: (reporte: ReporteSemanal) => void;
  resetDemo: () => void;
}

const NexusContext = createContext<NexusContextValue | null>(null);

export function NexusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NexusState>(loadInitialState);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string | 'todas'>('todas');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable — continue in-memory
    }
  }, [state, hydrated]);

  const otPorId = useMemo(() => Object.fromEntries(state.ordenesTrabajo.map(o => [o.id, o])), [state.ordenesTrabajo]);
  const empresaPorId = useMemo(() => Object.fromEntries(state.empresas.map(e => [e.id, e])), [state.empresas]);
  const tipoContratoPorOt = useMemo(
    () => Object.fromEntries(state.ordenesTrabajo.map(o => [o.id, o.tipoContrato])),
    [state.ordenesTrabajo]
  );
  const requisitoLabelById = useMemo(
    () => Object.fromEntries(REQUISITOS.map(r => [r.id, r.label])),
    []
  );

  const cambiarEstadoAval = useCallback((recursoId: string, nuevoEstado: EstadoAval) => {
    setState(prev => ({
      ...prev,
      recursos: prev.recursos.map(r =>
        r.id === recursoId
          ? { ...r, estadoAval: nuevoEstado, fechaAvalado: nuevoEstado === 'avalado' ? new Date().toISOString() : r.fechaAvalado }
          : r
      ),
    }));
  }, []);

  const actualizarDocumento = useCallback((recursoId: string, requisitoId: string, cambios: Partial<DocumentoRecurso>) => {
    setState(prev => ({
      ...prev,
      recursos: prev.recursos.map(r => {
        if (r.id !== recursoId) return r;
        const existe = r.documentos.some(d => d.requisitoId === requisitoId);
        const documentos = existe
          ? r.documentos.map(d => (d.requisitoId === requisitoId ? { ...d, ...cambios } : d))
          : [...r.documentos, { requisitoId, estado: 'pendiente' as EstadoDocumento, ...cambios }];
        return { ...r, documentos };
      }),
    }));
  }, []);

  const desafectarRecurso = useCallback((recursoId: string, motivo: MotivoBaja) => {
    setState(prev => ({
      ...prev,
      recursos: prev.recursos.map(r =>
        r.id === recursoId ? { ...r, activo: false, bajaMotivo: motivo, bajaFecha: new Date().toISOString(), bajaTarjetaInvalidada: false } : r
      ),
    }));
  }, []);

  const reactivarRecurso = useCallback((recursoId: string) => {
    setState(prev => ({
      ...prev,
      recursos: prev.recursos.map(r =>
        r.id === recursoId ? { ...r, activo: true, bajaMotivo: undefined, bajaFecha: undefined, bajaTarjetaInvalidada: undefined } : r
      ),
    }));
  }, []);

  const invalidarTarjeta = useCallback((recursoId: string) => {
    setState(prev => ({
      ...prev,
      recursos: prev.recursos.map(r => (r.id === recursoId ? { ...r, bajaTarjetaInvalidada: true } : r)),
    }));
  }, []);

  const agregarRecurso = useCallback((recurso: Recurso) => {
    setState(prev => ({ ...prev, recursos: [recurso, ...prev.recursos] }));
  }, []);

  const agregarComunicacionOspe = useCallback((com: ComunicacionOSPE) => {
    setState(prev => ({ ...prev, comunicacionesOspe: [com, ...prev.comunicacionesOspe] }));
  }, []);

  const actualizarComunicacionOspe = useCallback((id: string, cambios: Partial<ComunicacionOSPE>) => {
    setState(prev => ({
      ...prev,
      comunicacionesOspe: prev.comunicacionesOspe.map(c => (c.id === id ? { ...c, ...cambios } : c)),
    }));
  }, []);

  const actualizarAplicacionMensual = useCallback((id: string, cambios: Partial<AplicacionMensual>) => {
    setState(prev => ({
      ...prev,
      aplicacionesMensuales: prev.aplicacionesMensuales.map(a => (a.id === id ? { ...a, ...cambios } : a)),
    }));
  }, []);

  const agregarEvento = useCallback((evento: EventoAuditoria) => {
    setState(prev => ({ ...prev, eventosAuditoria: [evento, ...prev.eventosAuditoria] }));
  }, []);

  const agregarReporteSemanal = useCallback((reporte: ReporteSemanal) => {
    setState(prev => ({ ...prev, reportesSemanales: [reporte, ...prev.reportesSemanales] }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(loadInitialState());
  }, []);

  const value: NexusContextValue = {
    ...state,
    empresaSeleccionada,
    setEmpresaSeleccionada,
    tipoContratoPorOt,
    otPorId,
    empresaPorId,
    requisitoLabelById,
    cambiarEstadoAval,
    actualizarDocumento,
    desafectarRecurso,
    reactivarRecurso,
    invalidarTarjeta,
    agregarRecurso,
    agregarComunicacionOspe,
    actualizarComunicacionOspe,
    actualizarAplicacionMensual,
    agregarEvento,
    agregarReporteSemanal,
    resetDemo,
  };

  return <NexusContext.Provider value={value}>{children}</NexusContext.Provider>;
}

export function useNexus() {
  const ctx = useContext(NexusContext);
  if (!ctx) throw new Error('useNexus debe usarse dentro de <NexusProvider>');
  return ctx;
}

export function useRecursosFiltrados() {
  const { recursos, empresaSeleccionada } = useNexus();
  return useMemo(
    () => (empresaSeleccionada === 'todas' ? recursos : recursos.filter(r => r.empresaId === empresaSeleccionada)),
    [recursos, empresaSeleccionada]
  );
}
