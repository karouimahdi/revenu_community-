// Ported from the mockup's ago(min) util. Callers need suppressHydrationWarning
// — SSR and hydration call this at different real moments, can cross a minute.
export function formatRelativeDate(iso: string): string {
  const minutes = (Date.now() - new Date(iso).getTime()) / 60_000;

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${Math.round(minutes)} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  const days = Math.round(hours / 24);
  return days === 1 ? 'hier' : `il y a ${days} j`;
}
