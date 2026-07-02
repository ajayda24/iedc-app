// Streaming fallback for the event detail page.
function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-3xl bg-white/50 animate-pulse ${className}`} />
}

export default function EventDetailLoading() {
  return (
    <div className="space-y-5">
      <Block className="h-4 w-28 rounded-lg" />
      <Block className="h-48 sm:h-64" />
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Block className="h-32" />
          <Block className="h-48" />
        </div>
        <Block className="h-64" />
      </div>
    </div>
  )
}
