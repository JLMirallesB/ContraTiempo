/**
 * Deteccion de entorno de ejecucion.
 */

export function isTauri(): boolean {
  return typeof window !== 'undefined' &&
    ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);
}

export function isBrowser(): boolean {
  return !isTauri();
}

export function getEnvironmentLabel(): 'Escritorio' | 'Web' {
  return isTauri() ? 'Escritorio' : 'Web';
}
