import { requireAdmin } from '@/lib/auth/queries'
import { listRoster } from '@/lib/queries'
import { StatCard } from '@/components/dashboard/ui'
import RosterManager from '@/components/dashboard/RosterManager'
import RosterList from '@/components/dashboard/RosterList'

export default async function RosterPage() {
  await requireAdmin()
  const all = await listRoster()

  const currentCount = all.filter((s) => !s.is_alumni).length
  const alumniCount = all.length - currentCount

  return (
    <div className="space-y-5">
      {/* Heading */}
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl">
          Student Roster
        </h1>
        <p className="text-ink-soft mt-1">
          The source of truth for who can sign up. Add students individually or
          import a spreadsheet.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon="team" label="On roster" value={all.length} tint="indigo" />
        <StatCard icon="user" label="Current" value={currentCount} tint="mint" />
        <StatCard icon="medal" label="Alumni" value={alumniCount} tint="peach" />
      </div>

      {/* Add / import */}
      <RosterManager />

      {/* Live search + filtered list (client-side, no refresh) */}
      <RosterList students={all} />
    </div>
  )
}
