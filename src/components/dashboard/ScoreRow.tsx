'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveScoreAction, clearScoreAction } from '@/lib/queries/score-actions'
import Icon from '@/components/landing/Icon'

// Per-attendee marks entry: a score field, an optional rank, and remarks. Saves
// via upsert; clearing removes the row. Rank 1 is highlighted as the winner in
// the parent list. Only attendees reach this component (the page filters).
export default function ScoreRow({
  eventId,
  profileId,
  initialScore,
  initialRank,
  initialRemarks,
}: {
  eventId: string
  profileId: string
  initialScore: number | null
  initialRank: number | null
  initialRemarks: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState(
    initialScore != null ? String(initialScore) : ''
  )
  const [rank, setRank] = useState(initialRank != null ? String(initialRank) : '')
  const [remarks, setRemarks] = useState(initialRemarks ?? '')

  const hasRow = initialScore != null || initialRank != null

  function save() {
    setError(null)
    const scoreNum = score.trim() === '' ? 0 : Number(score)
    if (!Number.isFinite(scoreNum)) {
      setError('Score must be a number.')
      return
    }
    const rankNum = rank.trim() === '' ? null : Number(rank)
    if (rankNum != null && (!Number.isInteger(rankNum) || rankNum < 1)) {
      setError('Rank must be a positive whole number.')
      return
    }
    startTransition(async () => {
      const res = await saveScoreAction({
        eventId,
        profileId,
        score: scoreNum,
        rank: rankNum,
        remarks: remarks.trim() ? remarks.trim() : null,
      })
      if (res.ok) router.refresh()
      else setError(res.error ?? 'Could not save.')
    })
  }

  function clear() {
    setError(null)
    startTransition(async () => {
      const res = await clearScoreAction(eventId, profileId)
      if (res.ok) {
        setScore('')
        setRank('')
        setRemarks('')
        router.refresh()
      } else setError(res.error ?? 'Could not clear.')
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          Score
          <input
            type="number"
            step="any"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            disabled={pending}
            className="w-20 rounded-lg bg-white/70 border border-black/10 px-2.5 py-1.5 text-xs font-semibold text-ink-soft focus:outline-none focus:ring-2 focus:ring-indigo/40"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          Rank
          <input
            type="number"
            min="1"
            step="1"
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            disabled={pending}
            placeholder="—"
            className="w-16 rounded-lg bg-white/70 border border-black/10 px-2.5 py-1.5 text-xs font-semibold text-ink-soft focus:outline-none focus:ring-2 focus:ring-indigo/40"
          />
        </label>
        <input
          type="text"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={pending}
          placeholder="Remarks"
          className="w-32 rounded-lg bg-white/70 border border-black/10 px-2.5 py-1.5 text-xs text-ink-soft focus:outline-none focus:ring-2 focus:ring-indigo/40"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
        >
          <Icon name="check" className="w-3.5 h-3.5" />
          {pending ? 'Saving…' : 'Save'}
        </button>
        {hasRow && (
          <button
            type="button"
            onClick={clear}
            disabled={pending}
            className="text-muted hover:text-peach transition-colors disabled:opacity-50"
            aria-label="Clear score"
          >
            <Icon name="trash" className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && <span className="text-xs text-peach">{error}</span>}
    </div>
  )
}
