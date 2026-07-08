'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setUserRoleAction } from '@/lib/queries/role-actions'
import type { UserRole } from '@/lib/supabase/database.types'

const ROLES: { key: UserRole; label: string }[] = [
  { key: 'student', label: 'Student' },
  { key: 'coordinator', label: 'Coordinator' },
  { key: 'admin', label: 'Admin' },
]

// Per-user role picker. Changes apply immediately on select. The server action
// enforces the guardrails (no self-demote, no last-admin removal); we also hint
// them here by disabling the control when it's the current admin viewing self.
export default function RoleSelect({
  userId,
  role,
  isSelf,
}: {
  userId: string
  role: UserRole
  isSelf: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState<UserRole>(role)
  const [error, setError] = useState<string | null>(null)

  // An admin viewing their own row can't change their role at all (self-demote
  // is blocked; promoting self to admin is a no-op). Lock it to avoid confusion.
  const locked = isSelf && role === 'admin'

  function onChange(next: UserRole) {
    if (next === value) return
    const prev = value
    setValue(next)
    setError(null)
    startTransition(async () => {
      const res = await setUserRoleAction(userId, next)
      if (res.ok) {
        router.refresh()
      } else {
        setValue(prev) // revert on failure
        setError(res.error ?? 'Could not update.')
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as UserRole)}
        disabled={pending || locked}
        aria-label="Role"
        className="rounded-xl bg-white/70 border border-black/10 px-3 py-1.5 text-sm font-semibold text-ink-soft focus:outline-none focus:ring-2 focus:ring-indigo/40 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {ROLES.map((r) => (
          <option key={r.key} value={r.key}>
            {r.label}
          </option>
        ))}
      </select>
      {locked && <span className="text-xs text-muted">You</span>}
      {error && <span className="text-xs text-peach text-right max-w-[12rem]">{error}</span>}
    </div>
  )
}
