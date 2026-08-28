import type { Metadata } from 'next';
import { NexusProvider } from '@/hooks/useNexusStore';
import NexusShell from '@/components/nexus/Shell';

export const metadata: Metadata = {
  title: 'Nexus Empresarial — Gestor de OT y Subcontratos SRC',
  description:
    'Plataforma interactiva para automatizar el cumplimiento normativo de YPF (SRC): gestión de Órdenes de Trabajo, subcontratos, documentación, accesos, vigencias, control y auditoría.',
};

export default function NexusLayout({ children }: { children: React.ReactNode }) {
  return (
    <NexusProvider>
      <NexusShell>{children}</NexusShell>
    </NexusProvider>
  );
}
