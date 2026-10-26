import { CategoryIcon } from './categoryVisuals';
import type { Category } from '@/lib/strapi/schemas';

interface CategoriesGridProps {
  categories: Category[];
  onSelect: (categorySlug: string) => void;
}

// Mockup's viewSpaces/.spaces-grid. Dropped the per-category discussion/reply
// counts shown there — that's fixture data in the mockup, and we have no
// cheap way to compute it per category without a read per card (CLAUDE.md-
// style cost discipline, same spirit even though that file is a different
// project's rules).
export function CategoriesGrid({ categories, onSelect }: CategoriesGridProps) {
  return (
    <div>
      <header className="mb-4">
        <h1 className="font-display text-[26px] font-bold text-ink">Tous les espaces</h1>
        <p className="mt-1 text-[14.5px] text-ink-2">
          {categories.length} espaces thématiques, calqués sur les grandes rubriques du Revenu.
        </p>
      </header>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
        {categories.map((category) => (
          <button
            key={category.slug}
            type="button"
            onClick={() => onSelect(category.slug)}
            className="flex flex-col items-start gap-1.5 rounded-[14px] border border-hairline bg-surface p-4 text-left shadow-card transition-transform hover:-translate-y-0.5"
          >
            <CategoryIcon slug={category.slug} size="md" />
            <h3 className="mt-1 font-display text-[17px] font-bold text-ink">{category.name}</h3>
            {category.description ? <p className="text-[13px] text-ink-2">{category.description}</p> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
