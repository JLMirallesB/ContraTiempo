import { useRef } from 'react';
import { Download, Upload, Database, FileSpreadsheet } from 'lucide-react';
import { useAppStore, useEscenarioActivo } from '@/stores/useAppStore';
import {
  exportarAulas,
  exportarDocentes,
  exportarAsignaturas,
  exportarOcupaciones,
  exportarEscenario,
  exportarBackupTotal,
} from '@/services/excel/excelExporter';
import {
  importarAulas,
  importarDocentes,
  importarAsignaturas,
  importarOcupaciones,
  importarBackupTotal,
} from '@/services/excel/excelImporter';

type ImportType = 'aulas' | 'docentes' | 'asignaturas' | 'ocupaciones' | 'backup';

export function VistaImportExport() {
  const aulas = useAppStore((s) => s.aulas);
  const docentes = useAppStore((s) => s.docentes);
  const asignaturas = useAppStore((s) => s.asignaturas);
  const tiposOcupacion = useAppStore((s) => s.tiposOcupacion);
  const escenarios = useAppStore((s) => s.escenarios);
  const escenario = useEscenarioActivo();

  const store = useAppStore;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importTypeRef = useRef<ImportType>('aulas');

  const handleImportClick = (type: ImportType) => {
    importTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const type = importTypeRef.current;

      if (type === 'aulas') {
        const imported = await importarAulas(file);
        const state = store.getState();
        store.setState({ aulas: [...state.aulas, ...imported] });
      } else if (type === 'docentes') {
        const imported = await importarDocentes(file);
        const state = store.getState();
        store.setState({ docentes: [...state.docentes, ...imported] });
      } else if (type === 'asignaturas') {
        const imported = await importarAsignaturas(file);
        const state = store.getState();
        store.setState({ asignaturas: [...state.asignaturas, ...imported] });
      } else if (type === 'ocupaciones') {
        const imported = await importarOcupaciones(file);
        const state = store.getState();
        store.setState({ tiposOcupacion: [...state.tiposOcupacion, ...imported] });
      } else if (type === 'backup') {
        const data = await importarBackupTotal(file);
        store.setState({
          aulas: data.aulas,
          docentes: data.docentes,
          asignaturas: data.asignaturas,
          tiposOcupacion: data.tiposOcupacion,
          escenarios: data.escenarios.length > 0 ? data.escenarios : store.getState().escenarios,
          escenarioActivoId: data.escenarios[0]?.id ?? store.getState().escenarioActivoId,
        });
      }

      alert(`Importación de ${type} completada.`);
    } catch (err) {
      alert(`Error al importar: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }

    // Reset input
    e.target.value = '';
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Export individual */}
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Exportar datos maestros</h3>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <ExportButton label={`Aulas (${aulas.length})`} onClick={() => exportarAulas(aulas)} />
        <ExportButton label={`Docentes (${docentes.length})`} onClick={() => exportarDocentes(docentes)} />
        <ExportButton label={`Asignaturas (${asignaturas.length})`} onClick={() => exportarAsignaturas(asignaturas)} />
        <ExportButton label={`Ocupaciones (${tiposOcupacion.length})`} onClick={() => exportarOcupaciones(tiposOcupacion)} />
      </div>

      {/* Import individual */}
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Importar datos maestros</h3>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <ImportButton label="Aulas" onClick={() => handleImportClick('aulas')} />
        <ImportButton label="Docentes" onClick={() => handleImportClick('docentes')} />
        <ImportButton label="Asignaturas" onClick={() => handleImportClick('asignaturas')} />
        <ImportButton label="Ocupaciones" onClick={() => handleImportClick('ocupaciones')} />
      </div>

      {/* Export escenario */}
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Escenario activo</h3>
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => escenario && exportarEscenario(escenario, aulas, docentes, asignaturas, tiposOcupacion)}
          disabled={!escenario}
          className="flex items-center gap-2 rounded-lg border border-grid-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <FileSpreadsheet size={16} className="text-primary" />
          Exportar "{escenario?.nombre}"
        </button>
      </div>

      {/* Backup total */}
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Backup completo</h3>
      <div className="flex gap-3">
        <button
          onClick={() => exportarBackupTotal(aulas, docentes, asignaturas, tiposOcupacion, escenarios)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Database size={16} />
          Exportar backup total
        </button>
        <button
          onClick={() => handleImportClick('backup')}
          className="flex items-center gap-2 rounded-lg border-2 border-primary bg-white px-4 py-2.5 text-sm font-medium text-primary hover:bg-blue-50"
        >
          <Database size={16} />
          Importar backup total
        </button>
      </div>
      <p className="mt-2 text-xs text-secondary">
        El backup total reemplaza todos los datos actuales (aulas, docentes, asignaturas, ocupaciones y escenarios).
      </p>

      {/* Sync JSON */}
      <h3 className="mt-6 mb-3 text-sm font-semibold text-gray-700">Sincronizacion JSON (MCP / Tauri)</h3>
      <div className="flex gap-3">
        <button
          onClick={async () => {
            const { exportJSON } = await import('@/services/fileSync');
            await exportJSON();
          }}
          className="flex items-center gap-2 rounded-lg border border-grid-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download size={16} className="text-primary" />
          Exportar JSON
        </button>
        <button
          onClick={async () => {
            const { importJSON } = await import('@/services/fileSync');
            const ok = await importJSON();
            if (ok) alert('Datos cargados desde JSON.');
          }}
          className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:border-primary"
        >
          <Upload size={16} className="text-secondary" />
          Importar JSON
        </button>
      </div>
      <p className="mt-2 text-xs text-secondary">
        Formato JSON compatible con el MCP Server y la app de escritorio Tauri.
      </p>
    </div>
  );
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-grid-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <Download size={16} className="text-primary" />
      {label}
    </button>
  );
}

function ImportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:border-primary"
    >
      <Upload size={16} className="text-secondary" />
      Importar {label}
    </button>
  );
}
