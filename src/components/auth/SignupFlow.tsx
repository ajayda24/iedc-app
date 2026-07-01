'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/landing/Icon'
import {
  requestSignupOtp,
  verifySignupOtp,
  completeSignup,
} from '@/lib/auth/actions'

// Three visible stages, matching the stepper in the reference.
const STEPS = ['Student ID', 'Verify', 'Complete'] as const
type StepIndex = 0 | 1 | 2

export default function SignupFlow() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [step, setStep] = useState<StepIndex>(0)
  const [error, setError] = useState<string | null>(null)

  // Carried between steps.
  const [studentId, setStudentId] = useState('')
  const [email, setEmail] = useState('') // real on-file email (from step 1)
  const [emailHint, setEmailHint] = useState('') // masked, for display
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  // ---- Step 1: student ID -> send OTP ----
  function submitStudentId(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await requestSignupOtp(studentId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setEmail(res.data.email)
      setEmailHint(res.data.emailHint)
      setCode('')
      setStep(1)
    })
  }

  // ---- Step 2: verify the 6-digit code ----
  function submitCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    startTransition(async () => {
      const res = await verifySignupOtp(email, code)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setStep(2)
    })
  }

  // ---- Step 3: set a password, create profile, go to /dashboard ----
  function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    startTransition(async () => {
      const res = await completeSignup(password)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push('/dashboard')
      router.refresh()
    })
  }

  async function resendCode() {
    setError(null)
    startTransition(async () => {
      const res = await requestSignupOtp(studentId)
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <div className="glass rounded-[22px] p-7 sm:p-8">
      {/* Header */}
      <p className="eyebrow">Welcome back!</p>
      <h1 className="mt-2 font-display text-[2.1rem] font-extrabold leading-[1.05] tracking-tight text-ink">
        Let&rsquo;s get <span className="text-grad">you started</span>
      </h1>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
        Join Kerala&rsquo;s most active student innovation ecosystem.
      </p>

      {/* Stepper */}
      <Stepper current={step} />

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Steps */}
      <div className="mt-6">
        {step === 0 && (
          <StepStudentId
            value={studentId}
            onChange={setStudentId}
            onSubmit={submitStudentId}
            pending={pending}
          />
        )}
        {step === 1 && (
          <StepVerify
            code={code}
            onChange={setCode}
            emailHint={emailHint}
            onSubmit={submitCode}
            onBack={() => {
              setError(null)
              setStep(0)
            }}
            onResend={resendCode}
            pending={pending}
          />
        )}
        {step === 2 && (
          <StepComplete
            password={password}
            confirm={confirm}
            onPassword={setPassword}
            onConfirm={setConfirm}
            onSubmit={submitPassword}
            pending={pending}
          />
        )}
      </div>

      {/* Footer note */}
      <div className="mt-7 flex items-start gap-2.5 border-t border-black/5 pt-5 text-xs leading-relaxed text-muted">
        <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-indigo" />
        <span>Your data is secure and used only for IEDC Hub purposes.</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stepper indicator
// ---------------------------------------------------------------------------
function Stepper({ current }: { current: StepIndex }) {
  return (
    <div className="mt-7 flex items-center">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={[
                  'grid h-8 w-8 place-items-center rounded-full text-sm font-semibold transition',
                  active
                    ? 'text-white shadow-[0_8px_18px_-6px_rgba(108,124,255,0.9)]'
                    : done
                      ? 'text-white'
                      : 'bg-black/6 text-muted',
                ].join(' ')}
                style={
                  active || done
                    ? {
                        background:
                          'linear-gradient(120deg, var(--indigo), var(--blue))',
                      }
                    : undefined
                }
              >
                {done ? <Icon name="check" className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={[
                  'text-xs',
                  active ? 'font-semibold text-ink' : 'text-muted',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={[
                  'mx-2 mb-5 h-[2px] flex-1 rounded-full transition',
                  done ? 'bg-indigo/60' : 'bg-black/8',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------
function Field({
  icon,
  children,
}: {
  icon: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-black/8 bg-white/70 px-4 py-3.5 transition focus-within:border-indigo/60 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(122,108,255,0.12)]">
      <Icon name={icon} className="h-5 w-5 shrink-0 text-muted" />
      {children}
    </div>
  )
}

const inputCls =
  'w-full bg-transparent text-[0.95rem] text-ink outline-none placeholder:text-muted'

function SubmitButton({
  pending,
  children,
}: {
  pending: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary mt-1 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[0.95rem] font-semibold disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <Spinner />
      ) : (
        <>
          {children}
          <Icon name="arrow" className="h-5 w-5" />
        </>
      )}
    </button>
  )
}

function Spinner() {
  return (
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
      {children}
    </label>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — Student ID
// ---------------------------------------------------------------------------
function StepStudentId({
  value,
  onChange,
  onSubmit,
  pending,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  pending: boolean
}) {
  return (
    <form onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold text-ink">Enter your Student ID</h2>
      <p className="mt-1 mb-5 text-sm text-ink-soft">
        This helps us identify you within your institution.
      </p>

      <Label>Student ID</Label>
      <Field icon="user">
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. IEDC2024001"
          className={inputCls}
          autoComplete="username"
        />
      </Field>

      <div className="mt-5">
        <SubmitButton pending={pending}>Continue</SubmitButton>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Verify OTP
// ---------------------------------------------------------------------------
function StepVerify({
  code,
  onChange,
  emailHint,
  onSubmit,
  onBack,
  onResend,
  pending,
}: {
  code: string
  onChange: (v: string) => void
  emailHint: string
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
  onResend: () => void
  pending: boolean
}) {
  return (
    <form onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold text-ink">Check your email</h2>
      <p className="mt-1 mb-5 text-sm text-ink-soft">
        We sent a 6-digit code to{' '}
        <span className="font-semibold text-ink">{emailHint}</span>.
      </p>

      <Label>Verification code</Label>
      <Field icon="mail">
        <input
          autoFocus
          value={code}
          onChange={(e) =>
            onChange(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          placeholder="123456"
          inputMode="numeric"
          autoComplete="one-time-code"
          className={`${inputCls} tracking-[0.5em] font-semibold`}
        />
      </Field>

      <button
        type="button"
        onClick={onResend}
        disabled={pending}
        className="mt-3 text-sm font-medium text-indigo hover:underline disabled:opacity-60"
      >
        Didn&rsquo;t get it? Resend code
      </button>

      <div className="mt-5">
        <SubmitButton pending={pending}>Verify</SubmitButton>
      </div>

      <button
        type="button"
        onClick={onBack}
        disabled={pending}
        className="mt-3 w-full text-center text-sm text-ink-soft hover:text-ink disabled:opacity-60"
      >
        Use a different Student ID
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Create password
// ---------------------------------------------------------------------------
function StepComplete({
  password,
  confirm,
  onPassword,
  onConfirm,
  onSubmit,
  pending,
}: {
  password: string
  confirm: string
  onPassword: (v: string) => void
  onConfirm: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  pending: boolean
}) {
  const [show, setShow] = useState(false)

  return (
    <form onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold text-ink">Create a password</h2>
      <p className="mt-1 mb-5 text-sm text-ink-soft">
        You&rsquo;ll use this to log in from now on.
      </p>

      <Label>Password</Label>
      <Field icon="lock">
        <input
          autoFocus
          type={show ? 'text' : 'password'}
          value={password}
          onChange={(e) => onPassword(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="shrink-0 text-muted transition hover:text-ink-soft"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <Icon name={show ? 'eye-off' : 'eye'} className="h-5 w-5" />
        </button>
      </Field>

      <div className="mt-4">
        <Label>Confirm password</Label>
        <Field icon="lock">
          <input
            type={show ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => onConfirm(e.target.value)}
            placeholder="Re-enter password"
            autoComplete="new-password"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="mt-5">
        <SubmitButton pending={pending}>Create account</SubmitButton>
      </div>
    </form>
  )
}
