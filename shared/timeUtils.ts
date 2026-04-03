/**
 * Utilidades puras para manejo de tiempos y franjas horarias.
 * Compartidas entre App y MCP Server.
 * Todas las horas se representan como strings "HH:mm".
 */

export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generarFranjasHorarias(inicio: string, fin: string): string[] {
  const franjas: string[] = [];
  const inicioMin = horaAMinutos(inicio);
  const finMin = horaAMinutos(fin);
  for (let m = inicioMin; m < finMin; m += 30) {
    franjas.push(minutosAHora(m));
  }
  return franjas;
}

export function duracionEnMinutos(inicio: string, fin: string): number {
  return horaAMinutos(fin) - horaAMinutos(inicio);
}

export function duracionEnHoras(inicio: string, fin: string): number {
  return duracionEnMinutos(inicio, fin) / 60;
}

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

export function sumarMinutos(hora: string, minutos: number): string {
  return minutosAHora(horaAMinutos(hora) + minutos);
}

export function formatearDuracion(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
