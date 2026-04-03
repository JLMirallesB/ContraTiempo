import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { Docente } from '@/types';

interface DocenteFormData {
  nombre: string;
  especialidad: string;
  horasContratadas: number;
  departamento: string;
}

const emptyForm: DocenteFormData = {
  nombre: '',
  especialidad: '',
  horasContratadas: 0,
  departamento: '',
};

export function DocentesManager() {
  const docentes = useAppStore((s) => s.docentes);
  const addDocente = useAppStore((s) => s.addDocente);
  const updateDocente = useAppStore((s) => s.updateDocente);
  const removeDocente = useAppStore((s) => s.removeDocente);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DocenteFormData>(emptyForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateDocente(editingId, {
        nombre: form.nombre,
        especialidad: form.especialidad,
        horasContratadas: form.horasContratadas,
        departamento: form.departamento || undefined,
      });
      setEditingId(null);
    } else {
      addDocente({
        nombre: form.nombre,
        especialidad: form.especialidad,
        horasContratadas: form.horasContratadas,
        departamento: form.departamento || undefined,
      });
    }
    setForm(emptyForm);
    setShowForm(false);
  };

  const startEdit = (docente: Docente) => {
    setEditingId(docente.id);
    setForm({
      nombre: docente.nombre,
      especialidad: docente.especialidad,
      horasContratadas: docente.horasContratadas,
      departamento: docente.departamento ?? '',
    });
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
          Docentes ({docentes.length})
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Plus size={16} />
            Añadir Docente
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
                placeholder="Ej: María García"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Especialidad *
              </label>
              <input
                type="text"
                required
                value={form.especialidad}
                onChange={(e) =>
                  setForm({ ...form, especialidad: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Ej: Piano, Violín"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Horas contratadas (semanales) *
              </label>
              <input
                type="number"
                required
                min={0}
                step={0.5}
                value={form.horasContratadas}
                onChange={(e) =>
                  setForm({
                    ...form,
                    horasContratadas: Number(e.target.value),
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Departamento
              </label>
              <input
                type="text"
                value={form.departamento}
                onChange={(e) =>
                  setForm({ ...form, departamento: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Ej: Cuerda, Viento"
              />
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

      {docentes.length === 0 ? (
        <p className="text-sm text-secondary">No hay docentes registrados.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-grid-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="px-4 py-3 font-medium text-gray-600">Especialidad</th>
                <th className="px-4 py-3 font-medium text-gray-600">Horas/semana</th>
                <th className="px-4 py-3 font-medium text-gray-600">Departamento</th>
                <th className="px-4 py-3 font-medium text-gray-600 w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grid-border">
              {docentes.map((docente) => (
                <tr key={docente.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{docente.nombre}</td>
                  <td className="px-4 py-3">{docente.especialidad}</td>
                  <td className="px-4 py-3">{docente.horasContratadas}h</td>
                  <td className="px-4 py-3 text-secondary">
                    {docente.departamento ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(docente)}
                        className="rounded p-1.5 text-secondary hover:bg-gray-200 hover:text-primary"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => removeDocente(docente.id)}
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
