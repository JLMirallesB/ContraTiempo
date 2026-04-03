/**
 * Sync de datos via JSON en Tauri (acceso directo al sistema de archivos).
 * Se conecta con los comandos Rust definidos en src-tauri/src/main.rs.
 * Este modulo solo se importa si isTauri() es true.
 */

import { validateSyncData, type SyncData } from '../../shared/sync';
import { stateToSyncData, syncDataToState } from './syncSchema';

// Tauri v2 API (import dinamico — solo se ejecuta dentro de Tauri)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function invoke(cmd: string, args?: Record<string, unknown>): Promise<any> {
  // Dynamic import to avoid build errors when Tauri is not installed
  const mod = await (Function('return import("@tauri-apps/api/core")')() as Promise<{ invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }>);
  return mod.invoke(cmd, args);
}

export async function readData(): Promise<SyncData | null> {
  try {
    await invoke('ensure_data_dir');
    const json = await invoke('read_sync_data') as string;
    if (!json) return null;
    const data = JSON.parse(json);
    if (!validateSyncData(data)) return null;
    return data as SyncData;
  } catch {
    return null;
  }
}

export async function writeData(): Promise<void> {
  const data = stateToSyncData();
  const json = JSON.stringify(data, null, 2);
  await invoke('ensure_data_dir');
  await invoke('write_sync_data', { data: json });
}

export async function loadFromDiskIfNewer(lastSyncTimestamp: string): Promise<boolean> {
  const data = await readData();
  if (!data) return false;
  if (data.lastModified > lastSyncTimestamp) {
    syncDataToState(data);
    return true;
  }
  return false;
}

/**
 * Placeholder para file watcher. Se implementara completamente con Tauri.
 * Por ahora retorna una funcion de limpieza no-op.
 */
export function watchForChanges(_onUpdate: () => void): () => void {
  // TODO: Implementar con @tauri-apps/plugin-fs watch cuando Tauri este integrado
  return () => {};
}
