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

