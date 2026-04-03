import { LayoutGrid, Columns3, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { useFilteredAulas } from '@/hooks/useFilteredAulas';
import { DIAS_SEMANA, DIAS_SEMANA_LABEL, type DiaSemana } from '@/types';

export function GridToolbar() {
  const modo = useAppStore((s) => s.modoVistaCuadricula);
  const setModoVista = useAppStore((s) => s.setModoVista);
  const granularidad = useAppStore((s) => s.granularidadVista);
  const setGranularidad = useAppStore((s) => s.setGranularidad);
  const diaSeleccionado = useAppStore((s) => s.diaSeleccionado);
  const setDiaSeleccionado = useAppStore((s) => s.setDiaSeleccionado);
  const filtros = useAppStore((s) => s.filtros);
  const setFiltros = useAppStore((s) => s.setFiltros);
  const { sedes, pisos, filteredAulas } = useFilteredAulas();
  const totalAulas = useAppStore((s) => s.aulas.length);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-grid-border bg-gray-50 p-3">
      {/* Modo vista */}
      <div className="flex items-center gap-1 rounded-md bg-white border border-gray-200 p-0.5">
        <button
          onClick={() => setModoVista('dias-aulas')}
          title="Días > Aulas"
          className={cn(
            'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors',
            modo === 'dias-aulas'
              ? 'bg-primary text-white'
              : 'text-secondary hover:text-primary',
          )}
        >
          <LayoutGrid size={14} />
          Día &gt; Aulas
        </button>
        <button
          onClick={() => setModoVista('aulas-dias')}
          title="Aulas > Días"
          className={cn(
            'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors',
            modo === 'aulas-dias'
              ? 'bg-primary text-white'
              : 'text-secondary hover:text-primary',
          )}
        >
          <Columns3 size={14} />
          Aula &gt; Días
        </button>
      </div>

      {/* Granularidad */}
      <div className="flex items-center gap-1 rounded-md bg-white border border-gray-200 p-0.5">
        <Clock size={14} className="ml-2 text-secondary" />
        <button
          onClick={() => setGranularidad(30)}
          className={cn(
            'rounded px-2.5 py-1.5 text-xs font-medium transition-colors',
            granularidad === 30
              ? 'bg-primary text-white'
              : 'text-secondary hover:text-primary',
          )}
        >
          30 min
        </button>
        <button
          onClick={() => setGranularidad(60)}
          className={cn(
            'rounded px-2.5 py-1.5 text-xs font-medium transition-colors',
            granularidad === 60
              ? 'bg-primary text-white'
              : 'text-secondary hover:text-primary',
          )}
        >
          1 hora
        </button>
      </div>

      {/* Separador */}
      <div className="h-6 w-px bg-gray-300" />

      {/* Filtros sede/piso */}
      {sedes.length > 0 && (
        <select
          value={filtros.sede ?? ''}
          onChange={(e) => setFiltros({ sede: e.target.value || undefined })}
          className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
        >
          <option value="">Todas las sedes</option>
          {sedes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
      {pisos.length > 0 && (
        <select
          value={filtros.piso ?? ''}
          onChange={(e) => setFiltros({ piso: e.target.value || undefined })}
          className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
        >
          <option value="">Todos los pisos</option>
          {pisos.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      )}

      <span className="text-xs text-secondary">
        {filteredAulas.length}/{totalAulas} aulas
      </span>

      {/* Tabs de dias (solo modo dias-aulas) */}
      {modo === 'dias-aulas' && (
        <>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex gap-0.5 rounded-md bg-white border border-gray-200 p-0.5">
            {DIAS_SEMANA.map((dia) => (
              <button
                key={dia}
                onClick={() => setDiaSeleccionado(dia as DiaSemana)}
                className={cn(
                  'rounded px-3 py-1.5 text-xs font-medium transition-colors',
                  diaSeleccionado === dia
                    ? 'bg-primary text-white'
                    : 'text-secondary hover:text-primary',
                )}
              >
                {DIAS_SEMANA_LABEL[dia]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
