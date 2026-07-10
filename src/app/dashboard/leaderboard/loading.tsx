// Streaming fallback for the leaderboard. Mirrors LeaderboardView's layout so
// navigation feels instant while data loads — and, importantly, stays within the
// viewport on mobile (the podium is width-constrained + centered like the real
// one, so nothing overflows horizontally and pushes the fixed bottom nav).
function Block({ className = '' }: { className?: string }) {
  return <div className={`rounded-3xl bg-white/50 animate-pulse ${className}`} />
}

export default function LeaderboardLoading() {
  return (
    <div className="space-y-5">
      {/* Heading */}
      <div className="space-y-2">
        <Block className="h-8 w-48 rounded-xl" />
        <Block className="h-4 w-full max-w-xs rounded-lg" />
      </div>

      {/* Podium — mirrors the real one: a centered flex row of shrinkable cards.
          The outer `overflow-hidden` is a hard guard so this row can never push
          the fixed bottom nav even on the narrowest phones. */}
      <div className="w-full overflow-hidden pt-2">
        <div className="max-w-sm w-full mx-auto flex gap-2 sm:gap-4 items-center justify-center">
          <Block className="w-1/4 min-w-0 h-40 mt-4 sm:mt-6" />
          <Block className="w-1/3 min-w-0 h-52 -mt-2" />
          <Block className="w-1/4 min-w-0 h-40 mt-4 sm:mt-6" />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <Block className="h-8 w-20 rounded-full" />
        <Block className="h-8 w-14 rounded-full" />
        <Block className="h-8 w-14 rounded-full" />
        <Block className="h-8 w-14 rounded-full" />
      </div>

      {/* Ranked list + side column: single column on mobile, split on xl. */}
      <div className="grid gap-5 xl:grid-cols-[1fr_20rem] items-start">
        <Block className="h-80" />
        <div className="space-y-5">
          <Block className="h-40" />
          <Block className="h-48" />
        </div>
      </div>
    </div>
  )
}
