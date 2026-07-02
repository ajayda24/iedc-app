// Streaming fallback for the manage events list.
function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-3xl bg-white/50 animate-pulse ${className}`} />
}

export default function ManageLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Block className="h-8 w-52 rounded-xl" />
          <Block className="h-4 w-72 rounded-lg" />
        </div>
        <Block className="h-11 w-32 rounded-2xl" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Block key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <Block className="h-96" />
    </div>
  )
}
