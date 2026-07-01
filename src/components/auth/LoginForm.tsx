'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/landing/Icon'
import { loginWithStudentId } from '@/lib/auth/actions'

export default function LoginForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!studentId.trim() || !password) {
      setError('Enter your Student ID and password.')
      return
    }
    startTransition(async () => {
      const res = await loginWithStudentId(studentId, password)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push('/dashboard')
      router.refresh()
    })
  }

  return (
    <div className="glass rounded-[22px] p-7 sm:p-8">
      <p className="eyebrow">Welcome back!</p>
      <h1 className="mt-2 font-display text-[2.1rem] font-extrabold leading-[1.05] tracking-tight text-ink">
        Log in to <span className="text-grad">IEDC Hub</span>
      </h1>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
        Pick up where you left off.
      </p>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Student ID
        </label>
        <div className="flex items-center gap-2.5 rounded-2xl border border-black/8 bg-white/70 px-4 py-3.5 transition focus-within:border-indigo/60 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(122,108,255,0.12)]">
          <Icon name="user" className="h-5 w-5 shrink-0 text-muted" />
          <input
            autoFocus
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g. IEDC2024001"
            autoComplete="username"
            className="w-full bg-transparent text-[0.95rem] text-ink outline-none placeholder:text-muted"
          />
        </div>

        <label className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Password
        </label>
        <div className="flex items-center gap-2.5 rounded-2xl border border-black/8 bg-white/70 px-4 py-3.5 transition focus-within:border-indigo/60 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(122,108,255,0.12)]">
          <Icon name="lock" className="h-5 w-5 shrink-0 text-muted" />
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            className="w-full bg-transparent text-[0.95rem] text-ink outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="shrink-0 text-muted transition hover:text-ink-soft"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            <Icon name={show ? 'eye-off' : 'eye'} className="h-5 w-5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[0.95rem] font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <>
              Log in
              <Icon name="arrow" className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-7 flex items-start gap-2.5 border-t border-black/5 pt-5 text-xs leading-relaxed text-muted">
        <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-indigo" />
        <span>Your data is secure and used only for IEDC Hub purposes.</span>
      </div>
    </div>
  )
}
