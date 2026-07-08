// Streaming fallback for the event scores / marks entry page.
function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-3xl bg-white/50 animate-pulse ${className}`} />
}

export default function ScoresLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Block className="h-4 w-28 rounded-lg" />
        <Block className="h-8 w-64 rounded-xl" />
        <Block className="h-4 w-80 rounded-lg" />
      </div>
      <Block className="h-80" />
    </div>
  )
}
