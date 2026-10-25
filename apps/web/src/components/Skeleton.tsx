export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-black/[.06] ${className}`} />;
}
