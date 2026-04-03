/**
 * Sync de datos via JSON en navegador.
 * Usa File System Access API (Chrome) con fallback a blob download / file input.
 */

import { validateSyncData, type SyncData } from '../../shared/sync';
import { stateToSyncData, syncDataToState } from './syncSchema';

export async function exportJSON(): Promise<void> {
  const data = stateToSyncData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  // Try File System Access API (Chrome 86+)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> })
        .showSaveFilePicker({
          suggestedName: 'contratiempo-data.json',
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
        });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return; // User cancelled
    }
  }

  // Fallback: blob download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contratiempo-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJSON(): Promise<boolean> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { resolve(false); return; }

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!validateSyncData(data)) {
          alert('El archivo no tiene el formato esperado de ContraTiempo.');
          resolve(false);
          return;
        }
        syncDataToState(data as SyncData);
        resolve(true);
      } catch {
        alert('Error al leer el archivo JSON.');
        resolve(false);
      }
    };
    input.click();
  });
}
