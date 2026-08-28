'use client';

import Link from 'next/link';
import {
  Users, ClipboardCheck, KeyRound, CalendarClock, MessagesSquare, ShieldCheck,
  ArrowRight, AlertTriangle, Activity, FileStack,
} from 'lucide-react';
import { useNexus, useRecursosFiltrados } from '@/hooks/useNexusStore';
import { alertasVencimiento, fmtFecha } from '@/lib/nexus/engine';
import { ESTADO_AVAL_LABEL, ESTADO_AVAL_ORDER } from '@/lib/nexus/constants';
import { StatCard, SectionCard, OspeEstadoBadge, EmptyState, ProgressBar } from '@/components/nexus/ui';

const PROCESOS = [
  {
    href: '/nexus/recursos',
    icon: Users,
    titulo: '1–2. Configuración OT & Documentación',
    detalle: 'Clasifica cada OT (Auditable, Control Especial, Subcontrato) y arma el checklist documental por recurso.',
  },
  {
    href: '/nexus/aprobaciones',
    icon: ClipboardCheck,
    titulo: '3. Flujo de Aprobación',
    detalle: 'Nuevo → Pendiente de Inspector → Aprobada → Avalado, con "Carga Previa" para ganar tiempo de auditoría.',
  },
  {
    href: '/nexus/accesos',
    icon: KeyRound,
    titulo: '4. Habilitaciones y Accesos',
    detalle: 'Cursos de seguridad CILP/Y-TEC, credenciales magnéticas GIP y habilitación vehicular CILP.',
  },
  {
    href: '/nexus/vigencias',
    icon: CalendarClock,
    titulo: '5. Vigencias y Aplicación Mensual',
    detalle: 'Alertas a 45 días, bloqueo de aplicación mensual y Planilla GIA de accidentabilidad.',
  },
  {
    href: '/nexus/comunicaciones',
    icon: MessagesSquare,
    titulo: 'OS/PE & Bajas',
    detalle: 'Canal formal Inspector–Contratista y desafectación de recursos con evidencia por motivo.',
  },
  {
    href: '/nexus/control',
    icon: ShieldCheck,
    titulo: 'Control',
    detalle: 'Semáforo de cumplimiento por recurso y empresa: qué falta para llegar a "Avalado".',
  },
];

