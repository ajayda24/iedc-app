'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Icon from '@/components/landing/Icon'
import { useMountTransition } from './use-mount-transition'

// Custom date + time chooser matching the design system. Time steps in 15-min
// increments. Submits a `YYYY-MM-DDTHH:mm` string via a hidden input — the same
// format a native datetime-local emits, so manage-actions parseForm handles it
// unchanged. `defaultValue` accepts an ISO timestamp.

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const pad = (n: number) => String(n).padStart(2, '0')

// Parse an ISO / datetime-local string into parts, or null.
function parse(v: string | null | undefined) {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d
}

// Serialize to the datetime-local wire format (local time, no zone).
function serialize(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTES = [0, 15, 30, 45]

// Split a 24h hour into 12h parts. Returns { h12, meridiem }.
function to12h(h24: number): { h12: number; meridiem: 'AM' | 'PM' } {
  const meridiem = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return { h12, meridiem }
}

// Combine 12h parts back into a 24h hour.
function to24h(h12: number, meridiem: 'AM' | 'PM'): number {
  const base = h12 % 12 // 12 -> 0
  return meridiem === 'PM' ? base + 12 : base
}

export default function DateTimePicker({
  name,
  defaultValue,
  placeholder = 'Pick date & time',
}: {
  name: string
  defaultValue?: string | null
  placeholder?: string
}) {
  const initial = parse(defaultValue)
  const [selected, setSelected] = useState<Date | null>(initial)
  // Month currently shown in the calendar (day is irrelevant here).
  const [view, setView] = useState(() => {
    const base = initial ?? new Date()
    return { year: base.getFullYear(), month: base.getMonth() }
  })
  const [open, setOpen] = useState(false)
  const { mounted, show } = useMountTransition(open)
  const ref = useRef<HTMLDivElement>(null)
  // Track whether the user has (re)picked a day and touched the time this
  // session so we can auto-close once BOTH are set. Seeded true in edit mode
  // where a value already exists (so re-touching one field closes it).
  const daySet = useRef(initial != null)
  const timeSet = useRef(initial != null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Days grid for the viewed month, padded with leading blanks.
  const grid = useMemo(() => {
    const first = new Date(view.year, view.month, 1)
    const startDay = first.getDay()
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
    const cells: (number | null)[] = Array(startDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [view])

  // Current time parts (defaulting to 9:00 AM before anything is picked), used
  // to highlight the active hour/minute/meridiem buttons.
  const parts = to12h(selected ? selected.getHours() : 9)
  const curH12 = parts.h12
  const curMeridiem = parts.meridiem
  const curMin = selected ? selected.getMinutes() : 0

  // Whether a full selection exists (day + time both chosen this session).
  const complete = () => daySet.current && timeSet.current

  function pickDay(day: number) {
    const base = selected ?? new Date(view.year, view.month, day, 9, 0)
    daySet.current = true
    setSelected(
      new Date(view.year, view.month, day, base.getHours(), base.getMinutes())
    )
    // Day is a single decisive tap — if the time was already set, we're done.
    if (complete()) setOpen(false)
  }

  // Rebuild `selected` from 12h time parts, preserving the chosen date. Time is
  // multi-tap (hour + minute + AM/PM), so this never auto-closes; the user
  // confirms with "Done" (or by picking a day afterwards).
  function setTimeParts(h12: number, min: number, meridiem: 'AM' | 'PM') {
    const base = selected ?? new Date(view.year, view.month, 1)
    timeSet.current = true
    setSelected(
      new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        to24h(h12, meridiem),
        min
      )
    )
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const label = selected
    ? selected.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : placeholder

  const isSameDay = (d: number) =>
    selected != null &&
    selected.getFullYear() === view.year &&
    selected.getMonth() === view.month &&
    selected.getDate() === d

  return (
    <div className="relative" ref={ref}>
      <input
        type="hidden"
        name={name}
        value={selected ? serialize(selected) : ''}
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-2xl border border-black/10 bg-white/70 px-3.5 py-2.5 text-sm text-left outline-none focus:border-indigo/40 focus:bg-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon name="calendar" className="w-4 h-4 text-muted shrink-0" />
          <span className={selected ? '' : 'text-muted'}>{label}</span>
        </span>
        <Icon
          name="chevron-down"
          className={`w-4 h-4 text-muted shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {mounted && (
        <div
          data-show={show}
          className="anim-pop absolute left-0 right-0 sm:right-auto mt-2 z-50 w-full sm:w-auto max-w-[min(22rem,calc(100vw-2rem))] sm:max-w-none rounded-3xl p-3 bg-white border border-black/10 shadow-[0_24px_60px_-20px_rgba(40,52,92,0.32)] flex flex-col sm:flex-row gap-3"
          style={{ transformOrigin: 'top center' }}
        >
          {/* Calendar */}
          <div className="w-full sm:w-64">
            <div className="flex items-center justify-between mb-2 px-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="grid place-items-center w-8 h-8 rounded-xl text-ink-soft hover:bg-black/5 transition-colors"
              >
                <Icon name="chevron-left" className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold">
                {MONTHS[view.month]} {view.year}
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="grid place-items-center w-8 h-8 rounded-xl text-ink-soft hover:bg-black/5 transition-colors"
              >
                <Icon name="chevron-right" className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {WEEKDAYS.map((d, i) => (
                <span
                  key={i}
                  className="grid place-items-center h-7 text-[0.65rem] font-semibold text-muted"
                >
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {grid.map((day, i) =>
                day === null ? (
                  <span key={i} />
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickDay(day)}
                    className={`grid place-items-center h-8 rounded-xl text-sm transition-colors ${
                      isSameDay(day)
                        ? 'bg-indigo text-white font-semibold'
                        : 'text-ink-soft hover:bg-indigo/10'
                    }`}
                  >
                    {day}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Time: hour + minute (15-min steps) + AM/PM switcher. */}
          <div className="w-full sm:w-44 border-t sm:border-t-0 sm:border-l border-black/5 pt-3 sm:pt-0 sm:pl-3 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Icon name="clock" className="w-3.5 h-3.5" />
                Time
              </span>
              {/* AM/PM switcher */}
              <div className="flex rounded-xl bg-black/5 p-0.5 text-xs font-semibold">
                {(['AM', 'PM'] as const).map((mer) => (
                  <button
                    key={mer}
                    type="button"
                    onClick={() => setTimeParts(curH12, curMin, mer)}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      curMeridiem === mer
                        ? 'bg-white text-indigo shadow-sm'
                        : 'text-muted hover:text-ink-soft'
                    }`}
                  >
                    {mer}
                  </button>
                ))}
              </div>
            </div>

            {/* Hours */}
            <span className="text-[0.65rem] font-medium text-muted mb-1">
              Hour
            </span>
            <div className="grid grid-cols-6 gap-1 mb-3">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setTimeParts(h, curMin, curMeridiem)}
                  className={`h-8 rounded-lg text-xs font-medium transition-colors ${
                    curH12 === h
                      ? 'bg-indigo text-white'
                      : 'text-ink-soft hover:bg-black/5'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>

            {/* Minutes */}
            <span className="text-[0.65rem] font-medium text-muted mb-1">
              Minute
            </span>
            <div className="grid grid-cols-4 gap-1">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTimeParts(curH12, m, curMeridiem)}
                  className={`h-8 rounded-lg text-xs font-medium transition-colors ${
                    curMin === m
                      ? 'bg-indigo text-white'
                      : 'text-ink-soft hover:bg-black/5'
                  }`}
                >
                  :{pad(m)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-xl bg-indigo text-white text-xs font-semibold py-2 hover:bg-indigo/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
