'use client';

import { useMemo, useState } from 'react';

type Dificultad = 'bajo' | 'medio' | 'alto';

const CONFIGURACIONES: Record<Dificultad, { probabilidadPaso: number; mults: number[] }> = {
  bajo: { probabilidadPaso: 0.66, mults: [1.45, 2.10, 3.10, 4.55, 6.70] },
  medio: { probabilidadPaso: 0.50, mults: [1.94, 3.88, 7.60, 15.20, 30.40] },
  alto: { probabilidadPaso: 0.33, mults: [2.90, 8.60, 25.50, 75.00, 220.00] },
};

const TOTAL_PARTIDAS = 10000;

interface ResultadoSimulacion {
  exitos: number;
  rachaDerrotasMax: number;
}

export default function CristalSimulatorPage() {
  const [presupuesto, setPresupuesto] = useState(500);
  const [apuesta, setApuesta] = useState(10);
  const [dificultad, setDificultad] = useState<Dificultad>('medio');
  const [nivelObjetivo, setNivelObjetivo] = useState(3);
  const [resultado, setResultado] = useState<ResultadoSimulacion | null>(null);

  const config = CONFIGURACIONES[dificultad];

  const probTeorica = Math.pow(config.probabilidadPaso, nivelObjetivo);
  const mult = config.mults[nivelObjetivo - 1];
  const retorno = apuesta * mult;

  const intentosDisponibles = useMemo(() => {
    if (!apuesta || apuesta <= 0) return 0;
    const intentos = Math.floor(presupuesto / apuesta);
    return intentos > 0 ? intentos : 0;
  }, [presupuesto, apuesta]);

  const filas = useMemo(() => {
    return Array.from({ length: 5 }, (_, idx) => {
      const escalon = idx + 1;
      const p = Math.pow(config.probabilidadPaso, escalon) * 100;
      const m = config.mults[idx];
      const c = apuesta * m;
      return { escalon, p, m, c };
    });
  }, [config, apuesta]);

  function ejecutarSimulacion() {
    let exitos = 0;
    let rachaDerrotasMax = 0;
    let rachaDerrotasActual = 0;

    for (let i = 0; i < TOTAL_PARTIDAS; i++) {
      let logroObjetivo = true;

      for (let n = 0; n < nivelObjetivo; n++) {
        if (Math.random() > config.probabilidadPaso) {
          logroObjetivo = false;
          break;
        }
      }

      if (logroObjetivo) {
        exitos++;
        rachaDerrotasActual = 0;
      } else {
        rachaDerrotasActual++;
        if (rachaDerrotasActual > rachaDerrotasMax) {
          rachaDerrotasMax = rachaDerrotasActual;
        }
      }
    }

    setResultado({ exitos, rachaDerrotasMax });
  }

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans antialiased">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="border-b border-slate-700 pb-6 mb-8 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-rose-500 tracking-wider uppercase">
            📊 Panel de Control y Riesgo
          </h1>
          <p className="text-slate-400 mt-2">
            Configura tu presupuesto, evalúa las dificultades y simula escenarios de avance.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-6">
            <h2 className="text-xl font-bold text-slate-200 border-b border-slate-700 pb-2">
              ⚙️ Configuración
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Presupuesto de Entretenimiento (€)
              </label>
              <input
                type="number"
                value={presupuesto}
                min={10}
                onChange={(e) => setPresupuesto(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Apuesta por Intento (€)
              </label>
              <input
                type="number"
                value={apuesta}
                min={0.2}
                max={1000}
                step={0.5}
                onChange={(e) => setApuesta(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500"
              />
              <p className="text-xs text-slate-500 mt-1">Mín: 0.20€ | Máx: 1,000€</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Nivel de Dificultad
              </label>
              <select
                value={dificultad}
                onChange={(e) => setDificultad(e.target.value as Dificultad)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500"
              >
                <option value="bajo">Bajo (Mayor probabilidad - Menor Premio)</option>
                <option value="medio">Medio (Estándar 50/50 - 2 opciones)</option>
                <option value="alto">Alto (3 opciones por escalón - Riesgoso)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Escalón Objetivo (Cashout en:)
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={nivelObjetivo}
                onChange={(e) => setNivelObjetivo(parseInt(e.target.value, 10))}
                className="w-full accent-rose-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Nivel 1</span>
                <span className="font-bold text-rose-400 text-sm">Nivel {nivelObjetivo}</span>
                <span>Nivel 5</span>
              </div>
            </div>

            <button
              onClick={ejecutarSimulacion}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-lg transition duration-200 uppercase tracking-wider shadow-lg"
            >
              🔄 Ejecutar Simulación
            </button>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Tasa de Éxito Teórica
                </p>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {(probTeorica * 100).toFixed(2)}%
                </p>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Multiplicador Estimado
                </p>
                <p className="text-2xl font-black text-blue-400 mt-1">x{mult.toFixed(2)}</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Retorno Potencial
                </p>
                <p className="text-2xl font-black text-rose-400 mt-1">{retorno.toFixed(2)} €</p>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
              <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <span>📋</span> Matriz Matemática de Progresión
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3 rounded-l-lg">Escalón</th>
                      <th className="p-3">Probabilidad</th>
                      <th className="p-3">Multiplicador</th>
                      <th className="p-3 rounded-r-lg">Cobro Esperado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filas.map(({ escalon, p, m, c }) => {
                      const esObjetivo = escalon === nivelObjetivo;
                      return (
                        <tr
                          key={escalon}
                          className={`${esObjetivo ? 'bg-rose-500/10 font-bold text-rose-400' : ''} hover:bg-slate-700/50 transition`}
                        >
                          <td className="p-3">
                            Escalón {escalon} {esObjetivo ? '🎯' : ''}
                          </td>
                          <td className="p-3">{p.toFixed(2)}%</td>
                          <td className="p-3">x{m.toFixed(2)}</td>
                          <td className="p-3">{c.toFixed(2)} €</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {resultado && (
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <h3 className="text-lg font-bold text-slate-200 mb-2">
                  🎲 Simulación de Racha Real (10,000 Partidas)
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Ejecución algorítmica basada en números aleatorios para auditar pérdidas consecutivas.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <div>
                    <p className="text-sm text-slate-400">Intentos que logran el objetivo:</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {resultado.exitos.toLocaleString()} / 10,000 (
                      {((resultado.exitos / TOTAL_PARTIDAS) * 100).toFixed(2)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Racha de Pérdidas Máxima Detectada:</p>
                    <p className="text-xl font-bold text-amber-500">
                      {resultado.rachaDerrotasMax} intentos fallidos
                    </p>
                  </div>
                </div>
                <p className="text-xs text-amber-400/80 mt-3 italic">
                  💡 Consejo de gestión: Tu presupuesto actual te permite soportar un máximo de{' '}
                  <span className="font-bold">{intentosDisponibles}</span> intentos antes de agotar la
                  banca.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
