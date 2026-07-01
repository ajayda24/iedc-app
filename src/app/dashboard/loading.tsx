// Streaming fallback for the dashboard overview. Mirrors the page's layout so
// navigation feels instant while server data loads.
function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-3xl bg-white/50 animate-pulse ${className}`} />
}

export default function DashboardLoading() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
      <div className="space-y-5">
        <div className="space-y-2">
          <Block className="h-8 w-64 rounded-xl" />
          <Block className="h-4 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Block className="h-28" />
          <Block className="h-28" />
          <Block className="h-28" />
          <Block className="h-28" />
        </div>
        <Block className="h-72" />
      </div>
      <div className="space-y-5">
        <Block className="h-64" />
        <Block className="h-48" />
      </div>
    </div>
  )
}
