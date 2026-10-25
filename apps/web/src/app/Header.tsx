import Link from 'next/link';

// Static for now — not session-aware. Phase 9 swaps "Se connecter" for an
// avatar/logout once the login flow exists.
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-[62px] max-w-3xl items-center gap-4 px-4">
        <Link href="/" className="font-display text-xl font-black text-brand">
          Le Revenu
        </Link>
        <span className="hidden text-sm font-semibold text-ink-2 sm:inline">Communauté</span>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-[9px] px-3 py-1.5 text-sm font-semibold text-ink-2 hover:bg-black/5"
          >
            Se connecter
          </Link>
          <Link
            href="/discussions/new"
            className="rounded-[9px] bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            Publier
          </Link>
        </div>
      </div>
    </header>
  );
}
