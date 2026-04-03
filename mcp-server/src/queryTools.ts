import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readSyncData } from './storage.js';
import { DIAS_SEMANA, DIAS_SEMANA_LABEL, CONFIG_POR_DEFECTO } from '../../shared/types.js';
import type { Franja, DiaSemana } from '../../shared/types.js';
import { seSolapan, duracionEnHoras, horaAMinutos, minutosAHora } from '../../shared/timeUtils.js';

export function registerQueryTools(server: McpServer) {
  server.tool('ver_horario_docente', 'Muestra el horario semanal de un docente', {
    docente: z.string().describe('Nombre o ID'),
  }, async (args) => {
    const data = readSyncData();
    const doc = data.docentes.find(d => d.id === args.docente || d.nombre === args.docente);
    if (!doc) return { content: [{ type: 'text', text: `Docente "${args.docente}" no encontrado.` }] };

    const esc = data.escenarios.find(e => e.id === data.escenarioActivoId);
    const franjas = esc?.franjas.filter(f => f.docenteId === doc.id) ?? [];

    const lines: string[] = [`Horario de ${doc.nombre} (${doc.especialidad}, ${doc.horasContratadas}h/sem):\n`];
    for (const dia of DIAS_SEMANA) {
      const del_dia = franjas.filter(f => f.dia === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
      if (del_dia.length === 0) continue;
      lines.push(`${DIAS_SEMANA_LABEL[dia]}:`);
      for (const f of del_dia) {
        const aula = data.aulas.find(a => a.id === f.aulaId)?.nombre ?? '—';
        if (f.tipo === 'clase') {
          const asig = data.asignaturas.find(a => a.id === f.asignaturaId)?.nombre ?? '?';
          lines.push(`  ${f.horaInicio}-${f.horaFin} ${asig} (${aula})`);
        } else {
          const tipo = data.tiposOcupacion.find(t => t.id === f.tipoOcupacionId)?.nombre ?? '?';
          lines.push(`  ${f.horaInicio}-${f.horaFin} [${tipo}] (${aula})`);
        }
      }
    }

    const horasTotal = franjas.reduce((acc, f) => acc + duracionEnHoras(f.horaInicio, f.horaFin), 0);
    lines.push(`\nTotal: ${horasTotal.toFixed(1)}h / ${doc.horasContratadas}h contratadas`);

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  });

  server.tool('ver_horario_aula', 'Muestra el horario semanal de un aula', {
    aula: z.string().describe('Nombre o ID'),
  }, async (args) => {
    const data = readSyncData();
    const aula = data.aulas.find(a => a.id === args.aula || a.nombre === args.aula);
    if (!aula) return { content: [{ type: 'text', text: `Aula "${args.aula}" no encontrada.` }] };

    const esc = data.escenarios.find(e => e.id === data.escenarioActivoId);
    const franjas = esc?.franjas.filter(f => f.aulaId === aula.id) ?? [];

    const lines: string[] = [`Horario de ${aula.nombre} (Cap: ${aula.capacidad}, Sede: ${aula.sede || '—'}):\n`];
    for (const dia of DIAS_SEMANA) {
      const del_dia = franjas.filter(f => f.dia === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
      if (del_dia.length === 0) continue;
      lines.push(`${DIAS_SEMANA_LABEL[dia]}:`);
      for (const f of del_dia) {
        const doc = data.docentes.find(d => d.id === f.docenteId)?.nombre ?? '?';
        if (f.tipo === 'clase') {
          const asig = data.asignaturas.find(a => a.id === f.asignaturaId)?.nombre ?? '?';
          lines.push(`  ${f.horaInicio}-${f.horaFin} ${asig} - ${doc}`);
        } else {
          const tipo = data.tiposOcupacion.find(t => t.id === f.tipoOcupacionId)?.nombre ?? '?';
          lines.push(`  ${f.horaInicio}-${f.horaFin} [${tipo}] - ${doc}`);
        }
      }
    }
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  });

  server.tool('validar_horario', 'Ejecuta validaciones sobre el escenario activo', {}, async () => {
    const data = readSyncData();
    const esc = data.escenarios.find(e => e.id === data.escenarioActivoId);
    if (!esc) return { content: [{ type: 'text', text: 'No hay escenario activo.' }] };

    const errores: string[] = [];
    const avisos: string[] = [];
    const franjas = esc.franjas;

    // Conflictos de aula
    const conAula = franjas.filter(f => f.aulaId);
    for (let i = 0; i < conAula.length; i++) {
      for (let j = i + 1; j < conAula.length; j++) {
        const a = conAula[i], b = conAula[j];
        if (a.aulaId === b.aulaId && a.dia === b.dia && seSolapan(a.horaInicio, a.horaFin, b.horaInicio, b.horaFin)) {
          const aula = data.aulas.find(au => au.id === a.aulaId)?.nombre ?? '?';
          errores.push(`Conflicto aula "${aula}": ${DIAS_SEMANA_LABEL[a.dia]} ${a.horaInicio}-${a.horaFin} vs ${b.horaInicio}-${b.horaFin}`);
        }
      }
    }

    // Conflictos de docente
    for (let i = 0; i < franjas.length; i++) {
      for (let j = i + 1; j < franjas.length; j++) {
        const a = franjas[i], b = franjas[j];
        if (a.docenteId === b.docenteId && a.dia === b.dia && seSolapan(a.horaInicio, a.horaFin, b.horaInicio, b.horaFin)) {
          const doc = data.docentes.find(d => d.id === a.docenteId)?.nombre ?? '?';
          errores.push(`${doc} duplicado: ${DIAS_SEMANA_LABEL[a.dia]} ${a.horaInicio}-${a.horaFin} vs ${b.horaInicio}-${b.horaFin}`);
        }
      }
    }

    // Horas docentes
    for (const doc of data.docentes) {
      const fs = franjas.filter(f => f.docenteId === doc.id);
      const horas = fs.reduce((acc, f) => acc + duracionEnHoras(f.horaInicio, f.horaFin), 0);
      const diff = horas - doc.horasContratadas;
      if (diff > 0.1) avisos.push(`${doc.nombre}: +${diff.toFixed(1)}h exceso (${horas.toFixed(1)}/${doc.horasContratadas}h)`);
      else if (diff < -0.1) avisos.push(`${doc.nombre}: faltan ${Math.abs(diff).toFixed(1)}h (${horas.toFixed(1)}/${doc.horasContratadas}h)`);
    }

    const lines: string[] = [];
    if (errores.length === 0 && avisos.length === 0) {
      lines.push('Sin conflictos ni avisos. El horario es correcto.');
    } else {
      if (errores.length > 0) { lines.push(`ERRORES (${errores.length}):`); errores.forEach(e => lines.push(`  X ${e}`)); }
      if (avisos.length > 0) { lines.push(`\nAVISOS (${avisos.length}):`); avisos.forEach(a => lines.push(`  ! ${a}`)); }
    }
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  });

  server.tool('buscar_huecos', 'Busca huecos libres en aulas (opcionalmente filtrado por docente)', {
    docente: z.string().optional().describe('Nombre o ID — si se da, busca donde docente Y aula estén libres'),
    duracion_minima: z.number().default(30).describe('Minutos mínimos del hueco'),
    aula: z.string().optional().describe('Filtrar por aula específica'),
  }, async (args) => {
    const data = readSyncData();
    const esc = data.escenarios.find(e => e.id === data.escenarioActivoId);
    if (!esc) return { content: [{ type: 'text', text: 'No hay escenario activo.' }] };

    const config = esc.configuracion || CONFIG_POR_DEFECTO;
    const inicioJornada = horaAMinutos(config.horaInicio);
    const finJornada = horaAMinutos(config.horaFin);
    const franjas = esc.franjas;

    let aulasTarget = data.aulas;
    if (args.aula) {
      const a = data.aulas.find(a => a.id === args.aula || a.nombre === args.aula);
      if (a) aulasTarget = [a];
    }

    const docente = args.docente ? data.docentes.find(d => d.id === args.docente || d.nombre === args.docente) : null;
    const franjasDocente = docente ? franjas.filter(f => f.docenteId === docente.id) : [];

    const huecos: string[] = [];
    for (const aula of aulasTarget) {
      for (const dia of DIAS_SEMANA) {
        const fsDia = franjas.filter(f => f.aulaId === aula.id && f.dia === dia)
          .sort((a, b) => horaAMinutos(a.horaInicio) - horaAMinutos(b.horaInicio));

        let cursor = inicioJornada;
        for (const f of fsDia) {
          const fInicio = horaAMinutos(f.horaInicio);
          if (fInicio > cursor && (fInicio - cursor) >= args.duracion_minima) {
            // Check docente also free
            if (!docente || !franjasDocente.some(fd => fd.dia === dia && seSolapan(minutosAHora(cursor), minutosAHora(fInicio), fd.horaInicio, fd.horaFin))) {
              huecos.push(`${DIAS_SEMANA_LABEL[dia]} ${minutosAHora(cursor)}-${minutosAHora(fInicio)} (${fInicio - cursor}min) - ${aula.nombre}`);
            }
          }
          cursor = Math.max(cursor, horaAMinutos(f.horaFin));
        }
        if (cursor < finJornada && (finJornada - cursor) >= args.duracion_minima) {
          if (!docente || !franjasDocente.some(fd => fd.dia === dia && seSolapan(minutosAHora(cursor), minutosAHora(finJornada), fd.horaInicio, fd.horaFin))) {
            huecos.push(`${DIAS_SEMANA_LABEL[dia]} ${minutosAHora(cursor)}-${minutosAHora(finJornada)} (${finJornada - cursor}min) - ${aula.nombre}`);
          }
        }
      }
    }

    const text = huecos.length === 0
      ? 'No se encontraron huecos con los criterios dados.'
      : `${huecos.length} huecos encontrados:\n${huecos.slice(0, 50).join('\n')}${huecos.length > 50 ? `\n... y ${huecos.length - 50} más` : ''}`;
    return { content: [{ type: 'text', text }] };
  });

  server.tool('resumen_horas_docentes', 'Muestra tabla resumen de horas de todos los docentes', {}, async () => {
    const data = readSyncData();
    const esc = data.escenarios.find(e => e.id === data.escenarioActivoId);
    if (!esc) return { content: [{ type: 'text', text: 'No hay escenario activo.' }] };

    const lines: string[] = ['Docente | Clases | Ocup. | Total | Contratadas | Dif.'];
    lines.push('---|---|---|---|---|---');

    for (const doc of data.docentes) {
      const fs = esc.franjas.filter(f => f.docenteId === doc.id);
      const clases = fs.filter(f => f.tipo === 'clase').reduce((a, f) => a + duracionEnHoras(f.horaInicio, f.horaFin), 0);
      const ocup = fs.filter(f => f.tipo === 'ocupacion').reduce((a, f) => a + duracionEnHoras(f.horaInicio, f.horaFin), 0);
      const total = clases + ocup;
      const diff = total - doc.horasContratadas;
      const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
      lines.push(`${doc.nombre} | ${clases.toFixed(1)}h | ${ocup.toFixed(1)}h | ${total.toFixed(1)}h | ${doc.horasContratadas}h | ${diffStr}h`);
    }
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  });
}
