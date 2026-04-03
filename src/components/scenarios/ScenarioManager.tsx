import { useState } from 'react';
import { Plus, Copy, Pencil, Trash2, Check, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

export function ScenarioManager() {
  const escenarios = useAppStore((s) => s.escenarios);
  const escenarioActivoId = useAppStore((s) => s.escenarioActivoId);
  const addEscenario = useAppStore((s) => s.addEscenario);
  const updateEscenario = useAppStore((s) => s.updateEscenario);
  const removeEscenario = useAppStore((s) => s.removeEscenario);
  const duplicarEscenario = useAppStore((s) => s.duplicarEscenario);
  const setEscenarioActivo = useAppStore((s) => s.setEscenarioActivo);

  const [creando, setCreando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null);
  const [dupNombre, setDupNombre] = useState('');

  const handleCrear = () => {
    if (!nuevoNombre.trim()) return;
    addEscenario(nuevoNombre.trim());
    setNuevoNombre('');
    setCreando(false);
  };

  const handleRenombrar = () => {
    if (!editandoId || !editNombre.trim()) return;
    updateEscenario(editandoId, { nombre: editNombre.trim() });
    setEditandoId(null);
    setEditNombre('');
  };

  const handleDuplicar = () => {
    if (!duplicandoId || !dupNombre.trim()) return;
    duplicarEscenario(duplicandoId, dupNombre.trim());
    setDuplicandoId(null);
    setDupNombre('');
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700">
          Escenarios ({escenarios.length})
        </h3>
        {!creando && (
          <button
            onClick={() => setCreando(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Plus size={16} />
            Nuevo Escenario
          </button>
        )}
      </div>

      {/* Formulario crear */}
      {creando && (
        <div className="mb-4 flex gap-2 rounded-lg border border-grid-border bg-gray-50 p-3">
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCrear()}
            placeholder="Nombre del escenario"
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            autoFocus
          />
          <button onClick={handleCrear} className="rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-dark">
            <Check size={16} />
          </button>
          <button onClick={() => setCreando(false)} className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Formulario duplicar */}
      {duplicandoId && (
        <div className="mb-4 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <span className="self-center text-xs text-blue-700">
            Duplicar "{escenarios.find((e) => e.id === duplicandoId)?.nombre}":
          </span>
          <input
            type="text"
            value={dupNombre}
            onChange={(e) => setDupNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDuplicar()}
            placeholder="Nombre de la copia"
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            autoFocus
          />
          <button onClick={handleDuplicar} className="rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-dark">
            <Check size={16} />
          </button>
          <button onClick={() => setDuplicandoId(null)} className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Lista de escenarios */}
      <div className="flex flex-col gap-2">
        {escenarios.map((esc) => {
          const isActive = esc.id === escenarioActivoId;
          const isEditing = editandoId === esc.id;

          return (
            <div
              key={esc.id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                isActive ? 'border-primary bg-blue-50' : 'border-grid-border bg-white'
              }`}
            >
              {/* Nombre / edicion inline */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenombrar()}
                      className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      autoFocus
                    />
                    <button onClick={handleRenombrar} className="text-primary hover:text-primary-dark">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditandoId(null)} className="text-secondary hover:text-gray-700">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="font-medium truncate">{esc.nombre}</p>
                    <p className="text-xs text-secondary">
                      {esc.franjas.length} franjas · Modificado: {new Date(esc.modificadoEn).toLocaleDateString('es-ES')}
                    </p>
                  </>
                )}
              </div>

              {/* Acciones */}
              {!isEditing && (
                <div className="flex items-center gap-1">
                  {!isActive && (
                    <button
                      onClick={() => setEscenarioActivo(esc.id)}
                      className="rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      Activar
                    </button>
                  )}
                  {isActive && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-white">
                      Activo
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setEditandoId(esc.id);
                      setEditNombre(esc.nombre);
                    }}
                    className="rounded p-1.5 text-secondary hover:bg-gray-200 hover:text-primary"
                    title="Renombrar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setDuplicandoId(esc.id);
                      setDupNombre(`${esc.nombre} (copia)`);
                    }}
                    className="rounded p-1.5 text-secondary hover:bg-gray-200 hover:text-primary"
                    title="Duplicar"
                  >
                    <Copy size={14} />
                  </button>
                  {escenarios.length > 1 && (
                    <button
                      onClick={() => removeEscenario(esc.id)}
                      className="rounded p-1.5 text-secondary hover:bg-red-100 hover:text-error"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
