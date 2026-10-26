'use client';

import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { Avatar } from '@/components/Avatar';
import { HelpIcon, MessageIcon, UserIcon } from '@/components/icons';


export function ComposerBar() {
  const { user, isAuthenticated } = useSession();

  return (
    <div className="mb-4">
      {isAuthenticated && user ? (
        <h1 className="mb-3 font-display text-[26px] font-bold text-ink">Bonjour {user.username}</h1>
      ) : null}

      <div className="flex items-center gap-3 rounded-[14px] border border-hairline bg-surface p-2.5 shadow-card">
        {isAuthenticated && user ? (
          <Avatar username={user.username} size="md" />
        ) : (
          <span className="inline-grid h-10 w-10 flex-none place-items-center rounded-full bg-surface-2 text-ink-3">
            <UserIcon className="h-5 w-5" />
          </span>
        )}

        <Link
          href="/discussions/new"
          prefetch={false}
          className="min-w-0 flex-1 truncate rounded-[10px] bg-surface-2 px-3.5 py-2.5 text-[14.5px] text-ink-3 hover:bg-black/[.06]"
        >
          Posez votre question à la communauté…
        </Link>

        <div className="hidden flex-none gap-1 sm:flex">
          <Link
            href="/discussions/new?type=question"
            prefetch={false}
            className="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[13.5px] font-medium text-ink-2 hover:bg-surface-2"
          >
            <HelpIcon className="h-4 w-4" />
            Question
          </Link>
          <Link
            href="/discussions/new?type=discussion"
            prefetch={false}
            className="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[13.5px] font-medium text-ink-2 hover:bg-surface-2"
          >
            <MessageIcon className="h-4 w-4" />
            Discussion
          </Link>
        </div>
      </div>
    </div>
  );
}
