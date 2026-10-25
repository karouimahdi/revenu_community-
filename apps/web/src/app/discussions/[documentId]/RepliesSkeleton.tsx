import { Skeleton } from '@/components/Skeleton';

export function RepliesSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-[14px] border border-line bg-surface p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2.5">
            <Skeleton className="h-[30px] w-[30px] rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="mb-2 h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
