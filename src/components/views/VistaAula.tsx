import { useAppStore, useFranjasActivas } from '@/stores/useAppStore';
import { WeekGrid } from '@/components/grid/WeekGrid';

export function VistaAula() {
  const filtros = useAppStore((s) => s.filtros);
  const aulas = useAppStore((s) => s.aulas);
  const franjas = useFranjasActivas();

  const aula = aulas.find((a) => a.id === filtros.aulaId);

  if (!aula) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-secondary">Selecciona un aula del menú lateral.</p>
      </div>
    );
  }

  const franjasAula = franjas.filter((f) => {
    if (f.tipo === 'clase') return f.aulaId === aula.id;
    return f.aulaId === aula.id;
  });

  const detalles = [
    aula.sede && `Sede: ${aula.sede}`,
    aula.piso && `Piso: ${aula.piso}`,
    `Capacidad: ${aula.capacidad}`,
    aula.atributos.length > 0 && `Atributos: ${aula.atributos.join(', ')}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <WeekGrid
      franjas={franjasAula}
      titulo={aula.nombre}
      subtitulo={detalles}
    />
  );
}
