import { CategoryIcon } from './categoryVisuals';
import type { Category } from '@/lib/strapi/schemas';

function linkClass(active: boolean) {
  return `flex items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-[14px] font-medium ${
    active ? 'bg-surface-2 font-semibold text-ink' : 'text-ink-2 hover:bg-surface-2/70 hover:text-ink'
  }`;
}

interface CategorySidebarProps {
  categories: Category[];
  view: 'feed' | 'spaces';
  activeCategorySlug: string | undefined;
  onSelectHome: () => void;
  onSelectAll: () => void;
  onSelectCategory: (categorySlug: string) => void;
}

// `self-start` so sticky still pins — a stretched flex-column grid item is
// the usual reason a sticky sidebar silently stops working. Desktop only (md+).
export function CategorySidebar({
  categories,
  view,
  activeCategorySlug,
  onSelectHome,
  onSelectAll,
  onSelectCategory,
}: CategorySidebarProps) {
  return (
    <nav aria-label="Catégories" className="sticky top-[78px] hidden w-full self-start flex-col gap-0.5 md:flex">
      <button type="button" onClick={onSelectHome} className={linkClass(view === 'feed' && !activeCategorySlug)}>
        <span className="inline-grid h-[22px] w-[22px] shrink-0 place-items-center text-ink-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]" aria-hidden="true">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M9 22V12h6v10" />
          </svg>
        </span>
        Accueil
      </button>

      <button type="button" onClick={onSelectAll} className={linkClass(view === 'spaces')}>
        <span className="inline-grid h-[22px] w-[22px] shrink-0 place-items-center text-ink-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]" aria-hidden="true">
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
          </svg>
        </span>
        Tous les espaces
      </button>

      <div className="my-1 h-px bg-line" />

      {categories.map((category) => (
        <button
          key={category.slug}
          type="button"
          onClick={() => onSelectCategory(category.slug)}
          className={linkClass(view === 'feed' && activeCategorySlug === category.slug)}
        >
          <CategoryIcon slug={category.slug} />
          {category.name}
        </button>
      ))}
    </nav>
  );
}
