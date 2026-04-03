// === TIPOS BASE ===

export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';

export const DIAS_SEMANA: DiaSemana[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

export const DIAS_SEMANA_LABEL: Record<DiaSemana, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
};

// === ENTIDADES MAESTRAS ===

export type ReservableAula = 'no' | 'directa' | 'con-aprobacion';

export interface Aula {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  descripcion: string;
  atributos: string[];
  sede: string;
  piso: string;
  reservable: ReservableAula;
  gestionadaPor: string;
  observaciones: string;
  orden: number;
}

export interface Restriccion {
  dia: DiaSemana;
  inicio: string; // "HH:mm"
  fin: string;    // "HH:mm"
  motivo?: string;
}

export interface Disponibilidad {
  restricciones: Restriccion[];
}

export interface Docente {
  id: string;
  nombre: string;
  especialidad: string;
  horasContratadas: number; // Horas semanales totales
  disponibilidad?: Disponibilidad;
  departamento?: string;
}

export interface Asignatura {
  id: string;
  nombre: string;
  alias: string;
  ratio: number;
  turnosSemanales: 1 | 2 | 3;
  duracionTurno: number; // En minutos: 30, 60, 90, 120, 150, 180
  atributosRequeridos: string[];
  tipo?: 'individual' | 'colectiva';
}

export interface TipoOcupacion {
  id: string;
  nombre: string;
  requiereAula: boolean;
  esLectiva: boolean;
}

// === FRANJAS HORARIAS ===

export interface FranjaBase {
  id: string;
  docenteId: string;
  dia: DiaSemana;
  horaInicio: string; // "HH:mm"
  horaFin: string;    // "HH:mm"
}

export interface FranjaClase extends FranjaBase {
  tipo: 'clase';
  asignaturaId: string;
  aulaId: string;
  turnoNumero?: number;
  grupoId?: string;
}

export interface FranjaOcupacion extends FranjaBase {
  tipo: 'ocupacion';
  tipoOcupacionId: string;
  aulaId?: string;
  descripcion?: string;
}

export type Franja = FranjaClase | FranjaOcupacion;

// === CONFIGURACION ===

export interface RangoHorario {
  dia: DiaSemana;
  inicio: string;
  fin: string;
}

export interface ConfiguracionHorario {
  horaInicio: string;  // "08:00"
  horaFin: string;     // "22:00"
  franjasDeshabilitadas: RangoHorario[];
  franjasOcultas: RangoHorario[];
}

// === ESCENARIOS ===

export interface Escenario {
  id: string;
  nombre: string;
  descripcion?: string;
  franjas: Franja[];
  configuracion: ConfiguracionHorario;
  creadoEn: string;
  modificadoEn: string;
}

// === VISTAS Y UI ===

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

// === CUADRICULA ===

export type ModoVistaCuadricula = 'dias-aulas' | 'aulas-dias';
export type GranularidadVista = 30 | 60;

export const DIAS_SEMANA_ABREV: Record<DiaSemana, string> = {
  lunes: 'L',
  martes: 'M',
  miercoles: 'X',
  jueves: 'J',
  viernes: 'V',
};

export interface GridColumn {
  id: string;
  aulaId: string;
  dia: DiaSemana;
  aulaNombre: string;
  diaLabel: string;
}

// === VALIDACIONES ===

export type SeveridadValidacion = 'error' | 'aviso';

export interface ResultadoValidacion {
  id: string;
  severidad: SeveridadValidacion;
  mensaje: string;
  entidadTipo: 'aula' | 'docente' | 'asignatura' | 'franja';
  entidadId: string;
  franjaIds?: string[];
}

// === ESTADO GLOBAL ===

export interface DatosMaestros {
  aulas: Aula[];
  docentes: Docente[];
  asignaturas: Asignatura[];
  tiposOcupacion: TipoOcupacion[];
}

export interface AppState extends DatosMaestros {
  escenarios: Escenario[];
  escenarioActivoId: string;
  vistaActual: VistaId;
  filtros: Filtros;
}

// === CONFIGURACION POR DEFECTO ===

export const CONFIG_POR_DEFECTO: ConfiguracionHorario = {
  horaInicio: '08:00',
  horaFin: '22:00',
  franjasDeshabilitadas: [],
  franjasOcultas: [],
};

export const DURACIONES_DISPONIBLES = [30, 60, 90, 120, 150, 180] as const;
