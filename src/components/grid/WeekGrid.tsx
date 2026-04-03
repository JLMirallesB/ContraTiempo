import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { useAppStore, useEscenarioActivo } from '@/stores/useAppStore';
import { generarFranjasHorarias, horaAMinutos, duracionEnMinutos, sumarMinutos } from '@/services/timeUtils';
import { FranjaCard } from './FranjaCard';
import { DroppableCell } from './DroppableCell';
import { DIAS_SEMANA, DIAS_SEMANA_LABEL, type Franja, type DiaSemana } from '@/types';

interface WeekGridProps {
  franjas: Franja[];
  titulo: string;
  subtitulo?: string;
}

export function WeekGrid({ franjas, titulo, subtitulo }: WeekGridProps) {
  const granularidad = useAppStore((s) => s.granularidadVista);
  const escenario = useEscenarioActivo();
  const setPanelPrellenado = useAppStore((s) => s.setPanelPrellenado);
  const updateFranja = useAppStore((s) => s.updateFranja);

  const [activeFranja, setActiveFranja] = useState<Franja | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const config = escenario?.configuracion;

  const timeSlots = useMemo(() => {
    if (!config) return [];
    if (granularidad === 30) {
      return generarFranjasHorarias(config.horaInicio, config.horaFin);
    }
    const slots: string[] = [];
    const inicio = horaAMinutos(config.horaInicio);
    const fin = horaAMinutos(config.horaFin);
    for (let m = inicio; m < fin; m += 60) {
      slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:00`);
    }
    return slots;
  }, [config, granularidad]);

  const franjaMap = useMemo(() => {
    const map = new Map<string, Franja[]>();
    for (const f of franjas) {
      if (granularidad === 30) {
        const key = `${f.dia}:${f.horaInicio}`;
        const list = map.get(key) ?? [];
        list.push(f);
        map.set(key, list);
      } else {
        const inicioMin = horaAMinutos(f.horaInicio);
        const horaSlot = `${String(Math.floor(inicioMin / 60)).padStart(2, '0')}:00`;
        const key = `${f.dia}:${horaSlot}`;
        const list = map.get(key) ?? [];
        list.push(f);
        map.set(key, list);
      }
    }
    return map;
  }, [franjas, granularidad]);

  const occupiedSlots = useMemo(() => {
    const set = new Set<string>();
    if (granularidad !== 30) return set;
    for (const f of franjas) {
      const inicio = horaAMinutos(f.horaInicio);
      const fin = horaAMinutos(f.horaFin);
      for (let m = inicio + 30; m < fin; m += 30) {
        const h = Math.floor(m / 60);
        const mins = m % 60;
        const slot = `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        set.add(`${f.dia}:${slot}`);
      }
    }
    return set;
  }, [franjas, granularidad]);

  const handleDragStart = (event: DragStartEvent) => {
    const franja = (event.active.data.current as { franja: Franja })?.franja;
    if (franja) setActiveFranja(franja);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveFranja(null);
    const { active, over } = event;
    if (!over) return;

    const franja = (active.data.current as { franja: Franja })?.franja;
    if (!franja) return;

    const overId = over.id as string;
    if (!overId.startsWith('week:')) return;
    // Format: "week:dia:slot"
    const [, dia, newSlot] = overId.split(':') as [string, DiaSemana, string];

    const duracion = duracionEnMinutos(franja.horaInicio, franja.horaFin);
    const newFin = sumarMinutos(newSlot, duracion);

    updateFranja(franja.id, {
      dia,
      horaInicio: newSlot,
      horaFin: newFin,
    });
  };

  const rowHeight = granularidad === 30 ? 32 : 64;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div>
        <div className="mb-3">
          <h2 className="text-xl font-bold text-gray-800">{titulo}</h2>
          {subtitulo && <p className="text-sm text-secondary">{subtitulo}</p>}
        </div>

        <div className="mb-3 flex items-center gap-2">
          <GranularidadToggle />
          <span className="text-xs text-secondary">{franjas.length} franjas</span>
        </div>

        <div className="overflow-auto rounded-lg border border-grid-border">
          <table className="border-collapse text-xs" style={{ minWidth: 460 }}>
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-grid-border">
                <th className="sticky left-0 z-20 w-[60px] min-w-[60px] border-r border-grid-border bg-white px-2 py-2">
                  Hora
                </th>
                {DIAS_SEMANA.map((dia) => (
                  <th
                    key={dia}
                    className="border-r border-grid-border bg-gray-50 px-2 py-2 text-center font-semibold text-primary min-w-[80px]"
                  >
                    {DIAS_SEMANA_LABEL[dia]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot} className="border-b border-grid-border">
                  <td
                    className="sticky left-0 z-10 w-[60px] min-w-[60px] border-r border-grid-border bg-white px-2 text-right font-mono text-gray-500"
                    style={{ height: rowHeight }}
                  >
                    {slot}
                  </td>
                  {DIAS_SEMANA.map((dia) => {
                    const key = `${dia}:${slot}`;
                    const cellFranjas = franjaMap.get(key) ?? [];
                    const isOccupied = occupiedSlots.has(key);

                    if (isOccupied && granularidad === 30) return null;

                    let rowSpan = 1;
                    if (granularidad === 30 && cellFranjas.length > 0) {
                      const maxDuration = Math.max(
                        ...cellFranjas.map((f) => horaAMinutos(f.horaFin) - horaAMinutos(f.horaInicio)),
                      );
                      rowSpan = maxDuration / 30;
                    }

                    return (
                      <DroppableCell
                        key={dia}
                        id={`week:${dia}:${slot}`}
                        isEmpty={cellFranjas.length === 0}
                        onClick={() => setPanelPrellenado({ dia: dia as DiaSemana, horaInicio: slot })}
                        rowSpan={granularidad === 30 ? rowSpan : 1}
                        style={{ height: rowHeight * rowSpan }}
                      >
                        {cellFranjas.map((f) => (
                          <FranjaCard
                            key={f.id}
                            franja={f}
                            compact={granularidad === 60 && horaAMinutos(f.horaFin) - horaAMinutos(f.horaInicio) <= 30}
                          />
                        ))}
                      </DroppableCell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeFranja && (
          <div className="w-[120px]">
            <FranjaCard franja={activeFranja} isDragOverlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function GranularidadToggle() {
  const granularidad = useAppStore((s) => s.granularidadVista);
  const setGranularidad = useAppStore((s) => s.setGranularidad);

  return (
    <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-white p-0.5">
      <button
        onClick={() => setGranularidad(30)}
        className={cn(
          'rounded px-2.5 py-1 text-xs font-medium',
          granularidad === 30 ? 'bg-primary text-white' : 'text-secondary hover:text-primary',
        )}
      >
        30 min
      </button>
      <button
        onClick={() => setGranularidad(60)}
        className={cn(
          'rounded px-2.5 py-1 text-xs font-medium',
          granularidad === 60 ? 'bg-primary text-white' : 'text-secondary hover:text-primary',
        )}
      >
        1 hora
      </button>
    </div>
  );
}
