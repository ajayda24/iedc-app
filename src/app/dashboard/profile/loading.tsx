// Streaming fallback for the profile page. Mirrors the hero + two-column body.
function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-3xl bg-white/50 animate-pulse ${className}`} />
}

export default function ProfileLoading() {
  return (
    <div className="space-y-5">
      {/* Hero */}
      <Block className="h-52" />
      {/* Body */}
      <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Block className="h-64" />
          <Block className="h-40" />
        </div>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Block className="h-24" />
            <Block className="h-24" />
            <Block className="h-24" />
            <Block className="h-24" />
          </div>
          <Block className="h-32" />
        </div>
      </div>
    </div>
  )
}
