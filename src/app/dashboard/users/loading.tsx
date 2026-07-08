// Streaming fallback for the Users & Roles page.
function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-3xl bg-white/50 animate-pulse ${className}`} />
}

export default function UsersLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Block className="h-8 w-52 rounded-xl" />
        <Block className="h-4 w-80 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Block key={i} className="h-28" />
        ))}
      </div>
      <Block className="h-11 rounded-2xl" />
      <Block className="h-64" />
      <Block className="h-64" />
    </div>
  )
}
