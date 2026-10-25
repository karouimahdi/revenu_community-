export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="px-5 py-10 text-center text-ink-2">
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {description && <p className="mt-1.5 text-sm">{description}</p>}
    </div>
  );
}
