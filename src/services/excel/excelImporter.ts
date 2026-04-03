import * as XLSX from 'xlsx';
import { v4 as uuid } from 'uuid';
import type {
  Aula,
  Docente,
  Asignatura,
  TipoOcupacion,
  Escenario,
  Franja,
  ReservableAula,
  ConfiguracionHorario,
} from '@/types';

const DEFAULT_CONFIG: ConfiguracionHorario = {
  horaInicio: '08:00',
  horaFin: '22:00',
  franjasDeshabilitadas: [],
  franjasOcultas: [],
};

function readFile(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      resolve(XLSX.read(data, { type: 'array' }));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function sheetToJson<T>(wb: XLSX.WorkBook, sheetName: string): T[] {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<T>(sheet);
}

// === IMPORT INDIVIDUAL ===

export async function importarAulas(file: File): Promise<Aula[]> {
  const wb = await readFile(file);
  const rows = sheetToJson<Record<string, unknown>>(wb, 'Aulas');
  return rows.map((r, i) => ({
    id: uuid(),
    codigo: String(r['Código'] ?? ''),
    nombre: String(r['Nombre'] ?? ''),
    descripcion: String(r['Descripción'] ?? ''),
    tipo: String(r['Tipo'] ?? ''),
    reservable: parseReservable(String(r['Reservable'] ?? 'No')),
    gestionadaPor: String(r['Gestionada por'] ?? ''),
    observaciones: String(r['Observaciones'] ?? ''),
    sede: String(r['Sede'] ?? ''),
    piso: String(r['Piso'] ?? ''),
    capacidad: Number(r['Capacidad'] ?? 0),
    atributos: String(r['Atributos'] ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    orden: i,
  }));
}

export async function importarDocentes(file: File): Promise<Docente[]> {
  const wb = await readFile(file);
  const rows = sheetToJson<Record<string, unknown>>(wb, 'Docentes');
  return rows.map((r) => ({
    id: uuid(),
    nombre: String(r['Nombre'] ?? ''),
    especialidad: String(r['Especialidad'] ?? ''),
    horasContratadas: Number(r['Horas/semana'] ?? 0),
    departamento: String(r['Departamento'] ?? '') || undefined,
  }));
}

export async function importarAsignaturas(file: File): Promise<Asignatura[]> {
  const wb = await readFile(file);
  const rows = sheetToJson<Record<string, unknown>>(wb, 'Asignaturas');
  return rows.map((r) => ({
    id: uuid(),
    nombre: String(r['Nombre'] ?? ''),
    alias: String(r['Alias'] ?? ''),
    ratio: Number(r['Ratio'] ?? 1),
    turnosSemanales: Math.min(3, Math.max(1, Number(r['Turnos'] ?? 1))) as 1 | 2 | 3,
    duracionTurno: Number(r['Duración'] ?? 60),
    tipo: (String(r['Tipo'] ?? '') || undefined) as 'individual' | 'colectiva' | undefined,
    atributosRequeridos: String(r['Requisitos Aula'] ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  }));
}

export async function importarOcupaciones(file: File): Promise<TipoOcupacion[]> {
  const wb = await readFile(file);
  const rows = sheetToJson<Record<string, unknown>>(wb, 'Ocupaciones');
  return rows.map((r) => ({
    id: uuid(),
    nombre: String(r['Nombre'] ?? ''),
    requiereAula: parseBool(r['Requiere Aula']),
    esLectiva: parseBool(r['Es Lectiva']),
  }));
}

// === IMPORT BACKUP TOTAL ===

export interface BackupData {
  aulas: Aula[];
  docentes: Docente[];
  asignaturas: Asignatura[];
  tiposOcupacion: TipoOcupacion[];
  escenarios: Escenario[];
}

export async function importarBackupTotal(file: File): Promise<BackupData> {
  const wb = await readFile(file);

  // Aulas
  const aulasRaw = sheetToJson<Record<string, unknown>>(wb, 'Aulas');
  const aulas: Aula[] = aulasRaw.map((r, i) => ({
    id: String(r['id'] ?? uuid()),
    codigo: String(r['codigo'] ?? ''),
    nombre: String(r['nombre'] ?? ''),
    tipo: String(r['tipo'] ?? ''),
    capacidad: Number(r['capacidad'] ?? 0),
    descripcion: String(r['descripcion'] ?? ''),
    atributos: String(r['atributos'] ?? '').split('|').filter(Boolean),
    sede: String(r['sede'] ?? ''),
    piso: String(r['piso'] ?? ''),
    reservable: (String(r['reservable'] ?? 'no')) as ReservableAula,
    gestionadaPor: String(r['gestionadaPor'] ?? ''),
    observaciones: String(r['observaciones'] ?? ''),
    orden: Number(r['orden'] ?? i),
  }));

  // Docentes
  const docentesRaw = sheetToJson<Record<string, unknown>>(wb, 'Docentes');
  const docentes: Docente[] = docentesRaw.map((r) => ({
    id: String(r['id'] ?? uuid()),
    nombre: String(r['nombre'] ?? ''),
    especialidad: String(r['especialidad'] ?? ''),
    horasContratadas: Number(r['horasContratadas'] ?? 0),
    departamento: String(r['departamento'] ?? '') || undefined,
    disponibilidad: r['disponibilidad'] ? JSON.parse(String(r['disponibilidad'])) : undefined,
  }));

  // Asignaturas
  const asigRaw = sheetToJson<Record<string, unknown>>(wb, 'Asignaturas');
  const asignaturas: Asignatura[] = asigRaw.map((r) => ({
    id: String(r['id'] ?? uuid()),
    nombre: String(r['nombre'] ?? ''),
    alias: String(r['alias'] ?? ''),
    ratio: Number(r['ratio'] ?? 1),
    turnosSemanales: Number(r['turnosSemanales'] ?? 1) as 1 | 2 | 3,
    duracionTurno: Number(r['duracionTurno'] ?? 60),
    tipo: (String(r['tipo'] ?? '') || undefined) as 'individual' | 'colectiva' | undefined,
    atributosRequeridos: String(r['atributosRequeridos'] ?? '').split('|').filter(Boolean),
  }));

  // Ocupaciones
  const ocuRaw = sheetToJson<Record<string, unknown>>(wb, 'Ocupaciones');
  const tiposOcupacion: TipoOcupacion[] = ocuRaw.map((r) => ({
    id: String(r['id'] ?? uuid()),
    nombre: String(r['nombre'] ?? ''),
    requiereAula: parseBool(r['requiereAula']),
    esLectiva: parseBool(r['esLectiva']),
  }));

  // Escenarios
  const escMeta = sheetToJson<Record<string, unknown>>(wb, '_Escenarios');
  const escenarios: Escenario[] = escMeta.map((meta) => {
    const hojaName = String(meta['hojaFranjas'] ?? '');
    const franjasRaw = sheetToJson<Record<string, unknown>>(wb, hojaName);
    const franjas: Franja[] = franjasRaw.map((r) => {
      const base = {
        id: String(r['id'] ?? uuid()),
        docenteId: String(r['docenteId'] ?? ''),
        dia: String(r['dia'] ?? 'lunes') as Franja['dia'],
        horaInicio: String(r['horaInicio'] ?? '08:00'),
        horaFin: String(r['horaFin'] ?? '09:00'),
        aulaId: String(r['aulaId'] ?? ''),
      };
      if (String(r['tipo']) === 'clase') {
        return { ...base, tipo: 'clase' as const, asignaturaId: String(r['asignaturaId'] ?? '') };
      }
      return {
        ...base,
        tipo: 'ocupacion' as const,
        tipoOcupacionId: String(r['tipoOcupacionId'] ?? ''),
        descripcion: String(r['descripcion'] ?? '') || undefined,
      };
    });

    let config = DEFAULT_CONFIG;
    try {
      if (meta['configJSON']) config = JSON.parse(String(meta['configJSON']));
    } catch { /* use default */ }

    return {
      id: String(meta['id'] ?? uuid()),
      nombre: String(meta['nombre'] ?? 'Importado'),
      descripcion: String(meta['descripcion'] ?? '') || undefined,
      franjas,
      configuracion: config,
      creadoEn: String(meta['creadoEn'] ?? new Date().toISOString()),
      modificadoEn: new Date().toISOString(),
    };
  });

  return { aulas, docentes, asignaturas, tiposOcupacion, escenarios };
}

// === HELPERS ===

function parseBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  const s = String(val ?? '').toLowerCase();
  return s === 'sí' || s === 'si' || s === 'true' || s === '1' || s === 'yes';
}

function parseReservable(val: string): ReservableAula {
  const lower = val.toLowerCase();
  if (lower.includes('directa')) return 'directa';
  if (lower.includes('aprobación') || lower.includes('aprobacion')) return 'con-aprobacion';
  return 'no';
}
