import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import type { Aula } from '@/types';

export function useFilteredAulas(): {
  filteredAulas: Aula[];
  sedes: string[];
  pisos: string[];
} {
  const aulas = useAppStore((s) => s.aulas);
  const filtros = useAppStore((s) => s.filtros);

  const sedes = useMemo(
    () => [...new Set(aulas.map((a) => a.sede).filter(Boolean))].sort(),
    [aulas],
  );

  const pisos = useMemo(
    () => [...new Set(aulas.map((a) => a.piso).filter(Boolean))].sort(),
    [aulas],
  );

  const filteredAulas = useMemo(() => {
    let result = [...aulas];

    if (filtros.sede) {
      result = result.filter((a) => a.sede === filtros.sede);
    }
    if (filtros.piso) {
      result = result.filter((a) => a.piso === filtros.piso);
    }
    if (filtros.aulasSeleccionadas && filtros.aulasSeleccionadas.length > 0) {
      const set = new Set(filtros.aulasSeleccionadas);
      result = result.filter((a) => set.has(a.id));
    }

    return result.sort((a, b) => a.orden - b.orden);
  }, [aulas, filtros.sede, filtros.piso, filtros.aulasSeleccionadas]);

  return { filteredAulas, sedes, pisos };
}
