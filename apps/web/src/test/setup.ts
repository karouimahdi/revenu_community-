import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useSessionStore } from '@/stores/useSessionStore';
import { useToastStore } from '@/stores/useToastStore';

// Zustand stores are module-level singletons — reset here or a logged-in
// session leaks into the next test's initial render.
afterEach(() => {
  cleanup();
  useSessionStore.setState({ user: null, isAuthenticated: false });
  useToastStore.setState({ toasts: [] });
});