export default function NexusDashboard() {
  const { requisitoLabelById, eventosAuditoria, comunicacionesOspe, empresaSeleccionada, empresaPorId } = useNexus();
  const recursos = useRecursosFiltrados();

  const activos = recursos.filter(r => r.activo);
  const avalados = activos.filter(r => r.estadoAval === 'avalado').length;
  const rechazados = activos.filter(r => r.estadoAval === 'rechazado').length;
  const enProceso = activos.length - avalados - rechazados;
  const cumplimientoPct = activos.length === 0 ? 100 : Math.round((avalados / activos.length) * 100);

  const alertas = alertasVencimiento(recursos, requisitoLabelById).slice(0, 5);
  const eventosRecientes = (empresaSeleccionada === 'todas' ? eventosAuditoria : eventosAuditoria.filter(e => e.empresaId === empresaSeleccionada)).slice(0, 6);
  const ospePendientes = comunicacionesOspe.filter(c => (empresaSeleccionada === 'todas' || c.empresaId === empresaSeleccionada) && (c.estado === 'enviada' || c.estado === 'borrador'));

  const porEstado = ESTADO_AVAL_ORDER.map(estado => ({
    estado,
    count: activos.filter(r => r.estadoAval === estado).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-wide text-blue-400">NEXUS EMPRESARIAL</h1>
        <p className="text-sm text-gray-400 mt-1">
          Gestor inteligente de Órdenes de Trabajo (OT) y subcontratos sobre el Sistema de Recursos Contratados (SRC) de YPF.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Recursos activos" value={activos.length} icon={<Users className="size-4" />} />
        <StatCard label="Avalados" value={avalados} tone="good" icon={<ShieldCheck className="size-4" />} />
        <StatCard label="En proceso" value={enProceso} tone="warn" icon={<ClipboardCheck className="size-4" />} />
        <StatCard label="Rechazados" value={rechazados} tone={rechazados > 0 ? 'bad' : 'default'} icon={<AlertTriangle className="size-4" />} />
        <StatCard label="Cumplimiento" value={`${cumplimientoPct}%`} tone={cumplimientoPct >= 80 ? 'good' : cumplimientoPct >= 50 ? 'warn' : 'bad'} icon={<Activity className="size-4" />} />
      </div>

      {/* Procesos */}
      <SectionCard title="Procesos de la plataforma" subtitle="Estructura funcional replicada del SRC — cada tarjeta abre su módulo operativo.">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {PROCESOS.map(p => {
            const Icon = p.icon;
            return (
              <Link
                key={p.href}
                href={p.href}
                className="group flex flex-col gap-2 rounded-lg border border-gray-800 bg-gray-950/60 p-4 hover:border-blue-600/50 hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="size-9 rounded-lg bg-blue-500/10 text-blue-300 flex items-center justify-center">
                    <Icon className="size-4.5" />
                  </div>
                  <ArrowRight className="size-4 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-sm font-semibold text-gray-200">{p.titulo}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{p.detalle}</p>
              </Link>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Estado de aprobación */}
        <SectionCard title="Estado de aprobación" subtitle="Distribución del Dashboard Nexus" className="lg:col-span-1">
          <div className="space-y-3">
            {porEstado.map(({ estado, count }) => (
              <div key={estado} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">{ESTADO_AVAL_LABEL[estado]}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
                <ProgressBar pct={activos.length ? (count / activos.length) * 100 : 0} tone={estado === 'avalado' ? 'good' : estado === 'pendiente_inspector' ? 'warn' : 'default'} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Alertas de vencimiento */}
        <SectionCard
          title="Alertas de vencimiento"
          subtitle="Próximos 45 días"
          action={<Link href="/nexus/vigencias" className="text-[11px] text-blue-400 hover:underline">Ver todas</Link>}
        >
          {alertas.length === 0 ? (
            <EmptyState text="Sin vencimientos próximos." />
          ) : (
            <ul className="space-y-2.5">
              {alertas.map((a, i) => (
                <li key={i} className="flex items-start justify-between gap-2 text-xs">
                  <div>
                    <p className="text-gray-200">{a.recursoNombre}</p>
                    <p className="text-gray-500">{a.requisitoLabel}</p>
                  </div>
                  <span className={a.diasRestantes < 0 ? 'text-red-400 font-semibold whitespace-nowrap' : a.diasRestantes <= 15 ? 'text-amber-400 whitespace-nowrap' : 'text-gray-400 whitespace-nowrap'}>
                    {a.diasRestantes < 0 ? `Vencido hace ${Math.abs(a.diasRestantes)}d` : `${a.diasRestantes} días`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Actividad reciente */}
        <SectionCard
          title="Actividad reciente"
          subtitle="Eventos de auditoría"
          action={<Link href="/nexus/auditoria" className="text-[11px] text-blue-400 hover:underline">Ver auditoría</Link>}
        >
          {eventosRecientes.length === 0 ? (
            <EmptyState text="Sin eventos recientes." />
          ) : (
            <ul className="space-y-2.5">
              {eventosRecientes.map(ev => (
                <li key={ev.id} className="text-xs">
                  <p className="text-gray-300 leading-snug">{ev.detalle}</p>
                  <p className="text-gray-600 mt-0.5">{fmtFecha(ev.fecha)}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {ospePendientes.length > 0 && (
        <SectionCard
          title="OS/PE pendientes de seguimiento"
          subtitle="Módulo de Comunicación Inspector ↔ Contratista"
          action={<Link href="/nexus/comunicaciones" className="text-[11px] text-blue-400 hover:underline">Ir a Comunicaciones</Link>}
        >
          <ul className="divide-y divide-gray-800">
            {ospePendientes.map(c => (
              <li key={c.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileStack className="size-3.5 text-gray-500 shrink-0" />
                  <span className="text-gray-300 truncate">{c.motivo}</span>
                  <span className="text-gray-600 truncate hidden sm:inline">— {empresaPorId[c.empresaId]?.razonSocial}</span>
                </div>
                <OspeEstadoBadge estado={c.estado} />
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
