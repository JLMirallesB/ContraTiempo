import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import type { Aula, ReservableAula } from '@/types';

interface AulaFormData {
  codigo: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  descripcion: string;
  atributos: string;
  sede: string;
  piso: string;
  reservable: ReservableAula;
  gestionadaPor: string;
  observaciones: string;
}

const emptyForm: AulaFormData = {
  codigo: '',
  nombre: '',
  tipo: '',
  capacidad: 0,
  descripcion: '',
  atributos: '',
  sede: '',
  piso: '',
  reservable: 'no',
  gestionadaPor: '',
  observaciones: '',
};

export function AulasManager() {
  const aulas = useAppStore((s) => s.aulas);
  const addAula = useAppStore((s) => s.addAula);
  const updateAula = useAppStore((s) => s.updateAula);
  const removeAula = useAppStore((s) => s.removeAula);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AulaFormData>(emptyForm);

  const sedesExistentes = useMemo(
    () => [...new Set(aulas.map((a) => a.sede).filter(Boolean))].sort(),
    [aulas],
  );
  const pisosExistentes = useMemo(
    () => [...new Set(aulas.map((a) => a.piso).filter(Boolean))].sort(),
    [aulas],
  );
  const tiposExistentes = useMemo(
    () => [...new Set(aulas.map((a) => a.tipo).filter(Boolean))].sort(),
    [aulas],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const atributos = form.atributos
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const data = {
      codigo: form.codigo,
      nombre: form.nombre,
      tipo: form.tipo,
      capacidad: form.capacidad,
      descripcion: form.descripcion,
      atributos,
      sede: form.sede,
      piso: form.piso,
      reservable: form.reservable,
      gestionadaPor: form.gestionadaPor,
      observaciones: form.observaciones,
    };

    if (editingId) {
      updateAula(editingId, data);
      setEditingId(null);
    } else {
      addAula(data);
    }
    setForm(emptyForm);
    setShowForm(false);
  };

  const startEdit = (aula: Aula) => {
    setEditingId(aula.id);
    setForm({
      codigo: aula.codigo ?? '',
      nombre: aula.nombre,
      tipo: aula.tipo ?? '',
      capacidad: aula.capacidad,
      descripcion: aula.descripcion,
      atributos: aula.atributos.join(', '),
      sede: aula.sede ?? '',
      piso: aula.piso ?? '',
      reservable: aula.reservable ?? 'no',
      gestionadaPor: aula.gestionadaPor ?? '',
      observaciones: aula.observaciones ?? '',
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const inp = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700">Aulas ({aulas.length})</h3>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
            <Plus size={16} /> Añadir Aula
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-grid-border bg-gray-50 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Código</label>
              <input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className={inp} placeholder="Ej: A01" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nombre *</label>
              <input type="text" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={inp} placeholder="Ej: Aula 1" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
              <input type="text" list="tipos-aula-list" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inp} placeholder="Ej: Aula, Auditorio" />
              <datalist id="tipos-aula-list">{tiposExistentes.map((t) => <option key={t} value={t} />)}</datalist>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Sede</label>
              <input type="text" list="sedes-list" value={form.sede} onChange={(e) => setForm({ ...form, sede: e.target.value })} className={inp} placeholder="Ej: Sede Central" />
              <datalist id="sedes-list">{sedesExistentes.map((s) => <option key={s} value={s} />)}</datalist>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Piso</label>
              <input type="text" list="pisos-list" value={form.piso} onChange={(e) => setForm({ ...form, piso: e.target.value })} className={inp} placeholder="Ej: Planta 1" />
              <datalist id="pisos-list">{pisosExistentes.map((p) => <option key={p} value={p} />)}</datalist>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Capacidad</label>
              <input type="number" min={0} value={form.capacidad} onChange={(e) => setForm({ ...form, capacidad: Number(e.target.value) })} className={inp} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Reservable</label>
              <select value={form.reservable} onChange={(e) => setForm({ ...form, reservable: e.target.value as ReservableAula })} className={inp}>
                <option value="no">No</option>
                <option value="directa">Directa</option>
                <option value="con-aprobacion">Con aprobación</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Gestionada por</label>
              <input type="text" value={form.gestionadaPor} onChange={(e) => setForm({ ...form, gestionadaPor: e.target.value })} className={inp} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Atributos (coma)</label>
              <input type="text" value={form.atributos} onChange={(e) => setForm({ ...form, atributos: e.target.value })} className={inp} placeholder="piano, pantalla" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
              <input type="text" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className={inp} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Observaciones</label>
              <input type="text" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className={inp} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
              <Check size={16} /> {editingId ? 'Guardar' : 'Añadir'}
            </button>
            <button type="button" onClick={cancelForm} className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
              <X size={16} /> Cancelar
            </button>
          </div>
        </form>
      )}

      {aulas.length === 0 ? (
        <p className="text-sm text-secondary">No hay aulas registradas.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-grid-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 font-medium text-gray-600">Código</th>
                <th className="px-3 py-3 font-medium text-gray-600">Nombre</th>
                <th className="px-3 py-3 font-medium text-gray-600">Sede</th>
                <th className="px-3 py-3 font-medium text-gray-600">Piso</th>
                <th className="px-3 py-3 font-medium text-gray-600">Cap.</th>
                <th className="px-3 py-3 font-medium text-gray-600">Tipo</th>
                <th className="px-3 py-3 font-medium text-gray-600">Atributos</th>
                <th className="px-3 py-3 font-medium text-gray-600 w-20">Acc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grid-border">
              {aulas.map((aula) => (
                <tr key={aula.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-secondary">{aula.codigo || '—'}</td>
                  <td className="px-3 py-2 font-medium">{aula.nombre}</td>
                  <td className="px-3 py-2 text-secondary">{aula.sede || '—'}</td>
                  <td className="px-3 py-2 text-secondary">{aula.piso || '—'}</td>
                  <td className="px-3 py-2">{aula.capacidad}</td>
                  <td className="px-3 py-2 text-secondary">{aula.tipo || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {aula.atributos.map((attr) => (
                        <span key={attr} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{attr}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(aula)} className="rounded p-1.5 text-secondary hover:bg-gray-200 hover:text-primary"><Pencil size={14} /></button>
                      <button onClick={() => removeAula(aula.id)} className="rounded p-1.5 text-secondary hover:bg-red-100 hover:text-error"><Trash2 size={14} /></button>
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
