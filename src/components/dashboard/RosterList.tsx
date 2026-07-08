'use client'

// Client-side roster search + filter. Receives the full roster from the server
// page and filters in memory as the admin types — no navigation, no refresh, so
// the input keeps focus. For very large rosters this stays snappy because it's a
// plain substring match over already-loaded rows.
import { useMemo, useState } from 'react'
import { Card, EmptyState } from './ui'
import Icon from '@/components/landing/Icon'
import RosterRow from './RosterRow'
import type { RosterStudent } from '@/lib/queries/roster'
import type { Department } from '@/lib/supabase/database.types'

const DEPARTMENTS: Department[] = ['CS', 'IT', 'EC', 'EEE', 'ME', 'PT', 'EP']

export default function RosterList({
  students,
}: {
  students: RosterStudent[]
}) {
  const [q, setQ] = useState('')
  const [dept, setDept] = useState<Department | ''>('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return students.filter((s) => {
      if (dept && s.department !== dept) return false
      if (needle) {
        const hay = `${s.name} ${s.student_id} ${s.email}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [students, q, dept])

  return (
    <div className="space-y-5">
      {/* Search + department filter — live, no submit */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
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
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value as Department | '')}
          className="rounded-2xl bg-white/70 border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo/40"
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Roster list */}
      <Card className="p-0 overflow-hidden">
        {students.length === 0 ? (
          <EmptyState
            icon="team"
            title="No students on the roster yet"
            hint="Add a student or import a spreadsheet to get started."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="No matches"
            hint="Try a different name, ID or department."
          />
        ) : (
          <>
            <div className="px-4 sm:px-5 py-2.5 border-b border-black/5 text-xs font-semibold text-muted">
              {filtered.length} of {students.length} student(s)
            </div>
            <ul className="divide-y divide-black/5">
              {filtered.map((s) => (
                <RosterRow key={s.id} student={s} />
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  )
}
