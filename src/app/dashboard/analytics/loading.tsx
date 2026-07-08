// Streaming fallback for the analytics dashboard.
function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-3xl bg-white/50 animate-pulse ${className}`} />
}

export default function AnalyticsLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Block className="h-8 w-48 rounded-xl" />
        <Block className="h-4 w-80 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Block className="h-64" />
        <Block className="h-64" />
      </div>
      <Block className="h-72" />
    </div>
  )
}
