import { useMemo } from 'react';
import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useAppStore, useFranjasActivas } from '@/stores/useAppStore';
import { detectarConflictos } from '@/services/validators/conflictDetector';
import { calcularHorasDocentes, generarAvisosHoras } from '@/services/validators/hoursCalculator';
import type { ResultadoValidacion } from '@/types';

export function VistaValidaciones() {
  const franjas = useFranjasActivas();
  const aulas = useAppStore((s) => s.aulas);
  const docentes = useAppStore((s) => s.docentes);

  const validaciones = useMemo((): ResultadoValidacion[] => {
    const conflictos = detectarConflictos(franjas, aulas, docentes);
    const resumenes = calcularHorasDocentes(franjas, docentes);
    const avisosHoras = generarAvisosHoras(resumenes);
    return [...conflictos, ...avisosHoras];
  }, [franjas, aulas, docentes]);

  const errores = validaciones.filter((v) => v.severidad === 'error');
  const avisos = validaciones.filter((v) => v.severidad === 'aviso');

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-gray-800">Validaciones</h2>

      {/* Resumen */}
      <div className="mb-6 flex gap-3">
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 ${errores.length > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          {errores.length > 0 ? (
            <XCircle size={20} className="text-error" />
          ) : (
            <CheckCircle size={20} className="text-success" />
          )}
          <div>
            <p className="text-lg font-bold">{errores.length}</p>
            <p className="text-xs text-gray-600">Errores</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 ${avisos.length > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
          {avisos.length > 0 ? (
            <AlertTriangle size={20} className="text-warning" />
          ) : (
            <CheckCircle size={20} className="text-success" />
          )}
          <div>
            <p className="text-lg font-bold">{avisos.length}</p>
            <p className="text-xs text-gray-600">Avisos</p>
          </div>
        </div>
      </div>

      {validaciones.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-6">
          <CheckCircle size={24} className="text-success" />
          <p className="text-sm font-medium text-green-800">
            No se han detectado conflictos ni avisos. El horario es correcto.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {errores.map((v) => (
            <ValidationItem key={v.id} validacion={v} />
          ))}
          {avisos.map((v) => (
            <ValidationItem key={v.id} validacion={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function ValidationItem({ validacion }: { validacion: ResultadoValidacion }) {
  const isError = validacion.severidad === 'error';

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
        isError
          ? 'border-red-200 bg-red-50'
          : 'border-amber-200 bg-amber-50'
      }`}
    >
      {isError ? (
        <XCircle size={16} className="mt-0.5 shrink-0 text-error" />
      ) : (
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
      )}
      <div>
        <p className={`text-sm font-medium ${isError ? 'text-red-800' : 'text-amber-800'}`}>
          {validacion.mensaje}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {validacion.entidadTipo}
        </p>
      </div>
    </div>
  );
}
