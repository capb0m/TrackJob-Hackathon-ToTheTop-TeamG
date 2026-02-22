export function PageSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-1/3 animate-pulse rounded bg-white/10" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl bg-white/10" />
        <div className="h-28 animate-pulse rounded-xl bg-white/10" />
        <div className="h-28 animate-pulse rounded-xl bg-white/10" />
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-white/10" />
    </div>
  )
}
