// The browser-side counterpart to lib/strapi's strapiFetch — calls one of
// this app's own Route Handlers (never Strapi directly)
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = (await response.json()) as unknown;

  if (!response.ok) {
    const message = (body as { message?: string }).message ?? 'Une erreur est survenue.';
    throw new Error(message);
  }

  return body as T;
}
