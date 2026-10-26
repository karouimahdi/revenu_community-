// Icon + color per slug, ported from the mockup's CATS — presentational
// only, so a static map here rather than a new Strapi field.
const VISUALS: Record<string, { color: string; path: React.ReactNode }> = {
  bourse: {
    color: '#007aff',
    path: (
      <>
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="M9 5v4" />
        <rect width="4" height="6" x="7" y="9" rx="1" />
        <path d="M9 15v2" />
        <path d="M17 3v2" />
        <rect width="4" height="8" x="15" y="5" rx="1" />
        <path d="M17 13v3" />
      </>
    ),
  },
  epargne: {
    color: '#34c759',
    path: (
      <>
        <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
        <path d="M2 9v1c0 1.1.9 2 2 2h1" />
        <path d="M16 11h.01" />
      </>
    ),
  },
  'assurance-vie': {
    color: '#30b0c7',
    path: (
      <>
        <path d="M22 12a10.06 10.06 1 0 0-20 0Z" />
        <path d="M12 12v8a2 2 0 0 0 4 0" />
        <path d="M12 2v1" />
      </>
    ),
  },
  immobilier: {
    color: '#ff9500',
    path: (
      <>
        <rect width="16" height="20" x="4" y="2" rx="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M12 6h.01" />
        <path d="M16 6h.01" />
        <path d="M8 10h.01" />
        <path d="M12 10h.01" />
        <path d="M16 10h.01" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
      </>
    ),
  },
  impots: {
    color: '#5856d6',
    path: (
      <>
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <path d="M12 17.5v-11" />
      </>
    ),
  },
  retraite: {
    color: '#ff2d55',
    path: (
      <>
        <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
        <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
        <path d="M5 18v2" />
        <path d="M19 18v2" />
      </>
    ),
  },
  transmission: {
    color: '#af52de',
    path: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  alternatifs: {
    color: '#00c7be',
    path: (
      <>
        <path d="M6 3h12l4 6-10 13L2 9Z" />
        <path d="M11 3 8 9l4 13 4-13-3-6" />
        <path d="M2 9h20" />
      </>
    ),
  },
  budget: {
    color: '#8e8e93',
    path: (
      <>
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      </>
    ),
  },
  cafe: {
    color: '#a2845e',
    path: (
      <>
        <path d="M10 2v2" />
        <path d="M14 2v2" />
        <path d="M6 2v2" />
        <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
      </>
    ),
  },
  economie: {
    color: '#3d5a80',
    path: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </>
    ),
  },
};

const DEFAULT_VISUAL = { color: '#8e8e93', path: <circle cx="12" cy="12" r="9" /> };

const BADGE_SIZES = {
  sm: { badge: 'h-[22px] w-[22px] rounded-[6px]', icon: 'h-[13px] w-[13px]' },
  md: { badge: 'h-10 w-10 rounded-[11px]', icon: 'h-[22px] w-[22px]' },
} as const;

export function CategoryIcon({ slug, size = 'sm' }: { slug: string; size?: keyof typeof BADGE_SIZES }) {
  const { color, path } = VISUALS[slug] ?? DEFAULT_VISUAL;
  const { badge, icon } = BADGE_SIZES[size];
  return (
    <span
      className={`inline-grid shrink-0 place-items-center text-white ${badge}`}
      style={{
        background: `linear-gradient(180deg, color-mix(in srgb, ${color} 78%, #fff), ${color})`,
        boxShadow: 'inset 0 .5px 0 rgba(255,255,255,.35), 0 .5px 1.5px rgba(0,0,0,.18)',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={icon}
        aria-hidden="true"
      >
        {path}
      </svg>
    </span>
  );
}
