import type { EstadoAval, EstadoDocumento, MotivoBaja, OSPEEstado, Requisito, TipoContrato, TipoRecurso } from '@/types/nexus';

export const TIPO_CONTRATO_LABEL: Record<TipoContrato, string> = {
  auditable: 'Contrato Auditable',
  control_especial: 'Control Especial',
  subcontrato: 'Subcontrato',
};

export const TIPO_CONTRATO_DESC: Record<TipoContrato, string> = {
  auditable: 'Dedicación mayoritaria o ingreso a planta. Control total: Laboral, Previsional y de Seguridad.',
  control_especial: 'Tareas de hasta 5 días. Documentación mínima (DNI, Seguros y Cursos), controlada por el Inspector.',
  subcontrato: 'Requiere Comunicación de Subcontratación aprobada por el Inspector YPF antes de afectar personal.',
};

export const TIPO_RECURSO_LABEL: Record<TipoRecurso, string> = {
  personal_dependencia: 'Personal en Relación de Dependencia',
  personal_independiente: 'Personal Independiente',
  vehiculo: 'Vehículo',
  equipo: 'Equipo',
};

export const ESTADO_AVAL_LABEL: Record<EstadoAval, string> = {
  nuevo: 'Nuevo',
  pendiente_inspector: 'Pendiente de Inspector',
  aprobada: 'Aprobada',
  avalado: 'Avalado',
  rechazado: 'Rechazado',
};

export const ESTADO_AVAL_ORDER: EstadoAval[] = ['nuevo', 'pendiente_inspector', 'aprobada', 'avalado'];

export const ESTADO_DOCUMENTO_LABEL: Record<EstadoDocumento, string> = {
  pendiente: 'Pendiente',
  cargado: 'Cargado',
  validado: 'Validado',
  vencido: 'Vencido',
  rechazado: 'Rechazado',
};

export const MOTIVO_BAJA_LABEL: Record<MotivoBaja, string> = {
  renuncia: 'Renuncia',
  despido: 'Despido',
  fallecimiento: 'Fallecimiento',
  vencimiento_contrato: 'Vencimiento de Contrato',
  reasignacion_ypf: 'Reasignación dentro de YPF',
  conflictiva: 'Terminación Conflictiva',
  independiente_fin_tarea: 'Fin de Tarea (Independiente)',
};

/** Evidencia documental requerida por motivo de baja (SRC-Digitalización). */
export const MOTIVO_BAJA_EVIDENCIA: Record<MotivoBaja, string[]> = {
  renuncia: [
    'Telegrama o carta certificada con comprobante de envío',
    'Recibo de liquidación final firmado',
    'Comprobante de transferencia bancaria',
    'Formulario de terminación ARCA firmado por el empleado',
  ],
  despido: [
    'Telegrama o carta certificada con comprobante de envío',
    'Recibo de liquidación final firmado',
    'Comprobante de transferencia bancaria',
    'Formulario de terminación ARCA firmado por el empleado',
  ],
  fallecimiento: [
    'Certificado de defunción',
    'Liquidación final a derechohabientes',
  ],
  vencimiento_contrato: [
    'Registro de vencimiento en SRC (automático)',
  ],
  reasignacion_ypf: [
    'Declaración jurada específica (Formulario 3)',
    'Historial de ARCA',
    'Impresión de la nueva asignación en SRC',
  ],
  conflictiva: [
    'Carta certificada notificando disponibilidad de certificados de trabajo',
    'Prueba de consignación judicial (si aplica)',
  ],
  independiente_fin_tarea: [
    'Declaración jurada firmada por contratista y trabajador certificando inexistencia de deuda',
  ],
};

export const OSPE_ESTADO_LABEL: Record<OSPEEstado, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  respondida: 'Respondida',
  cerrada: 'Cerrada',
};

export const OSPE_MOTIVOS = [
  'Solicitud de afectación de personal',
  'Consulta de documentación',
  'Reclamo de habilitación de acceso',
  'Notificación de subcontratación',
  'Respuesta a observación del Inspector',
  'Comunicación de baja / desvinculación',
  'Otro',
];

export const PLAZO_ALERTA_VENCIMIENTO_DIAS = 45;
export const PLAZO_AVAL_ALTA_HORAS = 48;
export const PLAZO_AVAL_BAJA_HORAS = 72;
export const VIGENCIA_CURSO_SEGURIDAD_ANIOS = 2;

/**
 * Matriz de requisitos documentales: qué exige la app según el tipo de
 * recurso y el tipo de contrato de la OT, basada en el Motor de Requisitos
 * y Documentación (Fase de Alta) del sistema SRC.
 */
