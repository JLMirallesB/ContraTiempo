/**
 * Lee/escribe ~/.contratiempo/data.json con escritura atomica.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { SYNC_VERSION, type SyncData, createEmptySyncData, validateSyncData } from '../../shared/sync.js';

const DATA_DIR = join(homedir(), '.contratiempo');
const DATA_FILE = join(DATA_DIR, 'data.json');

export function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readSyncData(): SyncData {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) {
    return createEmptySyncData();
  }
  try {
    const json = readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(json);
    if (!validateSyncData(data)) {
      return createEmptySyncData();
    }
    return data;
  } catch {
    return createEmptySyncData();
  }
}

export function writeSyncData(data: SyncData): void {
  ensureDataDir();
  data.lastModified = new Date().toISOString();
  data.version = SYNC_VERSION;
  const json = JSON.stringify(data, null, 2);
  // Atomic write: write to temp file, then rename
  const tmpFile = DATA_FILE + '.tmp';
  writeFileSync(tmpFile, json, 'utf-8');
  renameSync(tmpFile, DATA_FILE);
}
