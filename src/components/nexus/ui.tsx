'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { EstadoAval, EstadoDocumento, OSPEEstado, Semaforo } from '@/types/nexus';
import { ESTADO_AVAL_LABEL, ESTADO_DOCUMENTO_LABEL, OSPE_ESTADO_LABEL } from '@/lib/nexus/constants';

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
  icon?: ReactNode;
}) {
  const toneClasses: Record<string, string> = {
    default: 'text-blue-300',
    good: 'text-emerald-300',
    warn: 'text-amber-300',
    bad: 'text-red-300',
  };
  return (
    <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
        {icon && <span className="text-gray-500">{icon}</span>}
      </div>
      <span className={cn('text-2xl font-bold', toneClasses[tone])}>{value}</span>
      {hint && <span className="text-[11px] text-gray-500">{hint}</span>}
    </div>
  );
}

export function SectionCard({ title, subtitle, action, children, className }: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('bg-gray-900/40 rounded-xl border border-gray-800', className)}>
      <div className="flex items-start justify-between px-4 py-3 border-b border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

const ESTADO_AVAL_TONE: Record<EstadoAval, string> = {
  nuevo: 'bg-gray-700/60 text-gray-200 ring-gray-500/30',
  pendiente_inspector: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  aprobada: 'bg-sky-500/10 text-sky-300 ring-sky-500/30',
  avalado: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  rechazado: 'bg-red-500/10 text-red-300 ring-red-500/30',
};

export function EstadoAvalBadge({ estado }: { estado: EstadoAval }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap', ESTADO_AVAL_TONE[estado])}>
      {ESTADO_AVAL_LABEL[estado]}
    </span>
  );
}

const ESTADO_DOC_TONE: Record<EstadoDocumento, string> = {
  pendiente: 'bg-gray-700/60 text-gray-300 ring-gray-500/30',
  cargado: 'bg-sky-500/10 text-sky-300 ring-sky-500/30',
  validado: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  vencido: 'bg-red-500/10 text-red-300 ring-red-500/30',
  rechazado: 'bg-red-500/10 text-red-300 ring-red-500/30',
};

export function EstadoDocumentoBadge({ estado }: { estado: EstadoDocumento }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset whitespace-nowrap', ESTADO_DOC_TONE[estado])}>
      {ESTADO_DOCUMENTO_LABEL[estado]}
    </span>
  );
}

const SEMAFORO_DOT: Record<Semaforo, string> = {
  verde: 'bg-emerald-400',
  amarillo: 'bg-amber-400',
  rojo: 'bg-red-400',
};

export function SemaforoDot({ estado, label }: { estado: Semaforo; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', SEMAFORO_DOT[estado])} />
      {label && <span className="text-xs text-gray-300">{label}</span>}
    </span>
  );
}

const OSPE_ESTADO_TONE: Record<OSPEEstado, string> = {
  borrador: 'bg-gray-700/60 text-gray-300 ring-gray-500/30',
  enviada: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  respondida: 'bg-sky-500/10 text-sky-300 ring-sky-500/30',
  cerrada: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
};

export function OspeEstadoBadge({ estado }: { estado: OSPEEstado }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap', OSPE_ESTADO_TONE[estado])}>
      {OSPE_ESTADO_LABEL[estado]}
    </span>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-gray-500 italic py-6 text-center">{text}</p>;
}

export function ProgressBar({ pct, tone = 'default' }: { pct: number; tone?: 'default' | 'good' | 'warn' | 'bad' }) {
  const toneClasses: Record<string, string> = {
    default: 'bg-blue-500',
    good: 'bg-emerald-500',
    warn: 'bg-amber-500',
    bad: 'bg-red-500',
  };
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
      <div className={cn('h-full rounded-full', toneClasses[tone])} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}
