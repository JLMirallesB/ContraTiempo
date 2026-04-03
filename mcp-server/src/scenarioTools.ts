import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { readSyncData, writeSyncData } from './storage.js';
import { DIAS_SEMANA_LABEL, CONFIG_POR_DEFECTO } from '../../shared/types.js';
import type { DiaSemana } from '../../shared/types.js';

export function registerScenarioTools(server: McpServer) {
  server.tool('listar_escenarios', 'Lista todos los escenarios de horario', {}, async () => {
    const data = readSyncData();
    const activo = data.escenarioActivoId;
    const text = data.escenarios.map(e =>
      `- ${e.nombre} (${e.franjas.length} franjas)${e.id === activo ? ' [ACTIVO]' : ''}`
    ).join('\n') || 'No hay escenarios.';
    return { content: [{ type: 'text', text }] };
  });

  server.tool('crear_escenario', 'Crea un nuevo escenario vacío', {
    nombre: z.string(), descripcion: z.string().optional(),
  }, async (args) => {
    const data = readSyncData();
    const id = uuid();
    data.escenarios.push({
      id, nombre: args.nombre, descripcion: args.descripcion,
      franjas: [], configuracion: CONFIG_POR_DEFECTO,
      creadoEn: new Date().toISOString(), modificadoEn: new Date().toISOString(),
    });
    data.escenarioActivoId = id;
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Escenario "${args.nombre}" creado y activado.` }] };
  });

  server.tool('duplicar_escenario', 'Duplica un escenario existente', {
    nombre_o_id: z.string(), nuevo_nombre: z.string(),
  }, async (args) => {
    const data = readSyncData();
    const original = data.escenarios.find(e => e.id === args.nombre_o_id || e.nombre === args.nombre_o_id);
    if (!original) return { content: [{ type: 'text', text: `Escenario "${args.nombre_o_id}" no encontrado.` }] };
    const id = uuid();
    data.escenarios.push({
      ...JSON.parse(JSON.stringify(original)), id, nombre: args.nuevo_nombre,
      creadoEn: new Date().toISOString(), modificadoEn: new Date().toISOString(),
    });
    data.escenarioActivoId = id;
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Escenario duplicado como "${args.nuevo_nombre}".` }] };
  });

  server.tool('activar_escenario', 'Cambia el escenario activo', {
    nombre_o_id: z.string(),
  }, async (args) => {
    const data = readSyncData();
    const esc = data.escenarios.find(e => e.id === args.nombre_o_id || e.nombre === args.nombre_o_id);
    if (!esc) return { content: [{ type: 'text', text: `Escenario "${args.nombre_o_id}" no encontrado.` }] };
    data.escenarioActivoId = esc.id;
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Escenario "${esc.nombre}" activado.` }] };
  });

  // === FRANJAS ===
  server.tool('listar_franjas', 'Lista franjas del escenario activo con filtros opcionales', {
    dia: z.enum(['lunes', 'martes', 'miercoles', 'jueves', 'viernes']).optional(),
    docente: z.string().optional().describe('Nombre o ID del docente'),
    aula: z.string().optional().describe('Nombre o ID del aula'),
  }, async (args) => {
    const data = readSyncData();
    const esc = data.escenarios.find(e => e.id === data.escenarioActivoId);
    if (!esc) return { content: [{ type: 'text', text: 'No hay escenario activo.' }] };

    let franjas = esc.franjas;
    if (args.dia) franjas = franjas.filter(f => f.dia === args.dia);
    if (args.docente) {
      const doc = data.docentes.find(d => d.id === args.docente || d.nombre === args.docente);
      if (doc) franjas = franjas.filter(f => f.docenteId === doc.id);
    }
    if (args.aula) {
      const aula = data.aulas.find(a => a.id === args.aula || a.nombre === args.aula);
      if (aula) franjas = franjas.filter(f => f.aulaId === aula.id);
    }

    const text = franjas.map(f => {
      const doc = data.docentes.find(d => d.id === f.docenteId)?.nombre ?? '?';
      const aula = data.aulas.find(a => a.id === f.aulaId)?.nombre ?? '—';
      const dia = DIAS_SEMANA_LABEL[f.dia];
      if (f.tipo === 'clase') {
        const asig = data.asignaturas.find(a => a.id === f.asignaturaId)?.nombre ?? '?';
        return `- ${dia} ${f.horaInicio}-${f.horaFin} | ${asig} | ${doc} | ${aula}`;
      }
      const tipo = data.tiposOcupacion.find(t => t.id === f.tipoOcupacionId)?.nombre ?? '?';
      return `- ${dia} ${f.horaInicio}-${f.horaFin} | [Ocup] ${tipo} | ${doc} | ${aula}`;
    }).join('\n') || 'No hay franjas.';

    return { content: [{ type: 'text', text: `${franjas.length} franjas:\n${text}` }] };
  });

  server.tool('crear_franja_clase', 'Crea una franja de clase en el escenario activo', {
    asignatura: z.string().describe('Nombre o ID'), docente: z.string().describe('Nombre o ID'),
    aula: z.string().describe('Nombre o ID'),
    dia: z.enum(['lunes', 'martes', 'miercoles', 'jueves', 'viernes']),
    hora_inicio: z.string().describe('HH:mm'), duracion: z.number().describe('Minutos (30, 60, 90, 120, 150, 180)'),
  }, async (args) => {
    const data = readSyncData();
    const esc = data.escenarios.find(e => e.id === data.escenarioActivoId);
    if (!esc) return { content: [{ type: 'text', text: 'No hay escenario activo.' }] };

    const asig = data.asignaturas.find(a => a.id === args.asignatura || a.nombre === args.asignatura);
    const doc = data.docentes.find(d => d.id === args.docente || d.nombre === args.docente);
    const aula = data.aulas.find(a => a.id === args.aula || a.nombre === args.aula);
    if (!asig) return { content: [{ type: 'text', text: `Asignatura "${args.asignatura}" no encontrada.` }] };
    if (!doc) return { content: [{ type: 'text', text: `Docente "${args.docente}" no encontrado.` }] };
    if (!aula) return { content: [{ type: 'text', text: `Aula "${args.aula}" no encontrada.` }] };

    const [h, m] = args.hora_inicio.split(':').map(Number);
    const finMin = h * 60 + m + args.duracion;
    const horaFin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;

    const franja = {
      id: uuid(), tipo: 'clase' as const, asignaturaId: asig.id, docenteId: doc.id,
      aulaId: aula.id, dia: args.dia as DiaSemana, horaInicio: args.hora_inicio, horaFin,
    };
    esc.franjas.push(franja);
    esc.modificadoEn = new Date().toISOString();
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Clase creada: ${asig.nombre} con ${doc.nombre} en ${aula.nombre}, ${DIAS_SEMANA_LABEL[args.dia]} ${args.hora_inicio}-${horaFin}` }] };
  });

  server.tool('crear_franja_ocupacion', 'Crea una franja de ocupación en el escenario activo', {
    tipo_ocupacion: z.string().describe('Nombre o ID'), docente: z.string().describe('Nombre o ID'),
    aula: z.string().optional().describe('Nombre o ID (si requiere aula)'),
    dia: z.enum(['lunes', 'martes', 'miercoles', 'jueves', 'viernes']),
    hora_inicio: z.string(), duracion: z.number(), descripcion: z.string().optional(),
  }, async (args) => {
    const data = readSyncData();
    const esc = data.escenarios.find(e => e.id === data.escenarioActivoId);
    if (!esc) return { content: [{ type: 'text', text: 'No hay escenario activo.' }] };

    const tipo = data.tiposOcupacion.find(t => t.id === args.tipo_ocupacion || t.nombre === args.tipo_ocupacion);
    const doc = data.docentes.find(d => d.id === args.docente || d.nombre === args.docente);
    if (!tipo) return { content: [{ type: 'text', text: `Tipo ocupación "${args.tipo_ocupacion}" no encontrado.` }] };
    if (!doc) return { content: [{ type: 'text', text: `Docente "${args.docente}" no encontrado.` }] };

    let aulaId: string | undefined;
    if (args.aula) {
      const aula = data.aulas.find(a => a.id === args.aula || a.nombre === args.aula);
      if (!aula) return { content: [{ type: 'text', text: `Aula "${args.aula}" no encontrada.` }] };
      aulaId = aula.id;
    }

    const [h, m] = args.hora_inicio.split(':').map(Number);
    const finMin = h * 60 + m + args.duracion;
    const horaFin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;

    const franja = {
      id: uuid(), tipo: 'ocupacion' as const, tipoOcupacionId: tipo.id, docenteId: doc.id,
      aulaId, dia: args.dia as DiaSemana, horaInicio: args.hora_inicio, horaFin,
      descripcion: args.descripcion,
    };
    esc.franjas.push(franja);
    esc.modificadoEn = new Date().toISOString();
    writeSyncData(data);
    return { content: [{ type: 'text', text: `Ocupación creada: ${tipo.nombre} con ${doc.nombre}, ${DIAS_SEMANA_LABEL[args.dia]} ${args.hora_inicio}-${horaFin}` }] };
  });

  server.tool('eliminar_franja', 'Elimina una franja del escenario activo', {
    franja_id: z.string(),
  }, async (args) => {
    const data = readSyncData();
    const esc = data.escenarios.find(e => e.id === data.escenarioActivoId);
    if (!esc) return { content: [{ type: 'text', text: 'No hay escenario activo.' }] };
    const idx = esc.franjas.findIndex(f => f.id === args.franja_id);
    if (idx === -1) return { content: [{ type: 'text', text: 'Franja no encontrada.' }] };
    esc.franjas.splice(idx, 1);
    esc.modificadoEn = new Date().toISOString();
    writeSyncData(data);
    return { content: [{ type: 'text', text: 'Franja eliminada.' }] };
  });
}
