// Streaming fallback for the leaderboard. Mirrors the page's layout so
// navigation feels instant while server data loads.
function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-3xl bg-white/50 animate-pulse ${className}`} />
}

export default function LeaderboardLoading() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_20rem]">
      <div className="space-y-5">
        <div className="space-y-2">
          <Block className="h-8 w-56 rounded-xl" />
          <Block className="h-4 w-72 rounded-lg" />
        </div>
        {/* Podium cards (centre raised) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-start pt-6">
          <Block className="h-52 mt-4 sm:mt-6" />
          <Block className="h-64 -mt-6 sm:-mt-8" />
          <Block className="h-52 mt-4 sm:mt-6" />
        </div>
        {/* Filter chips */}
        <div className="flex gap-2">
          <Block className="h-8 w-20 rounded-full" />
          <Block className="h-8 w-14 rounded-full" />
          <Block className="h-8 w-14 rounded-full" />
          <Block className="h-8 w-14 rounded-full" />
        </div>
        <Block className="h-96" />
      </div>
      <div className="space-y-5">
        <Block className="h-48" />
        <Block className="h-56" />
        <Block className="h-48" />
      </div>
    </div>
  )
}
