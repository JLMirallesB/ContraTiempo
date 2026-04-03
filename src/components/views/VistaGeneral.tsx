import { useAppStore } from '@/stores/useAppStore';
import { GridToolbar } from '@/components/grid/GridToolbar';
import { ScheduleGrid } from '@/components/grid/ScheduleGrid';

export function VistaGeneral() {
  const aulas = useAppStore((s) => s.aulas);
  const docentes = useAppStore((s) => s.docentes);
  const asignaturas = useAppStore((s) => s.asignaturas);

  const hasData = aulas.length > 0 || docentes.length > 0 || asignaturas.length > 0;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Horario</h2>
        <div className="flex gap-3 text-xs text-secondary">
          <span>{aulas.length} aulas</span>
          <span>{docentes.length} docentes</span>
          <span>{asignaturas.length} asignaturas</span>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <p className="text-lg text-secondary">
              No hay datos configurados todavía.
            </p>
            <p className="mt-2 text-sm text-secondary">
              Ve a <strong>Configuración</strong> para añadir aulas, docentes y
              asignaturas.
            </p>
          </div>
        </div>
      ) : (
        <>
          <GridToolbar />
          <div className="flex-1 overflow-hidden">
            <ScheduleGrid />
          </div>
        </>
      )}
    </div>
  );
}
