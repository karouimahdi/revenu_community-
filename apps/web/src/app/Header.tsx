import { Suspense } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getMe } from '@/lib/strapi/auth';
import { SESSION_COOKIE_NAME } from '@/lib/session';
import { Avatar } from '@/components/Avatar';
import { PlusIcon, UserIcon } from '@/components/icons';
import { logoutAction } from './actions';
import { HeaderSearch } from './HeaderSearch';

async function HeaderSessionActions() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  let username: string | null = null;
  if (token) {
    try {
      username = (await getMe(token)).username;
    } catch {
      username = null;
    }
  }

  if (!username) {
    return (
      <Link
        href="/login"
        aria-label="Se connecter"
        className="inline-grid h-9 w-9 flex-none place-items-center rounded-[9px] text-ink-2 hover:bg-black/5 hover:text-ink"
      >
        <UserIcon className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <form action={logoutAction} className="flex flex-none items-center gap-2 rounded-full border border-hairline bg-surface py-[3px] pl-[3px] pr-2 shadow-card">
      <Avatar username={username} size="xs" />
      <span className="text-sm font-semibold text-ink-2">{username}</span>
      <button type="submit" className="text-sm font-medium text-ink-3 hover:text-ink">
        Déconnexion
      </button>
    </form>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-[62px] max-w-full items-center gap-5 px-4">
        <Link href="/" className="flex flex-none items-center gap-2.5">
          <span className="inline-flex items-stretch bg-brand p-[0.1em] text-[22px] leading-none">
            <span className="mr-[0.12em] bg-black px-[0.1em] py-[0.12em] text-[1em] leading-none font-black tracking-[-0.02em] text-white">
              LE
            </span>
            <span className="px-[0.1em] py-[0.12em] text-[1em] leading-none font-black tracking-[-0.02em] text-white">
              REVENU
            </span>
          </span>
          <span className="hidden h-5 w-px bg-[#c7c7cc] sm:block" />
          <span className="hidden text-[15px] font-semibold text-ink-2 sm:inline">Communauté</span>
        </Link>

        <Suspense
          fallback={<div className="h-9 min-w-0 flex-1 max-w-[420px] rounded-[10px] bg-black/5" />}
        >
          <HeaderSearch />
        </Suspense>

        <div className="ml-auto flex flex-none items-center gap-2.5">
          <Link
            href="/discussions/new"
            prefetch={false}
            className="inline-flex h-9 flex-none items-center gap-1.5 rounded-[9px] bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            <PlusIcon className="h-4 w-4" />
            Publier
          </Link>
          <Suspense
            fallback={
              <span className="inline-grid h-9 w-9 place-items-center text-ink-2">
                <UserIcon className="h-5 w-5" />
              </span>
            }
          >
            <HeaderSessionActions />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
