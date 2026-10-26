const COLORS = ['var(--color-avatar-1)', 'var(--color-avatar-2)', 'var(--color-avatar-3)', 'var(--color-avatar-4)', 'var(--color-avatar-5)'];

const SIZE_CLASSES = {
  xs: 'h-[22px] w-[22px] text-[9.5px]',
  sm: 'h-[30px] w-[30px] text-[11.5px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
} as const;

function hashUsername(username: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i += 1) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function initials(username: string) {
  const parts = username.split(/[_.]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

interface AvatarProps {
  username: string;
  size?: keyof typeof SIZE_CLASSES;
}

export function Avatar({ username, size = 'sm' }: AvatarProps) {
  const color = COLORS[hashUsername(username) % COLORS.length];

  return (
    <span
      className={`inline-grid flex-none place-items-center rounded-full font-semibold text-white ${SIZE_CLASSES[size]}`}
      style={{ backgroundColor: color }}
      title={username}
    >
      {initials(username)}
    </span>
  );
}
