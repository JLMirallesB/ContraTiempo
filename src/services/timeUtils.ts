/**
 * Utilidades para manejo de tiempos y franjas horarias.
 * Todas las horas se representan como strings "HH:mm".
 */

/** Convierte "HH:mm" a minutos desde medianoche */
export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** Convierte minutos desde medianoche a "HH:mm" */
export function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Genera array de horas en intervalos de 30 min entre inicio y fin */
export function generarFranjasHorarias(inicio: string, fin: string): string[] {
  const franjas: string[] = [];
  const inicioMin = horaAMinutos(inicio);
  const finMin = horaAMinutos(fin);
  for (let m = inicioMin; m < finMin; m += 30) {
    franjas.push(minutosAHora(m));
  }
  return franjas;
}

/** Calcula la duracion en minutos entre dos horas */
export function duracionEnMinutos(inicio: string, fin: string): number {
  return horaAMinutos(fin) - horaAMinutos(inicio);
}

/** Calcula la duracion en horas (decimal) entre dos horas */
export function duracionEnHoras(inicio: string, fin: string): number {
  return duracionEnMinutos(inicio, fin) / 60;
}

/** Verifica si dos rangos horarios se solapan */
export function seSolapan(
  inicio1: string,
  fin1: string,
  inicio2: string,
  fin2: string,
): boolean {
  const a1 = horaAMinutos(inicio1);
  const a2 = horaAMinutos(fin1);
  const b1 = horaAMinutos(inicio2);
  const b2 = horaAMinutos(fin2);
  return a1 < b2 && b1 < a2;
}

/** Suma una duracion en minutos a una hora, devuelve nueva hora */
export function sumarMinutos(hora: string, minutos: number): string {
  return minutosAHora(horaAMinutos(hora) + minutos);
}

/** Formatea minutos como "Xh Ym" */
export function formatearDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
