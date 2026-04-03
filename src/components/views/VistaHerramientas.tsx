import { useState, useMemo } from 'react';
import { Search, Clock, Users } from 'lucide-react';
import { useAppStore, useFranjasActivas, useEscenarioActivo } from '@/stores/useAppStore';
import { calcularHorasDocentes, type ResumenHorasDocente } from '@/services/validators/hoursCalculator';
import { calcularCapacidadAsignaturas } from '@/services/validators/capacityCalculator';
import { buscarHuecosAulas, buscarHuecosCombinados, type HuecoDisponible } from '@/services/validators/gapFinder';
import { formatearDuracion } from '@/services/timeUtils';
import { DIAS_SEMANA_LABEL } from '@/types';
import { cn } from '@/lib/utils';

type Tab = 'horas' | 'capacidad' | 'huecos';

export function VistaHerramientas() {
  const [tab, setTab] = useState<Tab>('horas');

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-gray-800">Herramientas</h2>

      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {([
          { id: 'horas' as Tab, label: 'Horas Docentes', icon: Clock },
          { id: 'capacidad' as Tab, label: 'Capacidad Alumnado', icon: Users },
          { id: 'huecos' as Tab, label: 'Buscador Huecos', icon: Search },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              tab === t.id ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-gray-700',
            )}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'horas' && <HorasDocentes />}
      {tab === 'capacidad' && <CapacidadAlumnado />}
      {tab === 'huecos' && <BuscadorHuecos />}
    </div>
  );
}

// === HORAS DOCENTES ===

function HorasDocentes() {
  const franjas = useFranjasActivas();
  const docentes = useAppStore((s) => s.docentes);

  const resumenes = useMemo(
    () => calcularHorasDocentes(franjas, docentes),
    [franjas, docentes],
  );

  if (docentes.length === 0) {
    return <p className="text-sm text-secondary">No hay docentes registrados.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-grid-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-600">Docente</th>
            <th className="px-4 py-3 font-medium text-gray-600 text-right">Clases</th>
            <th className="px-4 py-3 font-medium text-gray-600 text-right">Ocupaciones</th>
            <th className="px-4 py-3 font-medium text-gray-600 text-right">Total</th>
            <th className="px-4 py-3 font-medium text-gray-600 text-right">Contratadas</th>
            <th className="px-4 py-3 font-medium text-gray-600 text-right">Diferencia</th>
            <th className="px-4 py-3 font-medium text-gray-600">Huecos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-grid-border">
          {resumenes.map((r) => (
            <ResumenDocenteRow key={r.docenteId} resumen={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResumenDocenteRow({ resumen: r }: { resumen: ResumenHorasDocente }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 font-medium">{r.nombre}</td>
      <td className="px-4 py-2 text-right">{r.horasClases.toFixed(1)}h</td>
      <td className="px-4 py-2 text-right">{r.horasOcupaciones.toFixed(1)}h</td>
      <td className="px-4 py-2 text-right font-medium">{r.horasTotal.toFixed(1)}h</td>
      <td className="px-4 py-2 text-right">{r.horasContratadas}h</td>
      <td className="px-4 py-2 text-right">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            r.diferencia > 0.1
              ? 'bg-red-100 text-error'
              : r.diferencia < -0.1
                ? 'bg-amber-100 text-warning'
                : 'bg-green-100 text-success',
          )}
        >
          {r.diferencia > 0 ? '+' : ''}{r.diferencia.toFixed(1)}h
        </span>
      </td>
      <td className="px-4 py-2">
        {r.huecosEntreclases.length > 0 ? (
          <span className="text-xs text-warning">
            {r.huecosEntreclases.length} hueco(s)
          </span>
        ) : (
          <span className="text-xs text-success">Sin huecos</span>
        )}
      </td>
    </tr>
  );
}

// === CAPACIDAD ALUMNADO ===

function CapacidadAlumnado() {
  const franjas = useFranjasActivas();
  const asignaturas = useAppStore((s) => s.asignaturas);

  const resumenes = useMemo(
    () => calcularCapacidadAsignaturas(franjas, asignaturas),
    [franjas, asignaturas],
  );

  if (asignaturas.length === 0) {
    return <p className="text-sm text-secondary">No hay asignaturas registradas.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-grid-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-600">Asignatura</th>
            <th className="px-4 py-3 font-medium text-gray-600">Alias</th>
            <th className="px-4 py-3 font-medium text-gray-600 text-right">Ratio</th>
            <th className="px-4 py-3 font-medium text-gray-600 text-right">Franjas</th>
            <th className="px-4 py-3 font-medium text-gray-600 text-right">Horas</th>
            <th className="px-4 py-3 font-medium text-gray-600 text-right">Capacidad</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-grid-border">
          {resumenes.map((r) => (
            <tr key={r.asignaturaId} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-medium">{r.nombre}</td>
              <td className="px-4 py-2 text-secondary">{r.alias}</td>
              <td className="px-4 py-2 text-right">{r.ratio}</td>
              <td className="px-4 py-2 text-right">{r.totalFranjas}</td>
              <td className="px-4 py-2 text-right">{r.totalHoras.toFixed(1)}h</td>
              <td className="px-4 py-2 text-right">
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                  {r.capacidadAlumnado} alumnos
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// === BUSCADOR DE HUECOS ===

function BuscadorHuecos() {
  const franjas = useFranjasActivas();
  const aulas = useAppStore((s) => s.aulas);
  const docentes = useAppStore((s) => s.docentes);
  const escenario = useEscenarioActivo();

  const [docenteId, setDocenteId] = useState('');
  const [duracionMinima, setDuracionMinima] = useState(30);

  const config = escenario?.configuracion;

  const huecos = useMemo((): HuecoDisponible[] => {
    if (!config) return [];
    if (docenteId) {
      return buscarHuecosCombinados(franjas, docenteId, aulas, config, duracionMinima);
    }
    return buscarHuecosAulas(franjas, aulas, config, duracionMinima);
  }, [franjas, aulas, config, docenteId, duracionMinima]);

  return (
    <div>
      {/* Filtros */}
      <div className="mb-4 flex gap-3 items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Docente (opcional)</label>
          <select
            value={docenteId}
            onChange={(e) => setDocenteId(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Solo aulas libres</option>
            {docentes.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Duración mínima</label>
          <select
            value={duracionMinima}
            onChange={(e) => setDuracionMinima(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value={30}>30 min</option>
            <option value={60}>1 hora</option>
            <option value={90}>1h 30min</option>
            <option value={120}>2 horas</option>
          </select>
        </div>
        <div className="text-xs text-secondary pb-1.5">
          {huecos.length} huecos encontrados
        </div>
      </div>

      {/* Resultados */}
      {huecos.length === 0 ? (
        <p className="text-sm text-secondary">No se encontraron huecos con los criterios seleccionados.</p>
      ) : (
        <div className="max-h-[500px] overflow-auto rounded-lg border border-grid-border">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Día</th>
                <th className="px-4 py-3 font-medium text-gray-600">Horario</th>
                <th className="px-4 py-3 font-medium text-gray-600">Duración</th>
                <th className="px-4 py-3 font-medium text-gray-600">Aula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grid-border">
              {huecos.slice(0, 100).map((h, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{DIAS_SEMANA_LABEL[h.dia]}</td>
                  <td className="px-4 py-2">{h.inicio} – {h.fin}</td>
                  <td className="px-4 py-2">{formatearDuracion(h.duracionMin)}</td>
                  <td className="px-4 py-2">{h.aulaNombre ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
