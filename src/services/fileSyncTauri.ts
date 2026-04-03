/**
 * Sync de datos via JSON en Tauri (acceso directo al sistema de archivos).
 * Se conecta con los comandos Rust definidos en src-tauri/src/lib.rs.
 * Solo se importa dinamicamente si isTauri() es true.
 */

import { invoke } from '@tauri-apps/api/core';
import { watch } from '@tauri-apps/plugin-fs';
import { validateSyncData, type SyncData } from '../../shared/sync';
import { stateToSyncData, syncDataToState } from './syncSchema';

export async function readData(): Promise<SyncData | null> {
  try {
    await invoke('ensure_data_dir');
    const json = await invoke<string>('read_sync_data');
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
 * Vigila cambios en ~/.contratiempo/data.json.
 * Cuando el MCP server modifica el archivo, recarga datos en la app.
 */
export function watchForChanges(onUpdate: () => void): () => void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let unwatch: (() => void) | null = null;

  (async () => {
    try {
      const dir = await invoke<string>('ensure_data_dir');
      const unwatchFn = await watch(dir, () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(onUpdate, 500);
      }, { recursive: false });
      unwatch = () => unwatchFn();
    } catch {
      // Watch not available — silently ignore
    }
  })();

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (unwatch) unwatch();
  };
}
