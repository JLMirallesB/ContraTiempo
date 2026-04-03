import * as XLSX from 'xlsx';
import type { Aula, Docente, Asignatura, TipoOcupacion, Escenario } from '@/types';
import { DIAS_SEMANA_LABEL } from '@/types';

function saveWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

// === EXPORT INDIVIDUAL ===

export function exportarAulas(aulas: Aula[]) {
  const data = aulas.map((a) => ({
    'Código': a.codigo ?? '',
    'Nombre': a.nombre,
    'Descripción': a.descripcion,
    'Tipo': a.tipo ?? '',
    'Reservable': a.reservable === 'directa' ? 'Directa' : a.reservable === 'con-aprobacion' ? 'Con aprobación' : 'No',
    'Gestionada por': a.gestionadaPor ?? '',
    'Observaciones': a.observaciones ?? '',
    'Sede': a.sede ?? '',
    'Piso': a.piso ?? '',
    'Capacidad': a.capacidad,
    'Atributos': a.atributos.join(', '),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Aulas');
  saveWorkbook(wb, 'aulas.xlsx');
}

export function exportarDocentes(docentes: Docente[]) {
  const data = docentes.map((d) => ({
    'Nombre': d.nombre,
    'Especialidad': d.especialidad,
    'Horas/semana': d.horasContratadas,
    'Departamento': d.departamento ?? '',
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Docentes');
  saveWorkbook(wb, 'docentes.xlsx');
}

export function exportarAsignaturas(asignaturas: Asignatura[]) {
  const data = asignaturas.map((a) => ({
    'Nombre': a.nombre,
    'Alias': a.alias,
    'Ratio': a.ratio,
    'Turnos': a.turnosSemanales,
    'Duración': a.duracionTurno,
    'Tipo': a.tipo ?? '',
    'Requisitos Aula': a.atributosRequeridos.join(', '),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Asignaturas');
  saveWorkbook(wb, 'asignaturas.xlsx');
}

export function exportarOcupaciones(ocupaciones: TipoOcupacion[]) {
  const data = ocupaciones.map((o) => ({
    'Nombre': o.nombre,
    'Requiere Aula': o.requiereAula ? 'Sí' : 'No',
    'Es Lectiva': o.esLectiva ? 'Sí' : 'No',
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Ocupaciones');
  saveWorkbook(wb, 'ocupaciones.xlsx');
}

// === EXPORT ESCENARIO ===

export function exportarEscenario(
  escenario: Escenario,
  aulas: Aula[],
  docentes: Docente[],
  asignaturas: Asignatura[],
  tiposOcupacion: TipoOcupacion[],
) {
  const wb = XLSX.utils.book_new();

  // Hoja de franjas con nombres resueltos
  const franjasData = escenario.franjas.map((f) => {
    const docente = docentes.find((d) => d.id === f.docenteId)?.nombre ?? '';
    const aula = aulas.find((a) => a.id === f.aulaId)?.nombre ?? '';
    const dia = DIAS_SEMANA_LABEL[f.dia];

    if (f.tipo === 'clase') {
      const asig = asignaturas.find((a) => a.id === f.asignaturaId);
      return {
        'Tipo': 'Clase',
        'Asignatura': asig?.nombre ?? '',
        'Alias': asig?.alias ?? '',
        'Docente': docente,
        'Aula': aula,
        'Día': dia,
        'Hora Inicio': f.horaInicio,
        'Hora Fin': f.horaFin,
      };
    }
    const tipo = tiposOcupacion.find((t) => t.id === f.tipoOcupacionId);
    return {
      'Tipo': 'Ocupación',
      'Asignatura': tipo?.nombre ?? '',
      'Alias': '',
      'Docente': docente,
      'Aula': aula,
      'Día': dia,
      'Hora Inicio': f.horaInicio,
      'Hora Fin': f.horaFin,
    };
  });

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(franjasData), 'Franjas');

  // Hoja de metadata
  const meta = [
    { Campo: 'Nombre', Valor: escenario.nombre },
    { Campo: 'Descripción', Valor: escenario.descripcion ?? '' },
    { Campo: 'Creado', Valor: escenario.creadoEn },
    { Campo: 'Modificado', Valor: escenario.modificadoEn },
    { Campo: 'Total Franjas', Valor: String(escenario.franjas.length) },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meta), 'Info');

  saveWorkbook(wb, `escenario-${escenario.nombre.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
}

// === EXPORT BACKUP TOTAL ===

export function exportarBackupTotal(
  aulas: Aula[],
  docentes: Docente[],
  asignaturas: Asignatura[],
  tiposOcupacion: TipoOcupacion[],
  escenarios: Escenario[],
) {
  const wb = XLSX.utils.book_new();

  // Datos maestros como JSON serializado para import exacto
  const aulasSheet = aulas.map((a) => ({ ...a, atributos: a.atributos.join('|') }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(aulasSheet), 'Aulas');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(docentes.map((d) => ({
    ...d,
    disponibilidad: d.disponibilidad ? JSON.stringify(d.disponibilidad) : '',
  }))), 'Docentes');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(asignaturas.map((a) => ({
    ...a,
    atributosRequeridos: a.atributosRequeridos.join('|'),
  }))), 'Asignaturas');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tiposOcupacion), 'Ocupaciones');

  // Cada escenario en su hoja
  for (const esc of escenarios) {
    const franjas = esc.franjas.map((f) => ({
      ...f,
      _escenarioId: esc.id,
      _escenarioNombre: esc.nombre,
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(franjas),
      `Esc_${esc.nombre.slice(0, 25)}`,
    );
  }

  // Metadata de escenarios
  const escMeta = escenarios.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    descripcion: e.descripcion ?? '',
    creadoEn: e.creadoEn,
    modificadoEn: e.modificadoEn,
    hojaFranjas: `Esc_${e.nombre.slice(0, 25)}`,
    configJSON: JSON.stringify(e.configuracion),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(escMeta), '_Escenarios');

  saveWorkbook(wb, 'backup-horario-conservatorio.xlsx');
}
