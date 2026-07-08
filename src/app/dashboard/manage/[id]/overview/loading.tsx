// Streaming fallback for the event registrations / attendance page.
function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-3xl bg-white/50 animate-pulse ${className}`} />
}

export default function RegistrationsLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Block className="h-4 w-28 rounded-lg" />
        <Block className="h-8 w-64 rounded-xl" />
        <Block className="h-4 w-80 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-28" />
        ))}
      </div>
      <Block className="h-80" />
    </div>
  )
}
