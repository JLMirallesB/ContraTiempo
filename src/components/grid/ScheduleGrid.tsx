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
import { useAppStore, useEscenarioActivo } from '@/stores/useAppStore';
import { useGridColumns } from '@/hooks/useGridColumns';
import { generarFranjasHorarias, horaAMinutos, duracionEnMinutos, sumarMinutos } from '@/services/timeUtils';
import { FranjaCard } from './FranjaCard';
import { DroppableCell } from './DroppableCell';
import type { Franja, DiaSemana } from '@/types';

export function ScheduleGrid() {
  const escenario = useEscenarioActivo();
  const granularidad = useAppStore((s) => s.granularidadVista);
  const modo = useAppStore((s) => s.modoVistaCuadricula);
  const setPanelPrellenado = useAppStore((s) => s.setPanelPrellenado);
  const updateFranja = useAppStore((s) => s.updateFranja);
  const { columns, groupHeaders } = useGridColumns();

  const [activeFranja, setActiveFranja] = useState<Franja | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const config = escenario?.configuracion;
  const franjas = escenario?.franjas ?? [];

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
    for (const franja of franjas) {
      const aulaId = franja.aulaId;
      if (!aulaId) continue;
      for (const col of columns) {
        if (col.aulaId === aulaId && col.dia === franja.dia) {
          if (granularidad === 30) {
            const key = `${col.id}:${franja.horaInicio}`;
            const list = map.get(key) ?? [];
            list.push(franja);
            map.set(key, list);
          } else {
            const inicioMin = horaAMinutos(franja.horaInicio);
            const horaSlot = `${String(Math.floor(inicioMin / 60)).padStart(2, '0')}:00`;
            const key = `${col.id}:${horaSlot}`;
            const list = map.get(key) ?? [];
            list.push(franja);
            map.set(key, list);
          }
        }
      }
    }
    return map;
  }, [franjas, columns, granularidad]);

  const occupiedSlots = useMemo(() => {
    const set = new Set<string>();
    for (const franja of franjas) {
      if (!franja.aulaId) continue;
      for (const col of columns) {
        if (col.aulaId === franja.aulaId && col.dia === franja.dia) {
          if (granularidad === 30) {
            const inicio = horaAMinutos(franja.horaInicio);
            const fin = horaAMinutos(franja.horaFin);
            for (let m = inicio + 30; m < fin; m += 30) {
              const h = Math.floor(m / 60);
              const mins = m % 60;
              const slot = `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
              set.add(`${col.id}:${slot}`);
            }
          }
        }
      }
    }
    return set;
  }, [franjas, columns, granularidad]);

  const handleCellClick = (colId: string, slot: string) => {
    const col = columns.find((c) => c.id === colId);
    if (!col) return;
    setPanelPrellenado({
      dia: col.dia as DiaSemana,
      horaInicio: slot,
      aulaId: col.aulaId,
    });
  };

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

    // Decode droppable id: "cell:colId:slot"
    const overId = over.id as string;
    if (!overId.startsWith('cell:')) return;
    const parts = overId.slice(5); // remove "cell:"
    const lastColon = parts.lastIndexOf(':');
    const colId = parts.slice(0, lastColon);
    const newSlot = parts.slice(lastColon + 1);

    const col = columns.find((c) => c.id === colId);
    if (!col) return;

    // Calculate new end time preserving duration
    const duracion = duracionEnMinutos(franja.horaInicio, franja.horaFin);
    const newFin = sumarMinutos(newSlot, duracion);

    updateFranja(franja.id, {
      dia: col.dia,
      horaInicio: newSlot,
      horaFin: newFin,
      aulaId: col.aulaId,
    });
  };

  if (!config || columns.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-secondary">
          {columns.length === 0
            ? 'Añade aulas en Configuración para ver la cuadrícula.'
            : 'No hay configuración de horario.'}
        </p>
      </div>
    );
  }

  const rowHeight = granularidad === 30 ? 32 : 64;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-auto rounded-lg border border-grid-border">
        <table className="border-collapse text-xs" style={{ minWidth: columns.length * 80 + 60 }}>
          <thead className="sticky top-0 z-20 bg-white">
            <tr className="border-b border-grid-border">
              <th
                className="sticky left-0 z-30 w-[60px] min-w-[60px] border-r border-grid-border bg-white px-2 py-2"
                rowSpan={2}
              >
                Hora
              </th>
              {groupHeaders.map((gh, i) => (
                <th
                  key={i}
                  colSpan={gh.span}
                  className="border-r border-grid-border bg-gray-50 px-2 py-1.5 text-center font-semibold text-primary"
                >
                  {gh.label}
                </th>
              ))}
            </tr>
            <tr className="border-b border-grid-border">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="border-r border-grid-border bg-gray-50 px-1 py-1 text-center font-medium text-gray-600 min-w-[70px]"
                >
                  {modo === 'dias-aulas' ? col.aulaNombre : col.diaLabel}
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
                {columns.map((col) => {
                  const key = `${col.id}:${slot}`;
                  const cellFranjas = franjaMap.get(key) ?? [];
                  const isOccupied = occupiedSlots.has(key);

                  if (isOccupied && granularidad === 30) return null;

                  let rowSpan = 1;
                  if (granularidad === 30 && cellFranjas.length > 0) {
                    const maxDuration = Math.max(
                      ...cellFranjas.map(
                        (f) => horaAMinutos(f.horaFin) - horaAMinutos(f.horaInicio),
                      ),
                    );
                    rowSpan = maxDuration / 30;
                  }

                  return (
                    <DroppableCell
                      key={col.id}
                      id={`cell:${col.id}:${slot}`}
                      isEmpty={cellFranjas.length === 0}
                      onClick={() => handleCellClick(col.id, slot)}
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

      {/* Drag overlay */}
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
