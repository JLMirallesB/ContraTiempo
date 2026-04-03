import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface DroppableCellProps {
  id: string;
  children: ReactNode;
  isEmpty: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  rowSpan?: number;
}

export function DroppableCell({ id, children, isEmpty, onClick, style, rowSpan }: DroppableCellProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <td
      ref={setNodeRef}
      rowSpan={rowSpan}
      onClick={isEmpty ? onClick : undefined}
      className={cn(
        'border-r border-grid-border p-0.5 align-top',
        isEmpty && 'cursor-pointer hover:bg-blue-50',
        isOver && 'bg-blue-100 ring-2 ring-inset ring-primary',
      )}
      style={style}
    >
      <div className="flex h-full flex-col gap-0.5">
        {children}
      </div>
    </td>
  );
}
