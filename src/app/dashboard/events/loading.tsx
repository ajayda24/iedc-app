// Streaming fallback for the events list. Mirrors the page layout so nav feels
// instant while events + registrations load.
function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-3xl bg-white/50 animate-pulse ${className}`} />
}

export default function EventsLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Block className="h-8 w-40 rounded-xl" />
        <Block className="h-4 w-72 rounded-lg" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Block key={i} className="h-64" />
        ))}
      </div>
    </div>
  )
}
