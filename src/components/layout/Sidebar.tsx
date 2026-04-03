import {
  Calendar,
  Building2,
  Users,
  Music,
  AlertTriangle,
  Wrench,
  Settings,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Coffee,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import type { VistaId } from '@/types';

interface NavItem {
  id: VistaId;
  label: string;
  icon: LucideIcon;
  filtroKey?: 'aulaId' | 'docenteId' | 'asignaturaId';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'general', label: 'Vista General', icon: Calendar },
  { id: 'aula', label: 'Por Aula', icon: Building2, filtroKey: 'aulaId' },
  { id: 'docente', label: 'Por Docente', icon: Users, filtroKey: 'docenteId' },
  { id: 'asignatura', label: 'Por Asignatura', icon: Music, filtroKey: 'asignaturaId' },
  { id: 'validaciones', label: 'Validaciones', icon: AlertTriangle },
  { id: 'herramientas', label: 'Herramientas', icon: Wrench },
  { id: 'config', label: 'Configuración', icon: Settings },
];

const REPO_URL = 'https://github.com/JLMirallesB/ContraTiempo';
const KOFI_URL = 'https://ko-fi.com/miralles';

function NavSubItems({ item }: { item: NavItem }) {
  const [expanded, setExpanded] = useState(false);
  const aulas = useAppStore((s) => s.aulas);
  const docentes = useAppStore((s) => s.docentes);
  const asignaturas = useAppStore((s) => s.asignaturas);
  const setVista = useAppStore((s) => s.setVista);
  const setFiltros = useAppStore((s) => s.setFiltros);

  const items =
    item.filtroKey === 'aulaId'
      ? aulas.map((a) => ({ id: a.id, nombre: a.nombre }))
      : item.filtroKey === 'docenteId'
        ? docentes.map((d) => ({ id: d.id, nombre: d.nombre }))
        : asignaturas.map((a) => ({ id: a.id, nombre: a.nombre }));

  if (items.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1 px-2 py-1 text-xs text-secondary hover:text-primary"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span>{items.length} registros</span>
      </button>
      {expanded && (
        <div className="ml-6 flex flex-col gap-0.5 max-h-48 overflow-y-auto">
          {items.map((sub) => (
            <button
              key={sub.id}
              onClick={() => {
                setVista(item.id);
                setFiltros({ [item.filtroKey!]: sub.id });
              }}
              className="rounded-md px-2 py-1 text-left text-sm text-secondary hover:bg-sidebar-active hover:text-primary truncate"
            >
              {sub.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const vistaActual = useAppStore((s) => s.vistaActual);
  const setVista = useAppStore((s) => s.setVista);
  const clearFiltros = useAppStore((s) => s.clearFiltros);
  const escenarios = useAppStore((s) => s.escenarios);
  const escenarioActivoId = useAppStore((s) => s.escenarioActivoId);
  const setEscenarioActivo = useAppStore((s) => s.setEscenarioActivo);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-grid-border bg-sidebar">
      {/* Header con logo */}
      <div className="border-b border-grid-border p-3">
        <div className="flex items-center gap-2.5">
          <img
            src={import.meta.env.BASE_URL + 'icon.png'}
            alt="ContraTiempo"
            className="h-9 w-9 rounded-lg"
          />
          <div>
            <h1 className="text-base font-bold text-primary-dark leading-tight">ContraTiempo</h1>
            <p className="text-[10px] text-secondary leading-tight">Horarios de conservatorio</p>
          </div>
        </div>
      </div>

      {/* Selector de escenario */}
      <div className="border-b border-grid-border p-3">
        <label className="mb-1 block text-xs font-medium text-secondary">
          Escenario
        </label>
        <select
          value={escenarioActivoId}
          onChange={(e) => setEscenarioActivo(e.target.value)}
          className="w-full rounded-md border border-grid-border bg-white px-2 py-1.5 text-sm"
        >
          {escenarios.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Navegacion */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  setVista(item.id);
                  if (!item.filtroKey) clearFiltros();
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  vistaActual === item.id
                    ? 'bg-primary text-white'
                    : 'text-secondary hover:bg-sidebar-active hover:text-primary',
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
              {item.filtroKey && vistaActual === item.id && (
                <NavSubItems item={item} />
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer con creditos */}
      <div className="border-t border-grid-border px-3 py-2.5 text-[10px] text-secondary leading-relaxed">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium">v0.1.0</span>
          <div className="flex items-center gap-2">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary"
              title="Repositorio GitHub"
            >
              <ExternalLink size={11} />
            </a>
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-amber-600"
              title="Invitar a una horchata"
            >
              <Coffee size={11} />
            </a>
          </div>
        </div>
        <div>
          Diseño: <span className="font-medium">JLMiralles</span>
        </div>
        <div>
          Programación: <span className="font-medium">Claude Opus</span>
        </div>
      </div>
    </aside>
  );
}
