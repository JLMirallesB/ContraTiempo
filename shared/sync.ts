/**
 * Schema de sincronizacion compartido entre App, Tauri y MCP Server.
 * Define el formato del archivo JSON que sirve de puente entre los tres.
 */

import type { Aula, Docente, Asignatura, TipoOcupacion, Escenario } from './types';

export const SYNC_VERSION = 2;
export const SYNC_FILE_NAME = 'data.json';
export const SYNC_DIR_NAME = '.contratiempo';

export interface SyncData {
  version: typeof SYNC_VERSION;
  lastModified: string; // ISO 8601 timestamp
  escenarioActivoId: string;
  aulas: Aula[];
  docentes: Docente[];
  asignaturas: Asignatura[];
  tiposOcupacion: TipoOcupacion[];
  escenarios: Escenario[];
}

export function createEmptySyncData(): SyncData {
  return {
    version: SYNC_VERSION,
    lastModified: new Date().toISOString(),
    escenarioActivoId: '',
    aulas: [],
    docentes: [],
    asignaturas: [],
    tiposOcupacion: [],
    escenarios: [],
  };
}

export function validateSyncData(data: unknown): data is SyncData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    d.version === SYNC_VERSION &&
    typeof d.lastModified === 'string' &&
    typeof d.escenarioActivoId === 'string' &&
    Array.isArray(d.aulas) &&
    Array.isArray(d.docentes) &&
    Array.isArray(d.asignaturas) &&
    Array.isArray(d.tiposOcupacion) &&
    Array.isArray(d.escenarios)
  );
}
