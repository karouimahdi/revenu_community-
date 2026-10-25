import { listDiscussions } from '@/lib/strapi/discussions';

export async function ServerDiscussionsList() {
  const result = await listDiscussions({ pageSize: 5 });

  if (result.data.length === 0) {
    return <p>Aucune discussion (base vide ?).</p>;
  }

  return (
    <ul className="list-disc pl-5">
      {result.data.map((discussion) => (
        <li key={discussion.documentId}>
          {discussion.title} — {discussion.repliesCount} réponse(s) — {discussion.category?.name ?? 'sans catégorie'}
        </li>
      ))}
    </ul>
  );
}
