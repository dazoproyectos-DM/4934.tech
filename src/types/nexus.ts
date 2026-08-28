// ---------------------------------------------------------------------------
// NEXUS EMPRESARIAL — Modelo de datos
// Gestor inteligente de Órdenes de Trabajo (OT) y subcontratos sobre el
// Sistema de Recursos Contratados (SRC) de YPF.
// ---------------------------------------------------------------------------

export type TipoContrato = 'auditable' | 'control_especial' | 'subcontrato';

export type TipoRecurso =
  | 'personal_dependencia'
  | 'personal_independiente'
  | 'vehiculo'
  | 'equipo';

/** Estados del flujo de afectación, replicando el SRC (Dashboard "Nexus"). */
export type EstadoAval = 'nuevo' | 'pendiente_inspector' | 'aprobada' | 'avalado' | 'rechazado';

/** Motivo de desafectación / baja de un recurso. */
export type MotivoBaja =
  | 'renuncia'
  | 'despido'
  | 'fallecimiento'
  | 'vencimiento_contrato'
  | 'reasignacion_ypf'
  | 'conflictiva'
  | 'independiente_fin_tarea';

export type EstadoDocumento = 'pendiente' | 'cargado' | 'validado' | 'vencido' | 'rechazado';

export type SitioAcceso = 'CILP' | 'Y-TEC' | 'Otro';

export interface Empresa {
  id: string;
  razonSocial: string;
  cuit: string;
  esSubcontratista: boolean;
  contratistaPrincipalId?: string;
  color: string;
}

export interface OrdenDeTrabajo {
  id: string;
  codigo: string;
  descripcion: string;
  empresaId: string;
  tipoContrato: TipoContrato;
  inspectorYpf: string;
  areaContractual: string;
  fechaInicio: string;
  fechaVencimiento: string;
  comunicacionSubcontratoAprobada?: boolean;
}

/** Requisito documental exigido según tipo de recurso / tipo de contrato. */
export interface Requisito {
  id: string;
  label: string;
  aplicaTipoRecurso: TipoRecurso[];
  aplicaTipoContrato: TipoContrato[];
  vence: boolean;
  referencia: string;
}

export interface DocumentoRecurso {
  requisitoId: string;
  estado: EstadoDocumento;
  fechaCarga?: string;
  fechaVencimiento?: string;
  cargaPrevia?: boolean;
}

export interface CursoSeguridad {
  sitio: 'CILP' | 'Y-TEC';
  entidad: 'UTN' | 'Seguridad Y-TEC';
  fechaRendido?: string;
  fechaVencimiento?: string;
  resultado?: 'aprobado' | 'pendiente' | 'desaprobado';
}

export interface CredencialMagnetica {
  sitio: SitioAcceso;
  solicitadaEl?: string;
  estado: 'no_solicitada' | 'solicitada_gip' | 'entregada' | 'invalidada';
}

export interface HabilitacionVehicular {
  formulario11?: 'pendiente' | 'presentado' | 'aprobado';
  formulario12?: 'pendiente' | 'emitida' | 'entregada';
  comisionGestionVehicular?: string;
}

export interface Recurso {
  id: string;
  tipo: TipoRecurso;
  nombre: string;
  identificador: string; // CUIL / dominio / nro. serie
  empresaId: string;
  otId: string;
  estadoAval: EstadoAval;
  fechaAfectacion: string;
  fechaAvalado?: string;
  documentos: DocumentoRecurso[];
  cursos?: CursoSeguridad[];
  credenciales?: CredencialMagnetica[];
  habilitacionVehicular?: HabilitacionVehicular;
  activo: boolean;
  bajaMotivo?: MotivoBaja;
  bajaFecha?: string;
  bajaTarjetaInvalidada?: boolean;
}

export type OSPETipo = 'orden_servicio' | 'pedido_empresa';
export type OSPEEstado = 'borrador' | 'enviada' | 'respondida' | 'cerrada';

export interface ComunicacionOSPE {
  id: string;
  tipo: OSPETipo;
  otId: string;
  empresaId: string;
  motivo: string;
  descripcion: string;
  estado: OSPEEstado;
  autor: string;
  fecha: string;
  hiloRespuestaDeId?: string;
}

export interface ComunicacionSubcontratacion {
  id: string;
  subcontratistaEmpresaId: string;
  contratistaPrincipalId: string;
  otId: string;
  estado: 'pendiente_aprobacion' | 'aprobada' | 'rechazada';
  fechaSolicitud: string;
  fechaResolucion?: string;
}

/** Aplicación mensual de recursos (declaración de días/horas + GIA). */
export interface AplicacionMensual {
  id: string;
  empresaId: string;
  periodo: string; // YYYY-MM
  diasHorasDeclarados: boolean;
  fechaLimiteDeclaracion: string;
  planillaGiaCargada: boolean;
  kmRecorridos?: number;
  indiceConductaManejo?: number;
  horasFormacionMass?: number;
  bloqueado: boolean;
}

export type EventoAuditoriaTipo =
  | 'alta'
  | 'baja'
  | 'cambio_estado'
  | 'documento_cargado'
  | 'documento_vencido'
  | 'comunicacion_enviada'
  | 'modificacion_registro';

export interface EventoAuditoria {
  id: string;
  tipo: EventoAuditoriaTipo;
  recursoId?: string;
  empresaId: string;
  fecha: string;
  detalle: string;
  notificadoEstudioAuditor?: boolean;
}

export interface ReporteSemanal {
  id: string;
  generadoEl: string;
  semanaDesde: string;
  semanaHasta: string;
  empresaId: string | 'todas';
  totalRecursos: number;
  avalados: number;
  pendientes: number;
  rechazados: number;
  vencimientosProximos: number;
  documentosFaltantes: number;
  cumplimientoPct: number;
  eventos: number;
}

export const SEMAFORO = ['verde', 'amarillo', 'rojo'] as const;
export type Semaforo = (typeof SEMAFORO)[number];
