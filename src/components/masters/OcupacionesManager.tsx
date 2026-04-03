import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { TipoOcupacion } from '@/types';

interface OcupacionFormData {
  nombre: string;
  requiereAula: boolean;
  esLectiva: boolean;
}

const emptyForm: OcupacionFormData = { nombre: '', requiereAula: false, esLectiva: false };

export function OcupacionesManager() {
  const tipos = useAppStore((s) => s.tiposOcupacion);
  const addTipo = useAppStore((s) => s.addTipoOcupacion);
  const updateTipo = useAppStore((s) => s.updateTipoOcupacion);
  const removeTipo = useAppStore((s) => s.removeTipoOcupacion);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OcupacionFormData>(emptyForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateTipo(editingId, form);
      setEditingId(null);
    } else {
      addTipo(form);
    }
    setForm(emptyForm);
    setShowForm(false);
  };

  const startEdit = (tipo: TipoOcupacion) => {
    setEditingId(tipo.id);
    setForm({ nombre: tipo.nombre, requiereAula: tipo.requiereAula, esLectiva: tipo.esLectiva ?? false });
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700">
          Tipos de Ocupación ({tipos.length})
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Plus size={16} />
            Añadir Tipo
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border border-grid-border bg-gray-50 p-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Ej: Reunión de departamento"
              />
            </div>
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.requiereAula}
                  onChange={(e) =>
                    setForm({ ...form, requiereAula: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                Requiere aula
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={form.esLectiva}
                  onChange={(e) =>
                    setForm({ ...form, esLectiva: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                Es lectiva
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              <Check size={16} />
              {editingId ? 'Guardar' : 'Añadir'}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        </form>
      )}

      {tipos.length === 0 ? (
        <p className="text-sm text-secondary">
          No hay tipos de ocupación registrados.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-grid-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="px-4 py-3 font-medium text-gray-600">Requiere Aula</th>
                <th className="px-4 py-3 font-medium text-gray-600">Es Lectiva</th>
                <th className="px-4 py-3 font-medium text-gray-600 w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grid-border">
              {tipos.map((tipo) => (
                <tr key={tipo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{tipo.nombre}</td>
                  <td className="px-4 py-3">
                    {tipo.requiereAula ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Sí</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {tipo.esLectiva ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Sí</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(tipo)}
                        className="rounded p-1.5 text-secondary hover:bg-gray-200 hover:text-primary"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => removeTipo(tipo.id)}
                        className="rounded p-1.5 text-secondary hover:bg-red-100 hover:text-error"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
