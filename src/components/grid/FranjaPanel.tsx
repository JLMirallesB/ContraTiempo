import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { useAppStore, useFranjasActivas, useEscenarioActivo } from '@/stores/useAppStore';
import { generarFranjasHorarias, sumarMinutos } from '@/services/timeUtils';
import { DIAS_SEMANA, DIAS_SEMANA_LABEL, DURACIONES_DISPONIBLES, type DiaSemana } from '@/types';

type TipoFranja = 'clase' | 'ocupacion';

interface FormData {
  tipoFranja: TipoFranja;
  asignaturaId: string;
  docenteId: string;
  aulaId: string;
  dia: DiaSemana;
  horaInicio: string;
  duracion: number;
  tipoOcupacionId: string;
  descripcion: string;
}

const emptyForm: FormData = {
  tipoFranja: 'clase',
  asignaturaId: '',
  docenteId: '',
  aulaId: '',
  dia: 'lunes',
  horaInicio: '08:00',
  duracion: 60,
  tipoOcupacionId: '',
  descripcion: '',
};

export function FranjaPanel() {
  const panelAbierto = useAppStore((s) => s.panelFranjaAbierto);
  const franjaEditandoId = useAppStore((s) => s.franjaEditandoId);
  const prellenado = useAppStore((s) => s.panelPrellenado);
  const setPanelFranjaAbierto = useAppStore((s) => s.setPanelFranjaAbierto);
  const addFranja = useAppStore((s) => s.addFranja);
  const updateFranja = useAppStore((s) => s.updateFranja);
  const removeFranja = useAppStore((s) => s.removeFranja);

  const aulas = useAppStore((s) => s.aulas);
  const docentes = useAppStore((s) => s.docentes);
  const asignaturas = useAppStore((s) => s.asignaturas);
  const tiposOcupacion = useAppStore((s) => s.tiposOcupacion);
  const franjas = useFranjasActivas();
  const escenario = useEscenarioActivo();

  const [form, setForm] = useState<FormData>(emptyForm);

  const config = escenario?.configuracion;
  const horasDisponibles = config
    ? generarFranjasHorarias(config.horaInicio, config.horaFin)
    : [];

  // Efecto para cargar datos al editar o al prellenar
  useEffect(() => {
    if (franjaEditandoId) {
      const franja = franjas.find((f) => f.id === franjaEditandoId);
      if (franja) {
        const inicio = franja.horaInicio;
        const fin = franja.horaFin;
        const durMin =
          (parseInt(fin.split(':')[0]) * 60 + parseInt(fin.split(':')[1])) -
          (parseInt(inicio.split(':')[0]) * 60 + parseInt(inicio.split(':')[1]));

        if (franja.tipo === 'clase') {
          setForm({
            tipoFranja: 'clase',
            asignaturaId: franja.asignaturaId,
            docenteId: franja.docenteId,
            aulaId: franja.aulaId,
            dia: franja.dia,
            horaInicio: franja.horaInicio,
            duracion: durMin,
            tipoOcupacionId: '',
            descripcion: '',
          });
        } else {
          setForm({
            tipoFranja: 'ocupacion',
            asignaturaId: '',
            docenteId: franja.docenteId,
            aulaId: franja.aulaId ?? '',
            dia: franja.dia,
            horaInicio: franja.horaInicio,
            duracion: durMin,
            tipoOcupacionId: franja.tipoOcupacionId,
            descripcion: franja.descripcion ?? '',
          });
        }
      }
    } else if (prellenado) {
      setForm({
        ...emptyForm,
        dia: prellenado.dia ?? 'lunes',
        horaInicio: prellenado.horaInicio ?? '08:00',
        aulaId: prellenado.aulaId ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [franjaEditandoId, prellenado, franjas]);

  if (!panelAbierto) return null;

  const isEditing = franjaEditandoId !== null;
  const horaFin = sumarMinutos(form.horaInicio, form.duracion);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fin = sumarMinutos(form.horaInicio, form.duracion);

    if (isEditing) {
      if (form.tipoFranja === 'clase') {
        updateFranja(franjaEditandoId!, {
          asignaturaId: form.asignaturaId,
          docenteId: form.docenteId,
          aulaId: form.aulaId,
          dia: form.dia,
          horaInicio: form.horaInicio,
          horaFin: fin,
        });
      } else {
        updateFranja(franjaEditandoId!, {
          tipoOcupacionId: form.tipoOcupacionId,
          docenteId: form.docenteId,
          aulaId: form.aulaId || undefined,
          dia: form.dia,
          horaInicio: form.horaInicio,
          horaFin: fin,
          descripcion: form.descripcion || undefined,
        });
      }
    } else {
      if (form.tipoFranja === 'clase') {
        addFranja({
          tipo: 'clase',
          asignaturaId: form.asignaturaId,
          docenteId: form.docenteId,
          aulaId: form.aulaId,
          dia: form.dia,
          horaInicio: form.horaInicio,
          horaFin: fin,
        });
      } else {
        addFranja({
          tipo: 'ocupacion',
          tipoOcupacionId: form.tipoOcupacionId,
          docenteId: form.docenteId,
          aulaId: form.aulaId || undefined,
          dia: form.dia,
          horaInicio: form.horaInicio,
          horaFin: fin,
          descripcion: form.descripcion || undefined,
        });
      }
    }
    setPanelFranjaAbierto(false);
  };

  const handleDelete = () => {
    if (franjaEditandoId) {
      removeFranja(franjaEditandoId);
      setPanelFranjaAbierto(false);
    }
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-grid-border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-grid-border px-4 py-3">
        <h3 className="font-semibold text-gray-800">
          {isEditing ? 'Editar Franja' : 'Nueva Franja'}
        </h3>
        <button
          onClick={() => setPanelFranjaAbierto(false)}
          className="rounded p-1 text-secondary hover:bg-gray-100"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {/* Tipo */}
          {!isEditing && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
              <div className="flex gap-1 rounded-md bg-gray-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tipoFranja: 'clase' })}
                  className={`flex-1 rounded px-3 py-1.5 text-xs font-medium ${form.tipoFranja === 'clase' ? 'bg-clase text-blue-800 shadow-sm' : 'text-secondary'}`}
                >
                  Clase
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tipoFranja: 'ocupacion' })}
                  className={`flex-1 rounded px-3 py-1.5 text-xs font-medium ${form.tipoFranja === 'ocupacion' ? 'bg-ocupacion text-amber-800 shadow-sm' : 'text-secondary'}`}
                >
                  Ocupación
                </button>
              </div>
            </div>
          )}

          {/* Asignatura (clase) o Tipo ocupacion */}
          {form.tipoFranja === 'clase' ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Asignatura *</label>
              <select
                required
                value={form.asignaturaId}
                onChange={(e) => setForm({ ...form, asignaturaId: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">Seleccionar...</option>
                {asignaturas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tipo Ocupación *</label>
              <select
                required
                value={form.tipoOcupacionId}
                onChange={(e) => setForm({ ...form, tipoOcupacionId: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">Seleccionar...</option>
                {tiposOcupacion.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Docente */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Docente *</label>
            <select
              required
              value={form.docenteId}
              onChange={(e) => setForm({ ...form, docenteId: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Seleccionar...</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>

          {/* Aula */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Aula {form.tipoFranja === 'clase' ? '*' : '(opcional)'}
            </label>
            <select
              required={form.tipoFranja === 'clase'}
              value={form.aulaId}
              onChange={(e) => setForm({ ...form, aulaId: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Seleccionar...</option>
              {aulas.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}{a.sede ? ` (${a.sede})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Dia */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Día *</label>
            <select
              required
              value={form.dia}
              onChange={(e) => setForm({ ...form, dia: e.target.value as DiaSemana })}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              {DIAS_SEMANA.map((d) => (
                <option key={d} value={d}>{DIAS_SEMANA_LABEL[d]}</option>
              ))}
            </select>
          </div>

          {/* Hora inicio */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Hora inicio *</label>
            <select
              required
              value={form.horaInicio}
              onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              {horasDisponibles.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* Duracion */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Duración * → termina a las {horaFin}
            </label>
            <select
              required
              value={form.duracion}
              onChange={(e) => setForm({ ...form, duracion: Number(e.target.value) })}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              {DURACIONES_DISPONIBLES.map((d) => (
                <option key={d} value={d}>
                  {d < 60 ? `${d} min` : d % 60 === 0 ? `${d / 60}h` : `${Math.floor(d / 60)}h ${d % 60}min`}
                </option>
              ))}
            </select>
          </div>

          {/* Descripcion (solo ocupacion) */}
          {form.tipoFranja === 'ocupacion' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Descripción</label>
              <input
                type="text"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                placeholder="Descripción opcional"
              />
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Save size={14} />
            {isEditing ? 'Guardar' : 'Crear'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-error hover:bg-red-200"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
