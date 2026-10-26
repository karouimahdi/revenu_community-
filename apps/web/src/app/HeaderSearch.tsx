'use client';

import { useRef, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from '@/components/icons';

export function HeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialValue = searchParams.get('q') ?? '';
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = (inputRef.current?.value ?? '').trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/');
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex h-9 min-w-0 flex-1 max-w-[420px] items-center gap-2 rounded-[10px] border border-transparent bg-black/5 px-3 text-sm text-ink-3 transition-colors focus-within:border-brand focus-within:bg-surface focus-within:shadow-[0_0_0_3px_rgba(235,15,15,0.25)]"
    >
      <SearchIcon className="h-4 w-4 flex-none" />
      <input
        ref={inputRef}
        key={initialValue}
        defaultValue={initialValue}
        name="q"
        placeholder="Rechercher une discussion, un sujet…"
        autoComplete="off"
        className="h-full min-w-0 flex-1 border-0 bg-transparent text-ink outline-none placeholder:text-ink-3"
      />
    </form>
  );
}
