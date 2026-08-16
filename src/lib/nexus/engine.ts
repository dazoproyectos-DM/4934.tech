import type {
  AplicacionMensual,
  ComunicacionOSPE,
  EventoAuditoria,
  Recurso,
  ReporteSemanal,
  Semaforo,
} from '@/types/nexus';
import { PLAZO_ALERTA_VENCIMIENTO_DIAS, requisitosPara } from './constants';

export function diasHasta(fechaISO: string, desde = new Date()): number {
  const target = new Date(fechaISO);
  const ms = target.getTime() - desde.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function fmtFecha(fechaISO: string): string {
  const d = new Date(fechaISO);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Documentos exigidos vs. cargados/validados para un recurso, según su OT. */
export function checklistRecurso(recurso: Recurso, tipoContrato: Parameters<typeof requisitosPara>[1]) {
  const requeridos = requisitosPara(recurso.tipo, tipoContrato);
  return requeridos.map(req => {
    const doc = recurso.documentos.find(d => d.requisitoId === req.id);
    return { requisito: req, documento: doc };
  });
}

export function documentosFaltantesOVencidos(recurso: Recurso, tipoContrato: Parameters<typeof requisitosPara>[1]): number {
  const rows = checklistRecurso(recurso, tipoContrato);
  return rows.filter(({ documento }) => !documento || documento.estado === 'pendiente' || documento.estado === 'vencido' || documento.estado === 'rechazado').length;
}

/**
 * Semáforo de cumplimiento (Sector de Control):
 *  - rojo: documentación faltante/vencida, o rechazado
 *  - amarillo: pendiente de inspector, o vencimiento próximo (<45 días)
 *  - verde: avalado, vigente y sin faltantes
 */
export function semaforoRecurso(recurso: Recurso, tipoContrato: Parameters<typeof requisitosPara>[1]): Semaforo {
  if (!recurso.activo) return 'amarillo';
  if (recurso.estadoAval === 'rechazado') return 'rojo';

  const faltantes = documentosFaltantesOVencidos(recurso, tipoContrato);
  if (faltantes > 0) return 'rojo';

  const vencimientoProximo = recurso.documentos.some(d => {
    if (!d.fechaVencimiento) return false;
    const dias = diasHasta(d.fechaVencimiento);
    return dias <= PLAZO_ALERTA_VENCIMIENTO_DIAS;
  });

  if (recurso.estadoAval !== 'avalado' || vencimientoProximo) return 'amarillo';
  return 'verde';
}

export interface AlertaVencimiento {
  recursoId: string;
  recursoNombre: string;
  empresaId: string;
  requisitoLabel: string;
  fechaVencimiento: string;
  diasRestantes: number;
}

export function alertasVencimiento(recursos: Recurso[], requisitoLabelById: Record<string, string>): AlertaVencimiento[] {
  const alertas: AlertaVencimiento[] = [];
  for (const r of recursos) {
    if (!r.activo) continue;
    for (const doc of r.documentos) {
      if (!doc.fechaVencimiento) continue;
      const dias = diasHasta(doc.fechaVencimiento);
      if (dias <= PLAZO_ALERTA_VENCIMIENTO_DIAS) {
        alertas.push({
          recursoId: r.id,
          recursoNombre: r.nombre,
          empresaId: r.empresaId,
          requisitoLabel: requisitoLabelById[doc.requisitoId] ?? doc.requisitoId,
          fechaVencimiento: doc.fechaVencimiento,
          diasRestantes: dias,
        });
      }
    }
  }
  return alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);
}

export function aplicacionMensualPendiente(aplicaciones: AplicacionMensual[], periodo: string): AplicacionMensual[] {
  return aplicaciones.filter(a => a.periodo === periodo && (!a.diasHorasDeclarados || !a.planillaGiaCargada));
}

/** Genera el Reporte Semanal del sector de Auditoría. */
export function generarReporteSemanal(
  recursos: Recurso[],
  eventos: EventoAuditoria[],
  tipoContratoPorOt: Record<string, Parameters<typeof requisitosPara>[1]>,
  empresaId: string | 'todas',
  semanaDesde: Date,
  semanaHasta: Date
): ReporteSemanal {
  const filtrados = empresaId === 'todas' ? recursos : recursos.filter(r => r.empresaId === empresaId);

  const avalados = filtrados.filter(r => r.estadoAval === 'avalado').length;
  const pendientes = filtrados.filter(r => r.estadoAval === 'nuevo' || r.estadoAval === 'pendiente_inspector' || r.estadoAval === 'aprobada').length;
  const rechazados = filtrados.filter(r => r.estadoAval === 'rechazado').length;

  let vencimientosProximos = 0;
  let documentosFaltantes = 0;
  for (const r of filtrados) {
    const tipoContrato = tipoContratoPorOt[r.otId] ?? 'auditable';
    documentosFaltantes += documentosFaltantesOVencidos(r, tipoContrato);
    vencimientosProximos += r.documentos.filter(d => d.fechaVencimiento && diasHasta(d.fechaVencimiento) <= PLAZO_ALERTA_VENCIMIENTO_DIAS).length;
  }

  const cumplimientoPct = filtrados.length === 0 ? 100 : Math.round((avalados / filtrados.length) * 100);

  const eventosSemana = eventos.filter(e => {
    if (empresaId !== 'todas' && e.empresaId !== empresaId) return false;
    const f = new Date(e.fecha);
    return f >= semanaDesde && f <= semanaHasta;
  });

  return {
    id: `RS-${Date.now()}`,
    generadoEl: new Date().toISOString(),
    semanaDesde: semanaDesde.toISOString(),
    semanaHasta: semanaHasta.toISOString(),
    empresaId,
    totalRecursos: filtrados.length,
    avalados,
    pendientes,
    rechazados,
    vencimientosProximos,
    documentosFaltantes,
    cumplimientoPct,
    eventos: eventosSemana.length,
  };
}

export function borradorExistente(comunicaciones: ComunicacionOSPE[], otId: string): ComunicacionOSPE | undefined {
  return comunicaciones.find(c => c.otId === otId && c.estado === 'borrador');
}

export function inicioSemanaActual(ref = new Date()): { desde: Date; hasta: Date } {
  const d = new Date(ref);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  const desde = new Date(d);
  desde.setDate(d.getDate() - diffToMonday);
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(desde);
  hasta.setDate(desde.getDate() + 6);
  hasta.setHours(23, 59, 59, 999);
  return { desde, hasta };
}
