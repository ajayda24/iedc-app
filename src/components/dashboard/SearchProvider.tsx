'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/landing/Icon'
import { dateChip, CATEGORY_LABEL } from './format'
import { useMountTransition } from './use-mount-transition'
import type { SearchResult } from '@/app/api/search/route'

const SearchContext = createContext<{ open: () => void }>({ open: () => {} })
export const useSearch = () => useContext(SearchContext)

const EMPTY: SearchResult = { events: [], people: [] }

export default function SearchProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  // Global keyboard shortcut: ⌘K / Ctrl+K.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const { mounted, show } = useMountTransition(isOpen)

  return (
    <SearchContext.Provider value={{ open }}>
      {children}
      {mounted && <SearchModal show={show} onClose={close} />}
    </SearchContext.Provider>
  )
}

function SearchModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult>(EMPTY)
  const [loading, setLoading] = useState(false)

  // Focus the input on mount and lock body scroll while open.
  useEffect(() => {
    inputRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Debounced fetch. State only changes asynchronously (inside the timeout /
  // fetch callback), never synchronously in the effect body.
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      // No pending request; results reset lazily on the next keystroke path.
      const t = setTimeout(() => {
        setResults(EMPTY)
        setLoading(false)
      }, 0)
      return () => clearTimeout(t)
    }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        })
        if (res.ok) setResults((await res.json()) as SearchResult)
      } catch {
        /* aborted or network error — ignore */
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [q])

  function go(href: string) {
    onClose()
    router.push(href)
  }

  const hasResults = results.events.length > 0 || results.people.length > 0
  const showEmpty = q.trim().length >= 2 && !loading && !hasResults

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Backdrop */}
      <button
        aria-label="Close search"
        data-show={show}
        className="anim-fade absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        data-show={show}
        className="anim-modal relative w-full max-w-lg bg-white rounded-3xl border border-black/10 shadow-[0_30px_80px_-20px_rgba(40,52,92,0.4)] overflow-hidden"
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 border-b border-black/5">
          <Icon name="search" className="w-5 h-5 text-muted shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Search events, people…"
            className="flex-1 bg-transparent outline-none py-4 text-[15px] placeholder:text-muted"
          />
          <button
            onClick={onClose}
            className="text-xs text-muted rounded-md bg-black/5 px-2 py-1 shrink-0"
          >
            Esc
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {q.trim().length < 2 && (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Type at least 2 characters to search.
            </p>
          )}

          {loading && (
            <p className="px-4 py-8 text-center text-sm text-muted">Searching…</p>
          )}

          {showEmpty && (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No matches for “{q.trim()}”.
            </p>
          )}

          {results.events.length > 0 && (
            <section className="py-2">
              <h4 className="px-4 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
                Events
              </h4>
              {results.events.map((ev) => {
                const chip = dateChip(ev.start_date)
                return (
                  <button
                    key={ev.id}
                    onClick={() => go(`/dashboard/events/${ev.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-black/2"
                  >
                    <span className="grid place-items-center w-9 h-9 rounded-xl bg-indigo/10 text-indigo shrink-0 leading-none">
                      <span className="font-display font-bold text-xs">
                        {chip.day}
                      </span>
                      <span className="text-[0.55rem] font-semibold">
                        {chip.mon}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate">
                        {ev.title}
                      </span>
                      <span className="block text-xs text-muted truncate">
                        {CATEGORY_LABEL[ev.category]}
                        {ev.venue ? ` · ${ev.venue}` : ''}
                      </span>
                    </span>
                  </button>
                )
              })}
            </section>
          )}

          {results.people.length > 0 && (
            <section className="py-2 border-t border-black/5">
              <h4 className="px-4 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
                People
              </h4>
              {results.people.map((p) => (
                <button
                  key={p.id}
                  onClick={() => go('/dashboard/leaderboard')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-black/2"
                >
                  <span className="grid place-items-center w-9 h-9 rounded-full bg-blue/12 text-blue text-xs font-semibold shrink-0">
                    {p.name
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase())
                      .join('')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">
                      {p.name}
                    </span>
                    <span className="block text-xs text-muted truncate">
                      {p.department} · Year {p.year} · {p.total_points} pts
                    </span>
                  </span>
                </button>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
