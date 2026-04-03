import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { isBrowser } from '@/lib/environment';

export function PWAUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!isBrowser() || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/ContraTiempo/sw.js').then((registration) => {
      // Check for waiting worker on load
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowUpdate(true);
      }

      // Listen for new worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShowUpdate(true);
          }
        });
      });
    });

    // Reload when new worker takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  if (!showUpdate) return null;

  const handleUpdate = () => {
    waitingWorker?.postMessage('SKIP_WAITING');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-primary bg-white px-4 py-3 shadow-lg">
      <RefreshCw size={16} className="text-primary" />
      <span className="text-sm text-gray-700">Nueva version disponible</span>
      <button
        onClick={handleUpdate}
        className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-dark"
      >
        Actualizar
      </button>
      <button
        onClick={() => setShowUpdate(false)}
        className="text-gray-400 hover:text-gray-600"
      >
        <X size={14} />
      </button>
    </div>
  );
}
