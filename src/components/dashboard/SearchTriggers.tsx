'use client'

import Icon from '@/components/landing/Icon'
import { useSearch } from './SearchProvider'

// Desktop: a prominent command-style bar that opens the search modal.
export function SearchBar() {
  const { open } = useSearch()
  return (
    <div className="hidden lg:flex flex-1 max-w-xl mx-auto">
      <button
        type="button"
        onClick={open}
        className="group w-full flex items-center gap-3 rounded-2xl bg-white/90 border border-black/6 px-4 py-2.5 text-left transition-colors hover:bg-white hover:border-indigo/30"
      >
        <Icon
          name="search"
          className="w-4 h-4 text-muted group-hover:text-indigo transition-colors"
        />
        <span className="flex-1 text-sm text-muted">
          Search events, people, certificates…
        </span>
        <kbd className="hidden xl:inline-flex items-center gap-0.5 rounded-md bg-black/5 px-1.5 py-0.5 text-[0.7rem] font-medium text-ink-soft">
          ⌘K
        </kbd>
      </button>
    </div>
  )
}

// Mobile: a compact icon button that opens the same modal.
export function SearchIconButton() {
  const { open } = useSearch()
  return (
    <button
      type="button"
      onClick={open}
      className="lg:hidden grid place-items-center w-10 h-10 rounded-full hover:bg-white/70 transition-colors"
      aria-label="Search"
    >
      <Icon name="search" className="w-5 h-5 text-ink-soft" />
    </button>
  )
}
