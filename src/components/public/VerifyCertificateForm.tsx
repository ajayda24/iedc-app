'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/landing/Icon'

// Jump to the public verify page for a certificate serial, e.g. IEDC-2026-0A7F3C.
export default function VerifyCertificateForm() {
  const router = useRouter()
  const id = useId()
  const [serial, setSerial] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = serial.trim().toUpperCase()
    if (!/^[A-Z0-9-]{6,40}$/.test(value)) {
      setError('Enter a code like IEDC-2026-0A7F3C, as printed on the certificate.')
      return
    }
    setError(null)
    router.push(`/certificates/${value}`)
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={id} className="text-sm font-semibold">
        Certificate code
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id={id}
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="IEDC-2026-0A7F3C"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white/80 px-3.5 py-2.5 font-mono text-sm uppercase tracking-wide outline-none transition placeholder:text-muted focus:border-indigo focus:ring-4 focus:ring-indigo/15"
        />
        <button
          type="submit"
          className="btn-ghost inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <Icon name="shield" className="h-4 w-4" />
          Verify
        </button>
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-2 text-sm text-[#a5522a]">
          {error}
        </p>
      )}
    </form>
  )
}
