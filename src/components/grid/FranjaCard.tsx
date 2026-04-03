import { X, GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import type { Franja } from '@/types';

interface FranjaCardProps {
  franja: Franja;
  compact?: boolean;
  isDragOverlay?: boolean;
}

export function FranjaCard({ franja, compact = false, isDragOverlay = false }: FranjaCardProps) {
  const asignaturas = useAppStore((s) => s.asignaturas);
  const docentes = useAppStore((s) => s.docentes);
  const tiposOcupacion = useAppStore((s) => s.tiposOcupacion);
  const setFranjaEditandoId = useAppStore((s) => s.setFranjaEditandoId);
  const removeFranja = useAppStore((s) => s.removeFranja);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `franja-${franja.id}`,
    data: { franja },
    disabled: isDragOverlay,
  });

  const esClase = franja.tipo === 'clase';
  const nombre = esClase
    ? asignaturas.find((a) => a.id === franja.asignaturaId)?.alias ||
      asignaturas.find((a) => a.id === franja.asignaturaId)?.nombre ||
      '?'
    : tiposOcupacion.find((t) => t.id === franja.tipoOcupacionId)?.nombre || '?';

  const docente = docentes.find((d) => d.id === franja.docenteId);
  const docenteNombre = docente?.nombre ?? '';

  return (
    <div
      ref={setNodeRef}
      onClick={() => !isDragging && setFranjaEditandoId(franja.id)}
      className={cn(
        'group relative cursor-pointer rounded border text-left transition-shadow hover:shadow-md',
        esClase
          ? 'border-clase-border bg-clase'
          : 'border-ocupacion-border bg-ocupacion',
        compact ? 'px-1 py-0.5 text-[10px]' : 'px-1.5 py-1 text-xs',
        isDragging && 'opacity-30',
        isDragOverlay && 'shadow-lg ring-2 ring-primary opacity-90',
      )}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute left-0 top-0 bottom-0 flex w-4 cursor-grab items-center justify-center opacity-0 group-hover:opacity-60 active:cursor-grabbing"
      >
        <GripVertical size={10} />
      </div>
      <div className="ml-3">
        <div className="font-semibold truncate leading-tight">{nombre}</div>
        {!compact && docenteNombre && (
          <div className="truncate text-gray-600 leading-tight">{docenteNombre}</div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeFranja(franja.id);
        }}
        className="absolute top-0.5 right-0.5 hidden rounded bg-white/80 p-0.5 text-gray-400 hover:text-error group-hover:block"
      >
        <X size={10} />
      </button>
    </div>
  );
}
