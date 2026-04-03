/**
 * Funciones de conversion entre el estado del store Zustand y el formato SyncData.
 */

import { SYNC_VERSION, type SyncData } from '../../shared/sync';
import { CONFIG_POR_DEFECTO } from '../../shared/types';
import { useAppStore } from '@/stores/useAppStore';

/**
 * Extrae los datos persistibles del store y los convierte a SyncData.
 */
export function stateToSyncData(): SyncData {
  const state = useAppStore.getState();
  return {
    version: SYNC_VERSION,
    lastModified: new Date().toISOString(),
    escenarioActivoId: state.escenarioActivoId,
    aulas: state.aulas,
    docentes: state.docentes,
    asignaturas: state.asignaturas,
    tiposOcupacion: state.tiposOcupacion,
    escenarios: state.escenarios,
  };
}

/**
 * Aplica un SyncData al store, reemplazando datos maestros y escenarios.
 * Preserva el estado de UI (vistaActual, filtros, etc.).
 */
export function syncDataToState(data: SyncData): void {
  useAppStore.setState({
    aulas: data.aulas,
    docentes: data.docentes,
    asignaturas: data.asignaturas,
    tiposOcupacion: data.tiposOcupacion,
    escenarios: data.escenarios.length > 0
      ? data.escenarios
      : [{
          id: 'escenario-default',
          nombre: 'Horario Principal',
          franjas: [],
          configuracion: CONFIG_POR_DEFECTO,
          creadoEn: new Date().toISOString(),
          modificadoEn: new Date().toISOString(),
        }],
    escenarioActivoId: data.escenarioActivoId || data.escenarios[0]?.id || 'escenario-default',
  });
}
