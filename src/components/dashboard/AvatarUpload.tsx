'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { compressAvatar, AvatarError } from '@/lib/avatar'
import Icon from '@/components/landing/Icon'

// Avatar picker + uploader. Compresses the chosen image to WebP client-side,
// uploads it to the public `avatars` bucket at `{uid}/avatar.webp`, and reports
// the resulting public URL to the parent via `onUploaded`. The parent keeps the
// URL in form state (a hidden field) so it saves with the rest of the profile.
export default function AvatarUpload({
  userId,
  initialUrl,
  name,
  onUploaded,
}: {
  userId: string
  initialUrl: string | null
  // Name for the hidden input that carries the avatar URL in the form.
  name?: string
  onUploaded?: (url: string) => void
}) {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const pick = useCallback(
    async (file: File) => {
      setError(null)
      setBusy(true)
      try {
        const blob = await compressAvatar(file)
        const supabase = createClient()
        const path = `${userId}/avatar.webp`
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, blob, {
            upsert: true,
            contentType: 'image/webp',
            cacheControl: '3600',
          })
        if (upErr) throw new Error(upErr.message)

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(path)
        // Cache-bust so the replaced image shows immediately.
        const busted = `${publicUrl}?v=${Date.now()}`
        setUrl(busted)
        onUploaded?.(busted)
      } catch (e) {
        setError(
          e instanceof AvatarError
            ? e.message
            : 'Upload failed. Please try again.'
        )
      } finally {
        setBusy(false)
      }
    },
    [userId, onUploaded]
  )

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 shrink-0">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="w-20 h-20 rounded-full object-cover ring-2 ring-white/70"
          />
        ) : (
          <span className="w-20 h-20 grid place-items-center rounded-full bg-black/5 text-muted">
            <Icon name="team" className="w-8 h-8" />
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-white/60">
            <span className="w-5 h-5 rounded-full border-2 border-indigo border-t-transparent animate-spin" />
          </span>
        )}
      </div>

      <div className="min-w-0">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-white/70 hover:bg-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          <Icon name="team" className="w-4 h-4" />
          {url ? 'Change photo' : 'Upload photo'}
        </button>
        <p className="text-xs text-muted mt-1.5">
          JPG or PNG, up to 2MB. Compressed automatically.
        </p>
        {error && <p className="text-xs text-peach mt-1">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) pick(f)
          e.target.value = '' // allow re-picking the same file
        }}
      />
      {name && <input type="hidden" name={name} value={url ?? ''} />}
    </div>
  )
}
