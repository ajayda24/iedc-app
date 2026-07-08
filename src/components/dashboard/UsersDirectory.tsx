'use client'

// Users & Roles directory, split into Admins / Coordinators / Students sections.
// Client-side so the search box filters instantly without a page refresh (same
// pattern as the roster). Each row carries a RoleSelect; role changes are guarded
// server-side (no self-demote, no last-admin removal).
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, EmptyState, Pill } from './ui'
import { yearLabel } from './format'
import Icon from '@/components/landing/Icon'
import RoleSelect from './RoleSelect'
import type { DirectoryUser } from '@/lib/queries/users'
import type { UserRole } from '@/lib/supabase/database.types'

const SECTIONS: {
  role: UserRole
  title: string
  icon: string
  blurb: string
}[] = [
  {
    role: 'admin',
    title: 'Admins',
    icon: 'shield',
    blurb: 'Full access — manage events, roster, roles and everything staff can do.',
  },
  {
    role: 'coordinator',
    title: 'Coordinators',
    icon: 'compass',
    blurb: 'Staff access — manage events, attendance, scores, certificates and analytics.',
  },
  {
    role: 'student',
    title: 'Students',
    icon: 'team',
    blurb: 'Standard access — register for events, earn points and certificates.',
  },
]

export default function UsersDirectory({
  users,
  currentUserId,
}: {
  users: DirectoryUser[]
  currentUserId: string
}) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return users
    return users.filter((u) =>
      `${u.name} ${u.student_id} ${u.email}`.toLowerCase().includes(needle)
    )
  }, [users, q])

  const byRole = useMemo(() => {
    const map: Record<UserRole, DirectoryUser[]> = {
      admin: [],
      coordinator: [],
      student: [],
    }
    for (const u of filtered) map[u.role].push(u)
    return map
  }, [filtered])

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <Icon name="search" className="w-4 h-4" />
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, ID or email"
          className="w-full rounded-2xl bg-white/70 border border-black/10 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo/40"
        />
      </div>

      {SECTIONS.map((section) => {
        const rows = byRole[section.role]
        return (
          <div key={section.role}>
            <div className="flex items-center gap-2 mb-3">
              <span className="grid place-items-center w-9 h-9 rounded-2xl bg-indigo/12 text-indigo">
                <Icon name={section.icon} className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-display font-semibold flex items-center gap-2">
                  {section.title}
                  <Pill tint="muted">{rows.length}</Pill>
                </h2>
                <p className="text-xs text-muted">{section.blurb}</p>
              </div>
            </div>

            <Card className="p-0 overflow-hidden">
              {rows.length === 0 ? (
                <EmptyState
                  icon={section.icon}
                  title={q ? 'No matches in this section' : `No ${section.title.toLowerCase()} yet`}
                  hint={
                    q
                      ? 'Try a different search.'
                      : section.role === 'student'
                        ? 'Students appear here once they sign up.'
                        : `Promote someone to ${section.title.toLowerCase().replace(/s$/, '')} below.`
                  }
                />
              ) : (
                <ul className="divide-y divide-black/5">
                  {rows.map((u) => (
                    <li
                      key={u.id}
                      className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3.5"
                    >
                      {u.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span className="grid place-items-center w-10 h-10 rounded-full bg-indigo/12 text-indigo text-sm font-semibold shrink-0">
                          {u.name
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((w) => w[0]?.toUpperCase())
                            .join('') || '?'}
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/profile/${u.id}`}
                          className="font-semibold truncate hover:text-indigo transition-colors block"
                        >
                          {u.name}
                        </Link>
                        <p className="text-sm text-muted truncate">
                          {u.student_id} · {u.department}
                          {u.role === 'student' ? ` · ${yearLabel(u.year)}` : ''}
                          {' · '}
                          {u.email}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <RoleSelect
                          userId={u.id}
                          role={u.role}
                          isSelf={u.id === currentUserId}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )
      })}
    </div>
  )
}
