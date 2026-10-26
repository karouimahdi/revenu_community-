import { Skeleton } from '@/components/Skeleton';

interface FeedSkeletonProps {
  density?: 'comfy' | 'compact';
}

// Shaped to match DiscussionCard/DiscussionRow exactly — a skeleton that
// doesn't match the density currently selected causes a layout jump the
// instant real rows replace it.
export function FeedSkeleton({ density = 'comfy' }: FeedSkeletonProps) {
  if (density === 'compact') {
    return (
      <div className="rounded-[14px] border border-line bg-surface shadow-card">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[minmax(0,1fr)_72px_84px] items-center gap-3 border-t border-line px-4 py-2.5 first:border-t-0"
          >
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-12 justify-self-end" />
            <Skeleton className="h-3 w-16 justify-self-end" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-line bg-surface shadow-card">
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid grid-cols-[62px_minmax(0,1fr)] gap-4 border-t border-line p-4 first:border-t-0">
          <Skeleton className="h-[58px] w-[62px] rounded-[9px]" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
