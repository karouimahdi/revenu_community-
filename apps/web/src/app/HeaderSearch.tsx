'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon } from '@/components/icons';

const DEBOUNCE_MS = 400;

export function HeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeValue = searchParams.get('q') ?? '';
  const [value, setValue] = useState(activeValue);
  const [syncedValue, setSyncedValue] = useState(activeValue);

  // Resets local state when the URL's `q` changes elsewhere (back/forward,
  // a link) — done during render, not an effect, per React's own guidance.
  if (activeValue !== syncedValue) {
    setSyncedValue(activeValue);
    setValue(activeValue);
  }

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === activeValue) return;

    const timeout = setTimeout(() => {
      router.replace(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/', { scroll: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [value, activeValue, router]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
  }

  // Enter still works, immediately, instead of waiting out the debounce.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    router.replace(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/', { scroll: false });
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex h-9 min-w-0 flex-1 max-w-[420px] items-center gap-2 rounded-[10px] border border-transparent bg-black/5 px-3 text-sm text-ink-3 transition-colors focus-within:border-brand focus-within:bg-surface focus-within:shadow-[0_0_0_3px_rgba(235,15,15,0.25)]"
    >
      <SearchIcon className="h-4 w-4 flex-none" />
      <input
        value={value}
        onChange={handleChange}
        name="q"
        placeholder="Rechercher une discussion, un sujet…"
        autoComplete="off"
        className="h-full min-w-0 flex-1 border-0 bg-transparent text-ink outline-none placeholder:text-ink-3"
      />
    </form>
  );
}
