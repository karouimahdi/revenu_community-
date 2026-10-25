'use client';

import { useState, type FormEvent } from 'react';
import { useCreateReply } from '@/hooks/useCreateReply';
import { useSession } from '@/hooks/useSession';
import { Avatar } from '@/components/Avatar';

export function ReplyForm({ documentId }: { documentId: string }) {
  const [content, setContent] = useState('');
  const { user } = useSession();
  const { mutate, isPending } = useCreateReply(documentId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    mutate(trimmed);
    setContent('');
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[14px] border border-line bg-surface p-4 shadow-card">
      <div className="mb-2 flex items-center gap-2 text-sm text-ink-3">
        <Avatar username={user?.username ?? '?'} size="sm" />
        <span>
          Répondre en tant que <b className="text-ink">{user?.username}</b>
        </span>
      </div>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Votre réponse…"
        rows={3}
        className="w-full resize-none rounded-[9px] border border-line p-3 text-[15px] text-ink outline-none focus:border-brand"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="rounded-[9px] bg-brand px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Publier ma réponse
        </button>
      </div>
    </form>
  );
}
