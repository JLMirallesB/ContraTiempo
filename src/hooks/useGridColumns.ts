import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useFilteredAulas } from './useFilteredAulas';
import {
  DIAS_SEMANA,
  DIAS_SEMANA_LABEL,
  DIAS_SEMANA_ABREV,
  type GridColumn,
  type DiaSemana,
} from '@/types';

export function useGridColumns(): {
  columns: GridColumn[];
  groupHeaders: { label: string; span: number }[];
} {
  const modo = useAppStore((s) => s.modoVistaCuadricula);
  const diaSeleccionado = useAppStore((s) => s.diaSeleccionado);
  const { filteredAulas } = useFilteredAulas();

  return useMemo(() => {
    const columns: GridColumn[] = [];
    const groupHeaders: { label: string; span: number }[] = [];

    if (modo === 'dias-aulas') {
      // Modo: un dia seleccionado, columnas = aulas filtradas
      const dia = diaSeleccionado;
      for (const aula of filteredAulas) {
        columns.push({
          id: `${dia}-${aula.id}`,
          aulaId: aula.id,
          dia,
          aulaNombre: aula.nombre,
          diaLabel: DIAS_SEMANA_LABEL[dia],
        });
      }
      groupHeaders.push({
        label: DIAS_SEMANA_LABEL[dia],
        span: filteredAulas.length,
      });
    } else {
      // Modo aulas-dias: por cada aula, 5 subcolumnas (L-V)
      for (const aula of filteredAulas) {
        const dias: DiaSemana[] = DIAS_SEMANA;
        for (const dia of dias) {
          columns.push({
            id: `${aula.id}-${dia}`,
            aulaId: aula.id,
            dia,
            aulaNombre: aula.nombre,
            diaLabel: DIAS_SEMANA_ABREV[dia],
          });
        }
        groupHeaders.push({
          label: aula.nombre,
          span: 5,
        });
      }
    }

    return { columns, groupHeaders };
  }, [modo, diaSeleccionado, filteredAulas]);
}
