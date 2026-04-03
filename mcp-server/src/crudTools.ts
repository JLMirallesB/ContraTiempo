/**
 * 16 herramientas CRUD (4 x entidad: aulas, docentes, asignaturas, ocupaciones).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { readSyncData, writeSyncData } from './storage.js';

export function registerCrudTools(server: McpServer) {
  // === AULAS ===
  server.tool('listar_aulas', 'Lista todas las aulas', {}, async () => {
    const data = readSyncData();
    const text = data.aulas.length === 0
      ? 'No hay aulas registradas.'
      : data.aulas.map(a => `- ${a.nombre} (${a.codigo || 'sin código'}) | Sede: ${a.sede || '—'} | Piso: ${a.piso || '—'} | Cap: ${a.capacidad}`).join('\n');
    return { content: [{ type: 'text', text }] };
  });

  server.tool('crear_aula', 'Crea una nueva aula', {
    nombre: z.string().describe('Nombre del aula'),
    codigo: z.string().optional().describe('Código identificador'),
    sede: z.string().optional().describe('Sede'),
    piso: z.string().optional().describe('Piso'),
    capacidad: z.number().optional().describe('Capacidad máxima'),
    tipo: z.string().optional().describe('Tipo de aula'),
    atributos: z.string().optional().describe('Atributos separados por coma (ej: piano, pantalla)'),
  }, async (args) => {
    const data = readSyncData();
    const aula = {
      id: uuid(), nombre: args.nombre, codigo: args.codigo ?? '', sede: args.sede ?? '',
      piso: args.piso ?? '', capacidad: args.capacidad ?? 0, tipo: args.tipo ?? '',
      descripcion: '', atributos: (args.atributos ?? '').split(',').map(s => s.trim()).filter(Boolean),
      reservable: 'no' as const, gestionadaPor: '', observaciones: '', orden: data.aulas.length,
    };
    data.aulas.push(aula);
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Aula "${aula.nombre}" creada (id: ${aula.id})` }] };
  });

  server.tool('actualizar_aula', 'Actualiza una aula existente', {
    nombre_o_id: z.string().describe('Nombre o ID del aula a actualizar'),
    nuevo_nombre: z.string().optional(), sede: z.string().optional(), piso: z.string().optional(),
    capacidad: z.number().optional(), tipo: z.string().optional(),
  }, async (args) => {
    const data = readSyncData();
    const aula = data.aulas.find(a => a.id === args.nombre_o_id || a.nombre === args.nombre_o_id);
    if (!aula) return { content: [{ type: 'text', text: `Aula "${args.nombre_o_id}" no encontrada.` }] };
    if (args.nuevo_nombre) aula.nombre = args.nuevo_nombre;
    if (args.sede !== undefined) aula.sede = args.sede;
    if (args.piso !== undefined) aula.piso = args.piso;
    if (args.capacidad !== undefined) aula.capacidad = args.capacidad;
    if (args.tipo !== undefined) aula.tipo = args.tipo;
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Aula "${aula.nombre}" actualizada.` }] };
  });

  server.tool('eliminar_aula', 'Elimina una aula', {
    nombre_o_id: z.string().describe('Nombre o ID del aula a eliminar'),
  }, async (args) => {
    const data = readSyncData();
    const idx = data.aulas.findIndex(a => a.id === args.nombre_o_id || a.nombre === args.nombre_o_id);
    if (idx === -1) return { content: [{ type: 'text', text: `Aula "${args.nombre_o_id}" no encontrada.` }] };
    const removed = data.aulas.splice(idx, 1)[0];
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Aula "${removed.nombre}" eliminada.` }] };
  });

  // === DOCENTES ===
  server.tool('listar_docentes', 'Lista todos los docentes', {}, async () => {
    const data = readSyncData();
    const text = data.docentes.length === 0
      ? 'No hay docentes registrados.'
      : data.docentes.map(d => `- ${d.nombre} | ${d.especialidad} | ${d.horasContratadas}h/sem | ${d.departamento ?? '—'}`).join('\n');
    return { content: [{ type: 'text', text }] };
  });

  server.tool('crear_docente', 'Crea un nuevo docente', {
    nombre: z.string(), especialidad: z.string(), horas_contratadas: z.number(),
    departamento: z.string().optional(),
  }, async (args) => {
    const data = readSyncData();
    const docente = { id: uuid(), nombre: args.nombre, especialidad: args.especialidad, horasContratadas: args.horas_contratadas, departamento: args.departamento };
    data.docentes.push(docente);
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Docente "${docente.nombre}" creado.` }] };
  });

  server.tool('actualizar_docente', 'Actualiza un docente existente', {
    nombre_o_id: z.string(), nuevo_nombre: z.string().optional(), especialidad: z.string().optional(),
    horas_contratadas: z.number().optional(), departamento: z.string().optional(),
  }, async (args) => {
    const data = readSyncData();
    const d = data.docentes.find(d => d.id === args.nombre_o_id || d.nombre === args.nombre_o_id);
    if (!d) return { content: [{ type: 'text', text: `Docente "${args.nombre_o_id}" no encontrado.` }] };
    if (args.nuevo_nombre) d.nombre = args.nuevo_nombre;
    if (args.especialidad) d.especialidad = args.especialidad;
    if (args.horas_contratadas !== undefined) d.horasContratadas = args.horas_contratadas;
    if (args.departamento !== undefined) d.departamento = args.departamento;
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Docente "${d.nombre}" actualizado.` }] };
  });

  server.tool('eliminar_docente', 'Elimina un docente', {
    nombre_o_id: z.string(),
  }, async (args) => {
    const data = readSyncData();
    const idx = data.docentes.findIndex(d => d.id === args.nombre_o_id || d.nombre === args.nombre_o_id);
    if (idx === -1) return { content: [{ type: 'text', text: `Docente "${args.nombre_o_id}" no encontrado.` }] };
    const removed = data.docentes.splice(idx, 1)[0];
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Docente "${removed.nombre}" eliminado.` }] };
  });

  // === ASIGNATURAS ===
  server.tool('listar_asignaturas', 'Lista todas las asignaturas', {}, async () => {
    const data = readSyncData();
    const text = data.asignaturas.length === 0
      ? 'No hay asignaturas registradas.'
      : data.asignaturas.map(a => `- ${a.nombre} (${a.alias}) | Ratio: ${a.ratio} | ${a.turnosSemanales}x/sem | ${a.duracionTurno}min`).join('\n');
    return { content: [{ type: 'text', text }] };
  });

  server.tool('crear_asignatura', 'Crea una nueva asignatura', {
    nombre: z.string(), alias: z.string().optional(), ratio: z.number().default(1),
    turnos_semanales: z.number().min(1).max(3).default(1), duracion_turno: z.number().default(60),
    tipo: z.enum(['individual', 'colectiva']).optional(),
    atributos_requeridos: z.string().optional().describe('Separados por coma'),
  }, async (args) => {
    const data = readSyncData();
    const asig = {
      id: uuid(), nombre: args.nombre, alias: args.alias ?? args.nombre, ratio: args.ratio,
      turnosSemanales: args.turnos_semanales as 1 | 2 | 3, duracionTurno: args.duracion_turno,
      tipo: args.tipo, atributosRequeridos: (args.atributos_requeridos ?? '').split(',').map(s => s.trim()).filter(Boolean),
    };
    data.asignaturas.push(asig);
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Asignatura "${asig.nombre}" creada.` }] };
  });

  server.tool('actualizar_asignatura', 'Actualiza una asignatura', {
    nombre_o_id: z.string(), nuevo_nombre: z.string().optional(), alias: z.string().optional(),
    ratio: z.number().optional(), turnos_semanales: z.number().min(1).max(3).optional(),
    duracion_turno: z.number().optional(),
  }, async (args) => {
    const data = readSyncData();
    const a = data.asignaturas.find(a => a.id === args.nombre_o_id || a.nombre === args.nombre_o_id);
    if (!a) return { content: [{ type: 'text', text: `Asignatura "${args.nombre_o_id}" no encontrada.` }] };
    if (args.nuevo_nombre) a.nombre = args.nuevo_nombre;
    if (args.alias) a.alias = args.alias;
    if (args.ratio !== undefined) a.ratio = args.ratio;
    if (args.turnos_semanales !== undefined) a.turnosSemanales = args.turnos_semanales as 1 | 2 | 3;
    if (args.duracion_turno !== undefined) a.duracionTurno = args.duracion_turno;
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Asignatura "${a.nombre}" actualizada.` }] };
  });

  server.tool('eliminar_asignatura', 'Elimina una asignatura', { nombre_o_id: z.string() }, async (args) => {
    const data = readSyncData();
    const idx = data.asignaturas.findIndex(a => a.id === args.nombre_o_id || a.nombre === args.nombre_o_id);
    if (idx === -1) return { content: [{ type: 'text', text: `Asignatura "${args.nombre_o_id}" no encontrada.` }] };
    const removed = data.asignaturas.splice(idx, 1)[0];
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Asignatura "${removed.nombre}" eliminada.` }] };
  });

  // === OCUPACIONES ===
  server.tool('listar_ocupaciones', 'Lista todos los tipos de ocupación', {}, async () => {
    const data = readSyncData();
    const text = data.tiposOcupacion.length === 0
      ? 'No hay tipos de ocupación registrados.'
      : data.tiposOcupacion.map(o => `- ${o.nombre} | Aula: ${o.requiereAula ? 'Sí' : 'No'} | Lectiva: ${o.esLectiva ? 'Sí' : 'No'}`).join('\n');
    return { content: [{ type: 'text', text }] };
  });

  server.tool('crear_ocupacion', 'Crea un nuevo tipo de ocupación', {
    nombre: z.string(), requiere_aula: z.boolean().default(false), es_lectiva: z.boolean().default(false),
  }, async (args) => {
    const data = readSyncData();
    const ocu = { id: uuid(), nombre: args.nombre, requiereAula: args.requiere_aula, esLectiva: args.es_lectiva };
    data.tiposOcupacion.push(ocu);
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Ocupación "${ocu.nombre}" creada.` }] };
  });

  server.tool('actualizar_ocupacion', 'Actualiza un tipo de ocupación', {
    nombre_o_id: z.string(), nuevo_nombre: z.string().optional(),
    requiere_aula: z.boolean().optional(), es_lectiva: z.boolean().optional(),
  }, async (args) => {
    const data = readSyncData();
    const o = data.tiposOcupacion.find(o => o.id === args.nombre_o_id || o.nombre === args.nombre_o_id);
    if (!o) return { content: [{ type: 'text', text: `Ocupación "${args.nombre_o_id}" no encontrada.` }] };
    if (args.nuevo_nombre) o.nombre = args.nuevo_nombre;
    if (args.requiere_aula !== undefined) o.requiereAula = args.requiere_aula;
    if (args.es_lectiva !== undefined) o.esLectiva = args.es_lectiva;
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Ocupación "${o.nombre}" actualizada.` }] };
  });

  server.tool('eliminar_ocupacion', 'Elimina un tipo de ocupación', { nombre_o_id: z.string() }, async (args) => {
    const data = readSyncData();
    const idx = data.tiposOcupacion.findIndex(o => o.id === args.nombre_o_id || o.nombre === args.nombre_o_id);
    if (idx === -1) return { content: [{ type: 'text', text: `Ocupación "${args.nombre_o_id}" no encontrada.` }] };
    const removed = data.tiposOcupacion.splice(idx, 1)[0];
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Ocupación "${removed.nombre}" eliminada.` }] };
  });
}
