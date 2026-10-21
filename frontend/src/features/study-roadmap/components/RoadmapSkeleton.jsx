function Skeleton({ className }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />;
}

export default function RoadmapSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading study roadmap">
      <Skeleton className="h-72" />
      <Skeleton className="h-36" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-72" />)}
      </div>
    </div>
  );
}
