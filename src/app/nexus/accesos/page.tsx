'use client';

import { GraduationCap, KeyRound, Truck, Mail } from 'lucide-react';
import { useNexus, useRecursosFiltrados } from '@/hooks/useNexusStore';
import { fmtFecha } from '@/lib/nexus/engine';
import { SectionCard, EmptyState, EstadoAvalBadge } from '@/components/nexus/ui';

const CURSO_RESULTADO_TONE: Record<string, string> = {
  aprobado: 'text-emerald-400',
  pendiente: 'text-amber-400',
  desaprobado: 'text-red-400',
};

const CREDENCIAL_ESTADO_LABEL: Record<string, string> = {
  no_solicitada: 'No solicitada',
  solicitada_gip: 'Solicitada a GIP',
  entregada: 'Entregada',
  invalidada: 'Invalidada',
};

const CREDENCIAL_TONE: Record<string, string> = {
  no_solicitada: 'text-gray-500',
  solicitada_gip: 'text-amber-400',
  entregada: 'text-emerald-400',
  invalidada: 'text-red-400',
};

export default function AccesosPage() {
  const { empresaPorId } = useNexus();
  const recursos = useRecursosFiltrados().filter(r => r.activo);

  const personal = recursos.filter(r => r.tipo === 'personal_dependencia' || r.tipo === 'personal_independiente');
  const vehiculos = recursos.filter(r => r.tipo === 'vehiculo');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-blue-400">Gestión de Habilitaciones y Accesos</h1>
        <p className="text-sm text-gray-400 mt-1">
          Cursos de Seguridad, Credenciales Magnéticas y Habilitación Vehicular — para asegurar el ingreso sin demoras.
        </p>
      </div>

      {/* Cursos de seguridad */}
      <SectionCard
        title="Cursos de Seguridad"
        subtitle="CILP vía UTN (La Plata) · Edificio Y-TEC vía Seguridad Y-TEC · vigencia 2 años"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-800">
                <th className="py-2 pr-3 font-medium">Recurso</th>
                <th className="py-2 pr-3 font-medium">Empresa</th>
                <th className="py-2 pr-3 font-medium">Sitio</th>
                <th className="py-2 pr-3 font-medium">Entidad</th>
                <th className="py-2 pr-3 font-medium">Rendido</th>
                <th className="py-2 pr-3 font-medium">Vence</th>
                <th className="py-2 pr-3 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {personal.filter(p => p.cursos && p.cursos.length > 0).map(p =>
                p.cursos!.map((c, i) => (
                  <tr key={`${p.id}-${i}`} className="border-b border-gray-900">
                    <td className="py-2 pr-3 text-gray-200 flex items-center gap-1.5"><GraduationCap className="size-3.5 text-gray-500" />{p.nombre}</td>
                    <td className="py-2 pr-3 text-gray-400">{empresaPorId[p.empresaId]?.razonSocial}</td>
                    <td className="py-2 pr-3 text-gray-300">{c.sitio}</td>
                    <td className="py-2 pr-3 text-gray-400">{c.entidad}</td>
                    <td className="py-2 pr-3 text-gray-500">{c.fechaRendido ? fmtFecha(c.fechaRendido) : '—'}</td>
                    <td className="py-2 pr-3 text-gray-500">{c.fechaVencimiento ? fmtFecha(c.fechaVencimiento) : '—'}</td>
                    <td className={`py-2 pr-3 font-medium ${CURSO_RESULTADO_TONE[c.resultado ?? 'pendiente']}`}>{c.resultado ?? 'pendiente'}</td>
                  </tr>
                ))
              )}
              {personal.every(p => !p.cursos || p.cursos.length === 0) && (
                <tr><td colSpan={7}><EmptyState text="Sin cursos de seguridad registrados." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Credenciales magnéticas */}
      <SectionCard
        title="Credenciales Magnéticas"
        subtitle="Gestión vía mail a GIP (Gestión Integral de Proveedores) para sitios con barreras o puertas controladas"
        action={<span className="inline-flex items-center gap-1 text-[11px] text-gray-500"><Mail className="size-3" /> GIP</span>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 text-left border-b border-gray-800">
                <th className="py-2 pr-3 font-medium">Recurso</th>
                <th className="py-2 pr-3 font-medium">Empresa</th>
                <th className="py-2 pr-3 font-medium">Sitio</th>
                <th className="py-2 pr-3 font-medium">Solicitada</th>
                <th className="py-2 pr-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {personal.filter(p => p.credenciales && p.credenciales.length > 0).map(p =>
                p.credenciales!.map((c, i) => (
                  <tr key={`${p.id}-${i}`} className="border-b border-gray-900">
                    <td className="py-2 pr-3 text-gray-200 flex items-center gap-1.5"><KeyRound className="size-3.5 text-gray-500" />{p.nombre}</td>
                    <td className="py-2 pr-3 text-gray-400">{empresaPorId[p.empresaId]?.razonSocial}</td>
                    <td className="py-2 pr-3 text-gray-300">{c.sitio}</td>
                    <td className="py-2 pr-3 text-gray-500">{c.solicitadaEl ? fmtFecha(c.solicitadaEl) : '—'}</td>
                    <td className={`py-2 pr-3 font-medium ${CREDENCIAL_TONE[c.estado]}`}>{CREDENCIAL_ESTADO_LABEL[c.estado]}</td>
                  </tr>
                ))
              )}
              {personal.every(p => !p.credenciales || p.credenciales.length === 0) && (
                <tr><td colSpan={5}><EmptyState text="Sin credenciales magnéticas registradas." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Habilitación vehicular */}
      <SectionCard
        title="Habilitación Vehicular CILP"
        subtitle="Formulario 11 (Habilitación) y Formulario 12 (Credencial Colgante Roja) ante la Comisión de Gestión Vehicular"
      >
        {vehiculos.length === 0 ? (
          <EmptyState text="Sin vehículos activos." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vehiculos.map(v => (
              <div key={v.id} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-200 font-medium flex items-center gap-1.5"><Truck className="size-3.5 text-gray-500" />{v.nombre}</p>
                  <EstadoAvalBadge estado={v.estadoAval} />
                </div>
                <p className="text-[11px] text-gray-500">{v.identificador} · {empresaPorId[v.empresaId]?.razonSocial}</p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="bg-gray-900 rounded px-2 py-1.5">
                    <p className="text-gray-500">Formulario 11</p>
                    <p className="text-gray-200 capitalize">{v.habilitacionVehicular?.formulario11 ?? 'pendiente'}</p>
                  </div>
                  <div className="bg-gray-900 rounded px-2 py-1.5">
                    <p className="text-gray-500">Formulario 12</p>
                    <p className="text-gray-200 capitalize">{v.habilitacionVehicular?.formulario12 ?? 'pendiente'}</p>
                  </div>
                </div>
                {v.habilitacionVehicular?.comisionGestionVehicular && (
                  <p className="text-[11px] text-gray-600">Res. Comisión: {v.habilitacionVehicular.comisionGestionVehicular}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
