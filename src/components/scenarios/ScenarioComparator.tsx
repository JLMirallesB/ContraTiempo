import { useState, useMemo } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { DIAS_SEMANA_LABEL } from '@/types';
import type { Franja, Escenario } from '@/types';

export function ScenarioComparator() {
  const escenarios = useAppStore((s) => s.escenarios);
  const aulas = useAppStore((s) => s.aulas);
  const asignaturas = useAppStore((s) => s.asignaturas);
  const docentes = useAppStore((s) => s.docentes);
  const tiposOcupacion = useAppStore((s) => s.tiposOcupacion);

  const [idA, setIdA] = useState(escenarios[0]?.id ?? '');
  const [idB, setIdB] = useState(escenarios[1]?.id ?? escenarios[0]?.id ?? '');

  const escA = escenarios.find((e) => e.id === idA);
  const escB = escenarios.find((e) => e.id === idB);

  const diferencias = useMemo(() => {
    if (!escA || !escB) return [];
    return compararEscenarios(escA, escB);
  }, [escA, escB]);

  if (escenarios.length < 2) {
    return (
      <p className="text-sm text-secondary">
        Necesitas al menos 2 escenarios para comparar.
      </p>
    );
  }

  const franjaLabel = (f: Franja) => {
    const dia = DIAS_SEMANA_LABEL[f.dia];
    const aula = aulas.find((a) => a.id === f.aulaId)?.nombre ?? '';
    if (f.tipo === 'clase') {
      const asig = asignaturas.find((a) => a.id === f.asignaturaId)?.alias ?? '?';
      const doc = docentes.find((d) => d.id === f.docenteId)?.nombre ?? '?';
      return `${asig} · ${doc} · ${aula} · ${dia} ${f.horaInicio}-${f.horaFin}`;
    }
    const tipo = tiposOcupacion.find((t) => t.id === f.tipoOcupacionId)?.nombre ?? '?';
    const doc = docentes.find((d) => d.id === f.docenteId)?.nombre ?? '?';
    return `${tipo} · ${doc} · ${aula || 'sin aula'} · ${dia} ${f.horaInicio}-${f.horaFin}`;
  };

  return (
    <div>
      {/* Selectores */}
      <div className="mb-4 flex items-center gap-3">
        <select
          value={idA}
          onChange={(e) => setIdA(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {escenarios.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
        <ArrowLeftRight size={20} className="shrink-0 text-secondary" />
        <select
          value={idB}
          onChange={(e) => setIdB(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {escenarios.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
      </div>

      {/* Resumen */}
      <div className="mb-4 flex gap-3 text-xs">
        <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">
          +{diferencias.filter((d) => d.tipo === 'solo-b').length} solo en {escB?.nombre}
        </span>
        <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">
          -{diferencias.filter((d) => d.tipo === 'solo-a').length} solo en {escA?.nombre}
        </span>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">
          ~{diferencias.filter((d) => d.tipo === 'modificada').length} modificadas
        </span>
      </div>

      {/* Diferencias */}
      {diferencias.length === 0 ? (
        <p className="text-sm text-success">Los escenarios son idénticos.</p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[500px] overflow-auto">
          {diferencias.map((d, i) => (
            <div
              key={i}
              className={`rounded-lg border px-3 py-2 text-xs ${
                d.tipo === 'solo-a'
                  ? 'border-red-200 bg-red-50'
                  : d.tipo === 'solo-b'
                    ? 'border-green-200 bg-green-50'
                    : 'border-blue-200 bg-blue-50'
              }`}
            >
              {d.tipo === 'solo-a' && (
                <span className="text-red-700">Solo en {escA?.nombre}: {franjaLabel(d.franja!)}</span>
              )}
              {d.tipo === 'solo-b' && (
                <span className="text-green-700">Solo en {escB?.nombre}: {franjaLabel(d.franja!)}</span>
              )}
              {d.tipo === 'modificada' && (
                <span className="text-blue-700">Modificada: {d.descripcion}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Diferencia {
  tipo: 'solo-a' | 'solo-b' | 'modificada';
  franja?: Franja;
  descripcion?: string;
}

function compararEscenarios(a: Escenario, b: Escenario): Diferencia[] {
  const diffs: Diferencia[] = [];

  // Crear fingerprints de franjas para comparar por contenido
  const fpA = new Map(a.franjas.map((f) => [franjaFingerprint(f), f]));
  const fpB = new Map(b.franjas.map((f) => [franjaFingerprint(f), f]));

  // Franjas solo en A
  for (const [fp, franja] of fpA) {
    if (!fpB.has(fp)) {
      diffs.push({ tipo: 'solo-a', franja });
    }
  }

  // Franjas solo en B
  for (const [fp, franja] of fpB) {
    if (!fpA.has(fp)) {
      diffs.push({ tipo: 'solo-b', franja });
    }
  }

  return diffs;
}

function franjaFingerprint(f: Franja): string {
  const base = `${f.tipo}|${f.docenteId}|${f.dia}|${f.horaInicio}|${f.horaFin}|${f.aulaId ?? ''}`;
  if (f.tipo === 'clase') {
    return `${base}|${f.asignaturaId}`;
  }
  return `${base}|${f.tipoOcupacionId}`;
}
