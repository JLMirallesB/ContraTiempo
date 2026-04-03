import { useAppStore, useFranjasActivas } from '@/stores/useAppStore';
import { WeekGrid } from '@/components/grid/WeekGrid';
import { duracionEnHoras } from '@/services/timeUtils';

export function VistaDocente() {
  const filtros = useAppStore((s) => s.filtros);
  const docentes = useAppStore((s) => s.docentes);
  const franjas = useFranjasActivas();

  const docente = docentes.find((d) => d.id === filtros.docenteId);

  if (!docente) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-secondary">Selecciona un docente del menú lateral.</p>
      </div>
    );
  }

  const franjasDocente = franjas.filter((f) => f.docenteId === docente.id);

  // Calcular horas totales asignadas
  const horasClases = franjasDocente
    .filter((f) => f.tipo === 'clase')
    .reduce((acc, f) => acc + duracionEnHoras(f.horaInicio, f.horaFin), 0);

  const horasOcupaciones = franjasDocente
    .filter((f) => f.tipo === 'ocupacion')
    .reduce((acc, f) => acc + duracionEnHoras(f.horaInicio, f.horaFin), 0);

  const horasTotal = horasClases + horasOcupaciones;
  const diferencia = horasTotal - docente.horasContratadas;

  const detalles = [
    `Especialidad: ${docente.especialidad}`,
    docente.departamento && `Depto: ${docente.departamento}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Resumen de horas */}
      <div className="flex gap-3">
        <HorasCard label="Clases" horas={horasClases} color="bg-clase text-blue-800" />
        <HorasCard label="Ocupaciones" horas={horasOcupaciones} color="bg-ocupacion text-amber-800" />
        <HorasCard label="Total" horas={horasTotal} color="bg-gray-100 text-gray-800" />
        <HorasCard label="Contratadas" horas={docente.horasContratadas} color="bg-gray-100 text-gray-800" />
        <div
          className={`flex flex-col items-center justify-center rounded-lg px-4 py-2 text-xs font-medium ${
            diferencia > 0
              ? 'bg-red-50 text-error'
              : diferencia < 0
                ? 'bg-amber-50 text-warning'
                : 'bg-green-50 text-success'
          }`}
        >
          <span className="text-lg font-bold">
            {diferencia > 0 ? '+' : ''}
            {diferencia.toFixed(1)}h
          </span>
          <span>{diferencia > 0 ? 'Exceso' : diferencia < 0 ? 'Faltan' : 'Justo'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <WeekGrid
          franjas={franjasDocente}
          titulo={docente.nombre}
          subtitulo={detalles}
        />
      </div>
    </div>
  );
}

function HorasCard({
  label,
  horas,
  color,
}: {
  label: string;
  horas: number;
  color: string;
}) {
  return (
    <div className={`flex flex-col items-center rounded-lg px-4 py-2 text-xs font-medium ${color}`}>
      <span className="text-lg font-bold">{horas.toFixed(1)}h</span>
      <span>{label}</span>
    </div>
  );
}
