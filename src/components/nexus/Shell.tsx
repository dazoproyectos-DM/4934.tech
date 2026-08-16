'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  KeyRound,
  CalendarClock,
  MessagesSquare,
  ShieldCheck,
  FileBarChart2,
  Building2,
  Network,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNexus } from '@/hooks/useNexusStore';

const NAV = [
  { href: '/nexus', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/nexus/recursos', label: 'Recursos & OT', icon: Users },
  { href: '/nexus/aprobaciones', label: 'Aprobaciones', icon: ClipboardCheck },
  { href: '/nexus/accesos', label: 'Accesos', icon: KeyRound },
  { href: '/nexus/vigencias', label: 'Vigencias', icon: CalendarClock },
  { href: '/nexus/comunicaciones', label: 'Comunicaciones', icon: MessagesSquare },
  { href: '/nexus/control', label: 'Control', icon: ShieldCheck },
  { href: '/nexus/auditoria', label: 'Auditoría', icon: FileBarChart2 },
];

function EmpresaSelector() {
  const { empresas, empresaSeleccionada, setEmpresaSeleccionada } = useNexus();
  return (
    <label className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5">
      <Building2 className="size-3.5 text-gray-500 shrink-0" />
      <select
        value={empresaSeleccionada}
        onChange={e => setEmpresaSeleccionada(e.target.value)}
        className="bg-transparent text-xs text-gray-200 focus:outline-none max-w-[180px] sm:max-w-[260px]"
      >
        <option value="todas" className="bg-gray-900">Todas las empresas</option>
        {empresas.map(e => (
          <option key={e.id} value={e.id} className="bg-gray-900">
            {e.razonSocial}{e.esSubcontratista ? ' (Subcontratista)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function NexusShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-60 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-800 lg:min-h-screen">
          <div className="px-4 pt-8 pb-4 lg:pt-10 flex items-center gap-2 border-b border-gray-800 lg:border-b-0">
            <div className="size-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
              <Network className="size-4 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-wide text-white">NEXUS</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Empresarial · SRC</p>
            </div>
          </div>
          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible px-2 py-2 lg:py-4 gap-1">
            {NAV.map(item => {
              const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                    active
                      ? 'bg-blue-600/15 text-blue-300 ring-1 ring-inset ring-blue-500/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <header className="sticky top-24 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-4 md:px-6 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500">Gestor inteligente de Órdenes de Trabajo y subcontratos</p>
            </div>
            <EmpresaSelector />
          </header>
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
