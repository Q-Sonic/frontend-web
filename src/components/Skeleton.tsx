interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-neutral-800/60 ${className}`.trim()} />;
}

interface SkeletonTextProps {
  lines?: number;
  lineHeightClass?: string;
}

export function SkeletonText({ lines = 3, lineHeightClass = 'h-3' }: SkeletonTextProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton key={idx} className={`${lineHeightClass} w-full`} />
      ))}
    </div>
  );
}

interface SkeletonHeadingProps {
  widthClass?: string;
}

export function SkeletonHeading({ widthClass = 'w-2/3' }: SkeletonHeadingProps) {
  return <Skeleton className={`h-6 rounded ${widthClass}`} />;
}

export function DiscoverArtistCardSkeleton() {
  return (
    <div className="flex flex-col h-full rounded-[1.25rem] border border-white/5 bg-neutral-900/40 overflow-hidden">
      <Skeleton className="aspect-4/3 w-full" />
      <div className="p-4 md:p-5 flex-1 flex flex-col gap-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="h-3 w-16 ml-auto rounded" />
            <Skeleton className="h-6 w-20 rounded" />
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ContractCardSkeleton() {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/5 bg-[#141414]/60 p-5 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex flex-1 gap-4 items-center">
        <Skeleton className="h-[3.75rem] w-[3.75rem] shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-3 w-32 rounded" />
          <Skeleton className="h-3 w-40 rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:w-[10rem] items-end">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

