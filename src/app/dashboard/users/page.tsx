import { requireAdmin } from '@/lib/auth/queries'
import { listUsers } from '@/lib/queries'
import { StatCard } from '@/components/dashboard/ui'
import UsersDirectory from '@/components/dashboard/UsersDirectory'

export default async function UsersPage() {
  // Gate + user list in parallel (auth hop no longer blocks the query).
  const [me, users] = await Promise.all([requireAdmin(), listUsers()])

  const admins = users.filter((u) => u.role === 'admin').length
  const coordinators = users.filter((u) => u.role === 'coordinator').length
  const students = users.filter((u) => u.role === 'student').length

  return (
    <div className="space-y-5">
      {/* Heading */}
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl">
          Users &amp; Roles
        </h1>
        <p className="text-ink-soft mt-1">
          Promote members to coordinator or admin. Access follows the role —
          there are no per-user permissions to set.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon="shield" label="Admins" value={admins} tint="indigo" />
        <StatCard
          icon="compass"
          label="Coordinators"
          value={coordinators}
          tint="mint"
        />
        <StatCard icon="team" label="Students" value={students} tint="blue" />
      </div>

      {/* Directory (client search + role controls) */}
      <UsersDirectory users={users} currentUserId={me.id} />
    </div>
  )
}
