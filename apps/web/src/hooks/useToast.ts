import { useToastStore } from '@/stores/useToastStore';

export function useToast() {
  const toasts = useToastStore((state) => state.toasts);
  const push = useToastStore((state) => state.push);
  const dismiss = useToastStore((state) => state.dismiss);
  return { toasts, push, dismiss };
}
