import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AulasManager } from '@/components/masters/AulasManager';
import { DocentesManager } from '@/components/masters/DocentesManager';
import { AsignaturasManager } from '@/components/masters/AsignaturasManager';
import { OcupacionesManager } from '@/components/masters/OcupacionesManager';
import { ScenarioManager } from '@/components/scenarios/ScenarioManager';
import { ScenarioComparator } from '@/components/scenarios/ScenarioComparator';
import { VistaImportExport } from '@/components/views/VistaImportExport';

type Tab = 'aulas' | 'docentes' | 'asignaturas' | 'ocupaciones' | 'escenarios' | 'comparar' | 'importexport';

const TABS: { id: Tab; label: string }[] = [
  { id: 'aulas', label: 'Aulas' },
  { id: 'docentes', label: 'Docentes' },
  { id: 'asignaturas', label: 'Asignaturas' },
  { id: 'ocupaciones', label: 'Ocupaciones' },
  { id: 'escenarios', label: 'Escenarios' },
  { id: 'comparar', label: 'Comparar' },
  { id: 'importexport', label: 'Import/Export' },
];

export function VistaConfig() {
  const [tab, setTab] = useState<Tab>('aulas');

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold text-gray-800">Configuración</h2>

      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-secondary hover:text-gray-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'aulas' && <AulasManager />}
      {tab === 'docentes' && <DocentesManager />}
      {tab === 'asignaturas' && <AsignaturasManager />}
      {tab === 'ocupaciones' && <OcupacionesManager />}
      {tab === 'escenarios' && <ScenarioManager />}
      {tab === 'comparar' && <ScenarioComparator />}
      {tab === 'importexport' && <VistaImportExport />}
    </div>
  );
}
