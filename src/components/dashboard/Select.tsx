'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Icon from '@/components/landing/Icon'
import { useMountTransition } from './use-mount-transition'

export interface SelectOption {
  value: string
  label: string
}

// Custom dropdown matching the design system (glass popover, anim-pop, click
// -outside). Submits via a hidden <input> so it drops into FormData like a
// native <select>. Controlled value optional — falls back to internal state.
export default function Select({
  name,
  options,
  defaultValue,
  value: controlled,
  onChange,
  placeholder = 'Select…',
}: {
  name?: string
  options: SelectOption[]
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}) {
  const [internal, setInternal] = useState(defaultValue ?? '')
  const value = controlled ?? internal
  const [open, setOpen] = useState(false)
  const { mounted, show } = useMountTransition(open)
  const ref = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(-1)

  const selected = options.find((o) => o.value === value)

  const select = useCallback(
    (v: string) => {
      if (controlled === undefined) setInternal(v)
      onChange?.(v)
      setOpen(false)
    },
    [controlled, onChange]
  )

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Open the popover, seeding the keyboard highlight on the selected item.
  const openMenu = useCallback(() => {
    setActiveIdx(options.findIndex((o) => o.value === value))
    setOpen(true)
  }, [options, value])

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        openMenu()
      }
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (options[activeIdx]) select(options[activeIdx].value)
    }
  }

  return (
    <div className="relative" ref={ref}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 rounded-2xl border border-black/10 bg-white/70 px-3.5 py-2.5 text-sm text-left outline-none focus:border-indigo/40 focus:bg-white transition-colors"
      >
        <span className={selected ? '' : 'text-muted'}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon
          name="chevron-down"
          className={`w-4 h-4 text-muted shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {mounted && (
        <ul
          role="listbox"
          data-show={show}
          className="anim-pop absolute left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto rounded-2xl p-1.5 bg-white border border-black/10 shadow-[0_24px_60px_-20px_rgba(40,52,92,0.32)]"
          style={{ transformOrigin: 'top center' }}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            const isActive = i === activeIdx
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => select(opt.value)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                    isActive ? 'bg-indigo/10' : 'hover:bg-black/5'
                  } ${isSelected ? 'font-semibold text-indigo' : 'text-ink-soft'}`}
                >
                  {opt.label}
                  {isSelected && <Icon name="check" className="w-4 h-4" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
