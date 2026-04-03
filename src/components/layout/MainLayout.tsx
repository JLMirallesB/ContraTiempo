import { Sidebar } from './Sidebar';
import { useAppStore } from '@/stores/useAppStore';
import { VistaGeneral } from '@/components/views/VistaGeneral';
import { VistaConfig } from '@/components/views/VistaConfig';
import { VistaAula } from '@/components/views/VistaAula';
import { VistaDocente } from '@/components/views/VistaDocente';
import { VistaAsignatura } from '@/components/views/VistaAsignatura';
import { VistaValidaciones } from '@/components/views/VistaValidaciones';
import { VistaHerramientas } from '@/components/views/VistaHerramientas';
import { FranjaPanel } from '@/components/grid/FranjaPanel';

export function MainLayout() {
  const vistaActual = useAppStore((s) => s.vistaActual);
  const panelAbierto = useAppStore((s) => s.panelFranjaAbierto);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-4">
          {vistaActual === 'general' && <VistaGeneral />}
          {vistaActual === 'config' && <VistaConfig />}
          {vistaActual === 'aula' && <VistaAula />}
          {vistaActual === 'docente' && <VistaDocente />}
          {vistaActual === 'asignatura' && <VistaAsignatura />}
          {vistaActual === 'validaciones' && <VistaValidaciones />}
          {vistaActual === 'herramientas' && <VistaHerramientas />}
        </div>
        {panelAbierto && <FranjaPanel />}
      </main>
    </div>
  );
}

