'use client';

import { useEffect } from 'react';
import { useToastStore, type Toast } from '@/stores/useToastStore';

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const timeout = setTimeout(() => dismiss(toast.id), 4000);
    return () => clearTimeout(timeout);
  }, [toast.id, dismiss]);

  return (
    <div
      role="status"
      onClick={() => dismiss(toast.id)}
      className={`cursor-pointer rounded-[9px] px-4 py-2.5 text-sm font-medium text-white shadow-card-lg ${
        toast.variant === 'error' ? 'bg-alert' : 'bg-ok'
      }`}
    >
      {toast.message}
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
