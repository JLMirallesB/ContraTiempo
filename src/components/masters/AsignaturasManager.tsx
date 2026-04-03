import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { formatearDuracion } from '@/services/timeUtils';
import type { Asignatura } from '@/types';
import { DURACIONES_DISPONIBLES } from '@/types';

interface AsignaturaFormData {
  nombre: string;
  alias: string;
  ratio: number;
  turnosSemanales: 1 | 2 | 3;
  duracionTurno: number;
  atributosRequeridos: string;
  tipo: 'individual' | 'colectiva' | '';
}

const emptyForm: AsignaturaFormData = {
  nombre: '',
  alias: '',
  ratio: 1,
  turnosSemanales: 1,
  duracionTurno: 60,
  atributosRequeridos: '',
  tipo: '',
};

export function AsignaturasManager() {
  const asignaturas = useAppStore((s) => s.asignaturas);
  const addAsignatura = useAppStore((s) => s.addAsignatura);
  const updateAsignatura = useAppStore((s) => s.updateAsignatura);
  const removeAsignatura = useAppStore((s) => s.removeAsignatura);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AsignaturaFormData>(emptyForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const atributosRequeridos = form.atributosRequeridos
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const data = {
      nombre: form.nombre,
      alias: form.alias || form.nombre,
      ratio: form.ratio,
      turnosSemanales: form.turnosSemanales,
      duracionTurno: form.duracionTurno,
      atributosRequeridos,
      tipo: form.tipo || undefined,
    } as Omit<Asignatura, 'id'>;

    if (editingId) {
      updateAsignatura(editingId, data);
      setEditingId(null);
    } else {
      addAsignatura(data);
    }
    setForm(emptyForm);
    setShowForm(false);
  };

  const startEdit = (asig: Asignatura) => {
    setEditingId(asig.id);
    setForm({
      nombre: asig.nombre,
      alias: asig.alias,
      ratio: asig.ratio,
      turnosSemanales: asig.turnosSemanales,
      duracionTurno: asig.duracionTurno,
      atributosRequeridos: asig.atributosRequeridos.join(', '),
      tipo: asig.tipo ?? '',
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
          Asignaturas ({asignaturas.length})
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Plus size={16} />
            Añadir Asignatura
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
                placeholder="Ej: Lenguaje Musical"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Alias (para Excel)
              </label>
              <input
                type="text"
                value={form.alias}
                onChange={(e) => setForm({ ...form, alias: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Ej: LM"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Ratio (alumnos/grupo) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={form.ratio}
                onChange={(e) =>
                  setForm({ ...form, ratio: Number(e.target.value) })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Turnos semanales *
              </label>
              <select
                value={form.turnosSemanales}
                onChange={(e) =>
                  setForm({
                    ...form,
                    turnosSemanales: Number(e.target.value) as 1 | 2 | 3,
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value={1}>1 turno</option>
                <option value={2}>2 turnos</option>
                <option value={3}>3 turnos</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Duración por turno *
              </label>
              <select
                value={form.duracionTurno}
                onChange={(e) =>
                  setForm({
                    ...form,
                    duracionTurno: Number(e.target.value),
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {DURACIONES_DISPONIBLES.map((d) => (
                  <option key={d} value={d}>
                    {formatearDuracion(d)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                value={form.tipo}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipo: e.target.value as 'individual' | 'colectiva' | '',
                  })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Sin especificar</option>
                <option value="individual">Individual</option>
                <option value="colectiva">Colectiva</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Atributos de aula requeridos (separados por coma)
              </label>
              <input
                type="text"
                value={form.atributosRequeridos}
                onChange={(e) =>
                  setForm({ ...form, atributosRequeridos: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Ej: piano, pantalla"
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

      {asignaturas.length === 0 ? (
        <p className="text-sm text-secondary">
          No hay asignaturas registradas.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-grid-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="px-4 py-3 font-medium text-gray-600">Alias</th>
                <th className="px-4 py-3 font-medium text-gray-600">Ratio</th>
                <th className="px-4 py-3 font-medium text-gray-600">Turnos</th>
                <th className="px-4 py-3 font-medium text-gray-600">Duración</th>
                <th className="px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="px-4 py-3 font-medium text-gray-600">Req. Aula</th>
                <th className="px-4 py-3 font-medium text-gray-600 w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grid-border">
              {asignaturas.map((asig) => (
                <tr key={asig.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{asig.nombre}</td>
                  <td className="px-4 py-3 text-secondary">{asig.alias}</td>
                  <td className="px-4 py-3">{asig.ratio}</td>
                  <td className="px-4 py-3">{asig.turnosSemanales}x/sem</td>
                  <td className="px-4 py-3">
                    {formatearDuracion(asig.duracionTurno)}
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {asig.tipo ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {asig.atributosRequeridos.map((attr) => (
                        <span
                          key={attr}
                          className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700"
                        >
                          {attr}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(asig)}
                        className="rounded p-1.5 text-secondary hover:bg-gray-200 hover:text-primary"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => removeAsignatura(asig.id)}
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
