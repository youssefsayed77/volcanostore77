export function SkeletonCard() {
  return (
    <article className="panel overflow-hidden rounded-[2rem] skeleton-card">
      <div className="skeleton-shimmer h-72 w-full rounded-[1.6rem]" />
      <div className="space-y-4 p-5 sm:p-6">
        <div className="skeleton-shimmer h-3 w-24 rounded-full" />
        <div className="skeleton-shimmer h-5 w-3/4 rounded-full" />
        <div className="skeleton-shimmer h-3 w-full rounded-full" />
        <div className="skeleton-shimmer h-3 w-5/6 rounded-full" />
        <div className="flex gap-3 pt-2">
          <div className="skeleton-shimmer h-12 flex-1 rounded-full" />
          <div className="skeleton-shimmer h-12 flex-1 rounded-full" />
        </div>
      </div>
    </article>
  );
}
