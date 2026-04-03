import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Aula,
  Docente,
  Asignatura,
  TipoOcupacion,
  Escenario,
  Franja,
  FranjaClase,
  FranjaOcupacion,
  VistaId,
  Filtros,
  ConfiguracionHorario,
  ModoVistaCuadricula,
  GranularidadVista,
  DiaSemana,
} from '@/types';
import { v4 as uuid } from 'uuid';

// Re-export the default config value
const DEFAULT_CONFIG: ConfiguracionHorario = {
  horaInicio: '08:00',
  horaFin: '22:00',
  franjasDeshabilitadas: [],
  franjasOcultas: [],
};

interface AppActions {
  // Aulas
  addAula: (aula: Omit<Aula, 'id' | 'orden'>) => void;
  updateAula: (id: string, data: Partial<Omit<Aula, 'id'>>) => void;
  removeAula: (id: string) => void;

  // Docentes
  addDocente: (docente: Omit<Docente, 'id'>) => void;
  updateDocente: (id: string, data: Partial<Omit<Docente, 'id'>>) => void;
  removeDocente: (id: string) => void;

  // Asignaturas
  addAsignatura: (asignatura: Omit<Asignatura, 'id'>) => void;
  updateAsignatura: (id: string, data: Partial<Omit<Asignatura, 'id'>>) => void;
  removeAsignatura: (id: string) => void;

  // Tipos de Ocupacion
  addTipoOcupacion: (tipo: Omit<TipoOcupacion, 'id'>) => void;
  updateTipoOcupacion: (id: string, data: Partial<Omit<TipoOcupacion, 'id'>>) => void;
  removeTipoOcupacion: (id: string) => void;

  // Escenarios
  addEscenario: (nombre: string, descripcion?: string) => void;
  updateEscenario: (id: string, data: Partial<Omit<Escenario, 'id' | 'creadoEn'>>) => void;
  removeEscenario: (id: string) => void;
  duplicarEscenario: (id: string, nuevoNombre: string) => void;
  setEscenarioActivo: (id: string) => void;

  // Franjas (en el escenario activo)
  addFranja: (franja: Omit<FranjaClase, 'id'> | Omit<FranjaOcupacion, 'id'>) => void;
  updateFranja: (id: string, data: Record<string, unknown>) => void;
  removeFranja: (id: string) => void;

  // UI
  setVista: (vista: VistaId) => void;
  setFiltros: (filtros: Partial<Filtros>) => void;
  clearFiltros: () => void;
  setModoVista: (modo: ModoVistaCuadricula) => void;
  setGranularidad: (g: GranularidadVista) => void;
  setDiaSeleccionado: (dia: DiaSemana) => void;
  setPanelFranjaAbierto: (abierto: boolean) => void;
  setFranjaEditandoId: (id: string | null) => void;
  setPanelPrellenado: (data: { dia?: DiaSemana; horaInicio?: string; aulaId?: string } | null) => void;
}

interface AppState {
  // Datos maestros
  aulas: Aula[];
  docentes: Docente[];
  asignaturas: Asignatura[];
  tiposOcupacion: TipoOcupacion[];

  // Escenarios
  escenarios: Escenario[];
  escenarioActivoId: string;

  // UI
  vistaActual: VistaId;
  filtros: Filtros;
  modoVistaCuadricula: ModoVistaCuadricula;
  granularidadVista: GranularidadVista;
  diaSeleccionado: DiaSemana;
  panelFranjaAbierto: boolean;
  franjaEditandoId: string | null;
  panelPrellenado: { dia?: DiaSemana; horaInicio?: string; aulaId?: string } | null;
}

type Store = AppState & AppActions;

const ESCENARIO_INICIAL_ID = 'escenario-default';

const initialState: AppState = {
  aulas: [],
  docentes: [],
  asignaturas: [],
  tiposOcupacion: [],
  escenarios: [
    {
      id: ESCENARIO_INICIAL_ID,
      nombre: 'Horario Principal',
      franjas: [],
      configuracion: DEFAULT_CONFIG,
      creadoEn: new Date().toISOString(),
      modificadoEn: new Date().toISOString(),
    },
  ],
  escenarioActivoId: ESCENARIO_INICIAL_ID,
  vistaActual: 'general',
  filtros: {},
  modoVistaCuadricula: 'dias-aulas',
  granularidadVista: 30,
  diaSeleccionado: 'lunes',
  panelFranjaAbierto: false,
  franjaEditandoId: null,
  panelPrellenado: null,
};

