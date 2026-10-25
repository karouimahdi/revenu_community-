import { Skeleton } from '@/components/Skeleton';

export function FeedSkeleton() {
  return (
    <div className="rounded-[14px] border border-line bg-surface shadow-card">
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid grid-cols-[62px_minmax(0,1fr)] gap-4 border-t border-line p-4 first:border-t-0">
          <Skeleton className="h-[58px] w-[62px] rounded-[9px]" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
