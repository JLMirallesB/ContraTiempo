import { useAppStore, useFranjasActivas } from '@/stores/useAppStore';
import { duracionEnHoras } from '@/services/timeUtils';
import { DIAS_SEMANA_LABEL, type FranjaClase } from '@/types';

export function VistaAsignatura() {
  const filtros = useAppStore((s) => s.filtros);
  const asignaturas = useAppStore((s) => s.asignaturas);
  const docentes = useAppStore((s) => s.docentes);
  const aulas = useAppStore((s) => s.aulas);
  const franjas = useFranjasActivas();

  const asignatura = asignaturas.find((a) => a.id === filtros.asignaturaId);

  if (!asignatura) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-secondary">Selecciona una asignatura del menú lateral.</p>
      </div>
    );
  }

  const franjasAsig = franjas.filter(
    (f) => f.tipo === 'clase' && f.asignaturaId === asignatura.id,
  ) as FranjaClase[];

  // Calcular estadisticas
  const totalHoras = franjasAsig.reduce(
    (acc, f) => acc + duracionEnHoras(f.horaInicio, f.horaFin),
    0,
  );
  const totalGrupos = franjasAsig.length;
  const capacidadTotal = totalGrupos * asignatura.ratio;

  // Agrupar por docente
  const porDocente = new Map<string, FranjaClase[]>();
  for (const f of franjasAsig) {
    const list = porDocente.get(f.docenteId) ?? [];
    list.push(f);
    porDocente.set(f.docenteId, list);
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800">{asignatura.nombre}</h2>
      <p className="mb-4 text-sm text-secondary">
        Alias: {asignatura.alias} · Ratio: {asignatura.ratio} alumnos/grupo ·{' '}
        {asignatura.turnosSemanales} turno(s)/semana · {asignatura.tipo ?? 'Sin tipo'}
      </p>

      {/* Resumen */}
      <div className="mb-6 flex gap-3">
        <StatCard label="Franjas" valor={totalGrupos} />
        <StatCard label="Horas totales" valor={`${totalHoras.toFixed(1)}h`} />
        <StatCard label="Capacidad alumnado" valor={capacidadTotal} color="bg-purple-50 text-purple-800" />
      </div>

      {/* Tabla de franjas */}
      {franjasAsig.length === 0 ? (
        <p className="text-sm text-secondary">
          No hay franjas asignadas para esta asignatura.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-grid-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Día</th>
                <th className="px-4 py-3 font-medium text-gray-600">Horario</th>
                <th className="px-4 py-3 font-medium text-gray-600">Docente</th>
                <th className="px-4 py-3 font-medium text-gray-600">Aula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grid-border">
              {franjasAsig
                .sort((a, b) => {
                  const diaOrder = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
                  const di = diaOrder.indexOf(a.dia) - diaOrder.indexOf(b.dia);
                  if (di !== 0) return di;
                  return a.horaInicio.localeCompare(b.horaInicio);
                })
                .map((f) => {
                  const doc = docentes.find((d) => d.id === f.docenteId);
                  const aula = aulas.find((a) => a.id === f.aulaId);
                  return (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">
                        {DIAS_SEMANA_LABEL[f.dia]}
                      </td>
                      <td className="px-4 py-2">
                        {f.horaInicio} – {f.horaFin}
                      </td>
                      <td className="px-4 py-2">{doc?.nombre ?? '—'}</td>
                      <td className="px-4 py-2">{aula?.nombre ?? '—'}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* Desglose por docente */}
      {porDocente.size > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Por docente</h3>
          <div className="flex flex-wrap gap-3">
            {[...porDocente.entries()].map(([docenteId, fs]) => {
              const doc = docentes.find((d) => d.id === docenteId);
              const horas = fs.reduce(
                (acc, f) => acc + duracionEnHoras(f.horaInicio, f.horaFin),
                0,
              );
              return (
                <div
                  key={docenteId}
                  className="rounded-lg border border-grid-border bg-gray-50 px-4 py-3"
                >
                  <p className="font-medium">{doc?.nombre ?? '?'}</p>
                  <p className="text-xs text-secondary">
                    {fs.length} franjas · {horas.toFixed(1)}h ·{' '}
                    {fs.length * asignatura.ratio} alumnos
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  valor,
  color = 'bg-blue-50 text-blue-800',
}: {
  label: string;
  valor: number | string;
  color?: string;
}) {
  return (
    <div className={`rounded-lg px-4 py-2 text-center ${color}`}>
      <p className="text-lg font-bold">{valor}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}
