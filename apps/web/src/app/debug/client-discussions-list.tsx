'use client';

import { useDiscussions } from '@/hooks/useDiscussions';

export function ClientDiscussionsList() {
  const { data, isPending, error } = useDiscussions({ pageSize: 5 });

  if (isPending) return <p>Chargement…</p>;
  if (error) return <p>Erreur : {error.message}</p>;

  if (data.data.length === 0) {
    return <p>Aucune discussion (base vide ?).</p>;
  }

  return (
    <ul className="list-disc pl-5">
      {data.data.map((discussion) => (
        <li key={discussion.documentId}>
          {discussion.title} — {discussion.repliesCount} réponse(s) — {discussion.category?.name ?? 'sans catégorie'}
        </li>
      ))}
    </ul>
  );
}
