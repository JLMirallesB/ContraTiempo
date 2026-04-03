/**
 * Factory de sincronizacion: retorna la implementacion correcta segun el entorno.
 */

import { isTauri } from '@/lib/environment';

export type { SyncData } from '../../shared/sync';

export async function exportJSON(): Promise<void> {
  if (isTauri()) {
    const { writeData } = await import('./fileSyncTauri');
    return writeData();
  }
  const { exportJSON: browserExport } = await import('./fileSyncBrowser');
  return browserExport();
}

export async function importJSON(): Promise<boolean> {
  if (isTauri()) {
    const { loadFromDiskIfNewer } = await import('./fileSyncTauri');
    return loadFromDiskIfNewer('1970-01-01T00:00:00Z');
  }
  const { importJSON: browserImport } = await import('./fileSyncBrowser');
  return browserImport();
}
