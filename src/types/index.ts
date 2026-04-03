// Re-exportar todos los tipos de dominio compartidos
export * from '../../shared/types';

// === TIPOS SOLO-UI (no necesarios para MCP Server) ===

export type VistaId =
  | 'general'
  | 'aula'
  | 'docente'
  | 'asignatura'
  | 'validaciones'
  | 'herramientas'
  | 'config';

export interface Filtros {
  aulaId?: string;
  docenteId?: string;
  asignaturaId?: string;
  sede?: string;
  piso?: string;
  aulasSeleccionadas?: string[];
}

export type ModoVistaCuadricula = 'dias-aulas' | 'aulas-dias';
export type GranularidadVista = 30 | 60;

import type { DiaSemana, DatosMaestros, Escenario } from '../../shared/types';

export interface GridColumn {
  id: string;
  aulaId: string;
  dia: DiaSemana;
  aulaNombre: string;
  diaLabel: string;
}

export interface AppState extends DatosMaestros {
  escenarios: Escenario[];
  escenarioActivoId: string;
  vistaActual: VistaId;
  filtros: Filtros;
}