export const useAppStore = create<Store>()(
  persist(
    immer((set) => ({
      ...initialState,

      // === AULAS ===
      addAula: (aula) =>
        set((state) => {
          state.aulas.push({ ...aula, id: uuid(), orden: state.aulas.length });
        }),
      updateAula: (id, data) =>
        set((state) => {
          const idx = state.aulas.findIndex((a) => a.id === id);
          if (idx !== -1) Object.assign(state.aulas[idx], data);
        }),
      removeAula: (id) =>
        set((state) => {
          state.aulas = state.aulas.filter((a) => a.id !== id);
        }),

      // === DOCENTES ===
      addDocente: (docente) =>
        set((state) => {
          state.docentes.push({ ...docente, id: uuid() });
        }),
      updateDocente: (id, data) =>
        set((state) => {
          const idx = state.docentes.findIndex((d) => d.id === id);
          if (idx !== -1) Object.assign(state.docentes[idx], data);
        }),
      removeDocente: (id) =>
        set((state) => {
          state.docentes = state.docentes.filter((d) => d.id !== id);
        }),

      // === ASIGNATURAS ===
      addAsignatura: (asignatura) =>
        set((state) => {
          state.asignaturas.push({ ...asignatura, id: uuid() });
        }),
      updateAsignatura: (id, data) =>
        set((state) => {
          const idx = state.asignaturas.findIndex((a) => a.id === id);
          if (idx !== -1) Object.assign(state.asignaturas[idx], data);
        }),
      removeAsignatura: (id) =>
        set((state) => {
          state.asignaturas = state.asignaturas.filter((a) => a.id !== id);
        }),

      // === TIPOS DE OCUPACION ===
      addTipoOcupacion: (tipo) =>
        set((state) => {
          state.tiposOcupacion.push({ ...tipo, id: uuid() });
        }),
      updateTipoOcupacion: (id, data) =>
        set((state) => {
          const idx = state.tiposOcupacion.findIndex((t) => t.id === id);
          if (idx !== -1) Object.assign(state.tiposOcupacion[idx], data);
        }),
      removeTipoOcupacion: (id) =>
        set((state) => {
          state.tiposOcupacion = state.tiposOcupacion.filter((t) => t.id !== id);
        }),

      // === ESCENARIOS ===
      addEscenario: (nombre, descripcion) =>
        set((state) => {
          const id = uuid();
          state.escenarios.push({
            id,
            nombre,
            descripcion,
            franjas: [],
            configuracion: DEFAULT_CONFIG,
            creadoEn: new Date().toISOString(),
            modificadoEn: new Date().toISOString(),
          });
          state.escenarioActivoId = id;
        }),
      updateEscenario: (id, data) =>
        set((state) => {
          const idx = state.escenarios.findIndex((e) => e.id === id);
          if (idx !== -1) {
            Object.assign(state.escenarios[idx], data);
            state.escenarios[idx].modificadoEn = new Date().toISOString();
          }
        }),
      removeEscenario: (id) =>
        set((state) => {
          if (state.escenarios.length <= 1) return;
          state.escenarios = state.escenarios.filter((e) => e.id !== id);
          if (state.escenarioActivoId === id) {
            state.escenarioActivoId = state.escenarios[0].id;
          }
        }),
      duplicarEscenario: (id, nuevoNombre) =>
        set((state) => {
          const original = state.escenarios.find((e) => e.id === id);
          if (!original) return;
          const nuevoId = uuid();
          state.escenarios.push({
            ...JSON.parse(JSON.stringify(original)),
            id: nuevoId,
            nombre: nuevoNombre,
            creadoEn: new Date().toISOString(),
            modificadoEn: new Date().toISOString(),
          });
          state.escenarioActivoId = nuevoId;
        }),
      setEscenarioActivo: (id) =>
        set((state) => {
          if (state.escenarios.some((e) => e.id === id)) {
            state.escenarioActivoId = id;
          }
        }),

      // === FRANJAS ===
      addFranja: (franja) =>
        set((state) => {
          const escenario = state.escenarios.find(
            (e) => e.id === state.escenarioActivoId,
          );
          if (escenario) {
            escenario.franjas.push({ ...franja, id: uuid() } as Franja);
            escenario.modificadoEn = new Date().toISOString();
          }
        }),
      updateFranja: (id, data) =>
        set((state) => {
          const escenario = state.escenarios.find(
            (e) => e.id === state.escenarioActivoId,
          );
          if (!escenario) return;
          const idx = escenario.franjas.findIndex((f) => f.id === id);
          if (idx !== -1) {
            Object.assign(escenario.franjas[idx], data);
            escenario.modificadoEn = new Date().toISOString();
          }
        }),
      removeFranja: (id) =>
        set((state) => {
          const escenario = state.escenarios.find(
            (e) => e.id === state.escenarioActivoId,
          );
          if (escenario) {
            escenario.franjas = escenario.franjas.filter((f) => f.id !== id);
            escenario.modificadoEn = new Date().toISOString();
          }
        }),

      // === UI ===
      setVista: (vista) =>
        set((state) => {
          state.vistaActual = vista;
        }),
      setFiltros: (filtros) =>
        set((state) => {
          Object.assign(state.filtros, filtros);
        }),
      clearFiltros: () =>
        set((state) => {
          state.filtros = {};
        }),
      setModoVista: (modo) =>
        set((state) => {
          state.modoVistaCuadricula = modo;
        }),
      setGranularidad: (g) =>
        set((state) => {
          state.granularidadVista = g;
        }),
      setDiaSeleccionado: (dia) =>
        set((state) => {
          state.diaSeleccionado = dia;
        }),
      setPanelFranjaAbierto: (abierto) =>
        set((state) => {
          state.panelFranjaAbierto = abierto;
          if (!abierto) {
            state.franjaEditandoId = null;
            state.panelPrellenado = null;
          }
        }),
      setFranjaEditandoId: (id) =>
        set((state) => {
          state.franjaEditandoId = id;
          state.panelFranjaAbierto = id !== null;
        }),
      setPanelPrellenado: (data) =>
        set((state) => {
          state.panelPrellenado = data;
          state.franjaEditandoId = null;
          state.panelFranjaAbierto = data !== null;
        }),
    })),
    {
      name: 'contratiempo-storage',
      version: 1,
    },
  ),
);

// Selectores derivados
export const useEscenarioActivo = () =>
  useAppStore((state) =>
    state.escenarios.find((e) => e.id === state.escenarioActivoId),
  );

export const useFranjasActivas = () =>
  useAppStore(
    (state) =>
      state.escenarios.find((e) => e.id === state.escenarioActivoId)?.franjas ?? [],
  );
