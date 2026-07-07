'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileAction } from '@/lib/queries/profile-actions'
import { useMountTransition } from './use-mount-transition'
import AvatarUpload from './AvatarUpload'
import Icon from '@/components/landing/Icon'
import type { ProfileCurrent } from '@/lib/supabase/database.types'

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-white/70 px-3.5 py-2.5 text-sm outline-none focus:border-indigo/40 focus:bg-white transition-colors'

// "Edit profile" button + modal form. Editable fields: avatar, name, phone,
// bio, github, linkedin, website. Saves via updateProfileAction, then refreshes.
export default function ProfileEditForm({ profile }: { profile: ProfileCurrent }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // Avatar URL is managed here so AvatarUpload can update it live.
  const [avatar, setAvatar] = useState<string | null>(profile.avatar)
  const { mounted, show } = useMountTransition(open)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateProfileAction(fd)
      if (!res.ok) {
        setError(res.error ?? 'Something went wrong.')
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl text-black text-sm font-semibold px-4 py-2.5 hover:bg-mint/20 transition-colors"
      >
        <Icon name="edit" className="w-4 h-4" />
        {/* Edit profile */}
      </button>

      {mounted && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit profile"
        >
          <button
            aria-label="Close"
            data-show={show}
            className="anim-fade absolute inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <form
            onSubmit={onSubmit}
            data-show={show}
            className="anim-modal relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-black/10 shadow-[0_30px_80px_-20px_rgba(40,52,92,0.4)] p-6 space-y-5"
          >
            <h2 className="font-display font-semibold text-lg">Edit profile</h2>

            <AvatarUpload
              userId={profile.id}
              initialUrl={profile.avatar}
              onUploaded={setAvatar}
            />
            {/* The avatar URL travels with the form via this hidden field, kept
                in sync by AvatarUpload's onUploaded callback. */}
            <input type="hidden" name="avatar" value={avatar ?? ''} />

            <Field label="Name" required>
              <input
                name="name"
                defaultValue={profile.name}
                required
                className={inputCls}
              />
            </Field>

            <Field label="Phone">
              <input
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ''}
                className={inputCls}
                placeholder="e.g. +91 98765 43210"
              />
            </Field>

            <Field label="Bio">
              <textarea
                name="bio"
                defaultValue={profile.bio ?? ''}
                rows={3}
                className={inputCls}
                placeholder="A line or two about you."
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="GitHub">
                <input
                  name="github"
                  defaultValue={profile.github ?? ''}
                  className={inputCls}
                  placeholder="github.com/username"
                />
              </Field>
              <Field label="LinkedIn">
                <input
                  name="linkedin"
                  defaultValue={profile.linkedin ?? ''}
                  className={inputCls}
                  placeholder="linkedin.com/in/username"
                />
              </Field>
            </div>

            <Field label="Website">
              <input
                name="website"
                defaultValue={profile.website ?? ''}
                className={inputCls}
                placeholder="your-site.com"
              />
            </Field>

            {error && (
              <p className="text-sm text-peach bg-peach/10 rounded-2xl px-4 py-2.5">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-2xl border border-black/10 text-ink-soft text-sm font-semibold px-5 py-2.5 hover:bg-white/60 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo text-white text-sm font-semibold px-5 py-2.5 hover:bg-indigo/90 transition-colors disabled:opacity-60"
              >
                {pending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-ink-soft">
        {label}
        {required && <span className="text-peach"> *</span>}
      </span>
      {children}
    </div>
  )
}
