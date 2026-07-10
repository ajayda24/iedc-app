'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import type {
  CertificateType,
  EventCategory,
} from '@/lib/supabase/database.types'
import type { CertificatesPayload } from '@/app/api/certificates/route'
import { Card, EmptyState, StatCard } from './ui'
import { fullDate, CATEGORY_LABEL } from './format'
import Icon from '@/components/landing/Icon'

// Client certificates wallet. Fetches the caller's certificates once via SWR
// (cached, background-revalidated); type/category filters apply client-side, so
// the shell and filters are instant and switching filters never re-fetches.

const CERT_TYPES: { key: CertificateType; label: string }[] = [
  { key: 'participation', label: 'Participation' },
  { key: 'winner', label: 'Winner' },
  { key: 'runnerup', label: 'Runner-up' },
  { key: 'volunteer', label: 'Volunteer' },
]
const CERT_LABEL = Object.fromEntries(
  CERT_TYPES.map((t) => [t.key, t.label])
) as Record<CertificateType, string>

const TYPE_TINT: Record<CertificateType, string> = {
  participation: 'bg-indigo/12 text-indigo',
  winner: 'bg-peach/15 text-peach',
  runnerup: 'bg-sky/15 text-sky',
  volunteer: 'bg-mint/15 text-mint',
}

const CATEGORIES = Object.keys(CATEGORY_LABEL) as EventCategory[]

const fetcher = (url: string): Promise<CertificatesPayload> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to load certificates')
    return r.json()
  })

export default function CertificatesView() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type')
  const type = CERT_TYPES.some((t) => t.key === typeParam)
    ? (typeParam as CertificateType)
    : undefined
  const catParam = searchParams.get('category')
  const category = CATEGORIES.includes(catParam as EventCategory)
    ? (catParam as EventCategory)
    : undefined

  const { data, isLoading } = useSWR<CertificatesPayload>(
    '/api/certificates',
    fetcher,
    { keepPreviousData: true, dedupingInterval: 30_000 }
  )

  const all = data?.certificates ?? []

  const filtered = all
    .filter((c) => !type || c.certificate_type === type)
    .filter((c) => !category || c.event?.category === category)
    .sort(
      (a, b) =>
        new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
    )

  const counts = CERT_TYPES.map((t) => ({
    ...t,
    n: all.filter((c) => c.certificate_type === t.key).length,
  }))

  return (
    <div className="space-y-5">
      {/* Heading — instant. */}
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl">
          Certificates
        </h1>
        <p className="text-ink-soft mt-1">
          Every certificate you&apos;ve earned — view, download as PNG or PDF, or
          share a verified link.
        </p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <StatCard
          icon="certificate"
          label="Total"
          value={all.length}
          tint="mint"
          compact
        />
        {counts.slice(0, 3).map((c) => (
          <StatCard
            key={c.key}
            icon="star"
            label={c.label}
            value={c.n}
            tint={
              c.key === 'winner'
                ? 'peach'
                : c.key === 'runnerup'
                  ? 'blue'
                  : 'indigo'
            }
            compact
          />
        ))}
      </div>

      {/* Filters — instant, client-side. */}
      <div className="space-y-3">
        <FilterRow
          items={[
            { key: '', label: 'All types' },
            ...CERT_TYPES.map((t) => ({ key: t.key, label: t.label })),
          ]}
          activeKey={type ?? ''}
          param="type"
          otherParam={['category', category]}
        />
        <FilterRow
          items={[
            { key: '', label: 'All events' },
            ...CATEGORIES.map((c) => ({ key: c, label: CATEGORY_LABEL[c] })),
          ]}
          activeKey={category ?? ''}
          param="category"
          otherParam={['type', type]}
        />
      </div>

      {/* List */}
      {isLoading && all.length === 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="glass rounded-3xl h-24 animate-pulse"
            />
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="certificate"
            title={
              all.length === 0
                ? 'No certificates yet'
                : 'No certificates match these filters'
            }
            hint={
              all.length === 0
                ? 'Attend events that award certificates and they’ll show up here.'
                : 'Try clearing the filters.'
            }
          />
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/certificates/${c.serial}`}
                className="glass rounded-3xl p-4 flex items-center gap-4 transition-transform hover:-translate-y-0.5 group"
              >
                <span
                  className={`grid place-items-center w-12 h-12 rounded-2xl shrink-0 ${TYPE_TINT[c.certificate_type]}`}
                >
                  <Icon name="certificate" className="w-6 h-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">
                    {c.event?.title ?? CERT_LABEL[c.certificate_type]}
                  </p>
                  <p className="text-sm text-muted truncate">
                    {CERT_LABEL[c.certificate_type]} · {fullDate(c.issued_at)}
                  </p>
                  <p className="text-xs text-muted/80 font-mono tabular-nums mt-0.5">
                    {c.serial}
                  </p>
                </div>
                <Icon
                  name="arrow"
                  className="w-5 h-5 text-muted group-hover:text-indigo transition-colors shrink-0"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// URL-param filter chips (matches the events page).
function FilterRow({
  items,
  activeKey,
  param,
  otherParam,
}: {
  items: { key: string; label: string }[]
  activeKey: string
  param: string
  otherParam: [string, string | undefined]
}) {
  return (
    <div className="flex flex-nowrap sm:flex-wrap gap-2 overflow-x-auto sm:overflow-visible no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      {items.map((item) => {
        const params = new URLSearchParams()
        if (item.key) params.set(param, item.key)
        const [oname, oval] = otherParam
        if (oval) params.set(oname, oval)
        const qs = params.toString()
        const active = activeKey === item.key
        return (
          <Link
            key={item.key || 'all'}
            href={qs ? `/dashboard/certificates?${qs}` : '/dashboard/certificates'}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              active
                ? 'bg-indigo text-white'
                : 'bg-white/60 text-ink-soft hover:bg-white'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
