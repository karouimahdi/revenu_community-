// Single source of truth for the session cookie's name — read by the
// Route Handlers, app/session-boundary.tsx, and (Phase 9) the login/logout
// Server Actions that set and clear it.
export const SESSION_COOKIE_NAME = 'session';