export const REQUISITOS: Requisito[] = [
  {
    id: 'alta-temprana-arca',
    label: 'Alta Temprana ARCA (ex AFIP) — antes del 1er día',
    aplicaTipoRecurso: ['personal_dependencia'],
    aplicaTipoContrato: ['auditable', 'subcontrato'],
    vence: false,
    referencia: 'Sistema Mi Simplificación II',
  },
  {
    id: 'poliza-art',
    label: 'Póliza ART (cláusula de no repetición)',
    aplicaTipoRecurso: ['personal_dependencia'],
    aplicaTipoContrato: ['auditable', 'subcontrato'],
    vence: true,
    referencia: 'Seguros — nómina actualizada',
  },
  {
    id: 'seguro-vida-obligatorio',
    label: 'Seguro de Vida Obligatorio (SVO)',
    aplicaTipoRecurso: ['personal_dependencia'],
    aplicaTipoContrato: ['auditable', 'subcontrato'],
    vence: true,
    referencia: 'Nómina actualizada',
  },
  {
    id: 'ddjj-epap',
    label: 'Formulario 7 — DDJJ sobre EPAP (Salud Ocupacional)',
    aplicaTipoRecurso: ['personal_dependencia'],
    aplicaTipoContrato: ['auditable', 'subcontrato'],
    vence: true,
    referencia: 'Aval de Salud Ocupacional',
  },
  {
    id: 'apto-medico',
    label: 'Apto Médico',
    aplicaTipoRecurso: ['personal_dependencia', 'personal_independiente'],
    aplicaTipoContrato: ['auditable', 'subcontrato'],
    vence: true,
    referencia: 'Salud Ocupacional',
  },
  {
    id: 'ddjj-independiente',
    label: 'Formulario 1 — DDJJ Trabajadores Independientes',
    aplicaTipoRecurso: ['personal_independiente'],
    aplicaTipoContrato: ['auditable', 'control_especial', 'subcontrato'],
    vence: false,
    referencia: 'Personal Independiente',
  },
  {
    id: 'constancia-arca-independiente',
    label: 'Constancia de ARCA',
    aplicaTipoRecurso: ['personal_independiente'],
    aplicaTipoContrato: ['auditable', 'control_especial', 'subcontrato'],
    vence: false,
    referencia: 'Personal Independiente',
  },
  {
    id: 'seguro-accidentes-personales',
    label: 'Seguro de Accidentes Personales',
    aplicaTipoRecurso: ['personal_independiente'],
    aplicaTipoContrato: ['auditable', 'control_especial', 'subcontrato'],
    vence: true,
    referencia: 'Personal Independiente',
  },
  {
    id: 'dni',
    label: 'DNI vigente',
    aplicaTipoRecurso: ['personal_dependencia', 'personal_independiente'],
    aplicaTipoContrato: ['control_especial'],
    vence: false,
    referencia: 'Documentación mínima — Control Especial',
  },
  {
    id: 'titulo-vehiculo',
    label: 'Título del vehículo',
    aplicaTipoRecurso: ['vehiculo'],
    aplicaTipoContrato: ['auditable', 'control_especial', 'subcontrato'],
    vence: false,
    referencia: 'Vehículos y Equipos',
  },
  {
    id: 'cedula-verde-azul',
    label: 'Cédula Verde / Azul',
    aplicaTipoRecurso: ['vehiculo'],
    aplicaTipoContrato: ['auditable', 'control_especial', 'subcontrato'],
    vence: false,
    referencia: 'Vehículos y Equipos',
  },
  {
    id: 'vtv-rto',
    label: 'Revisión Técnica (VTV/RTO) — taller habilitado CENT',
    aplicaTipoRecurso: ['vehiculo', 'equipo'],
    aplicaTipoContrato: ['auditable', 'control_especial', 'subcontrato'],
    vence: true,
    referencia: 'Habilitación CENT',
  },
  {
    id: 'seguro-vehicular',
    label: 'Póliza de Seguro Vehicular',
    aplicaTipoRecurso: ['vehiculo'],
    aplicaTipoContrato: ['auditable', 'control_especial', 'subcontrato'],
    vence: true,
    referencia: 'Ficha de Unidad',
  },
];

export function requisitosPara(tipoRecurso: TipoRecurso, tipoContrato: TipoContrato): Requisito[] {
  return REQUISITOS.filter(
    r => r.aplicaTipoRecurso.includes(tipoRecurso) && r.aplicaTipoContrato.includes(tipoContrato)
  );
}
