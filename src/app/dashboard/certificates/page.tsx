import Link from 'next/link'
import { listMyCertificates } from '@/lib/queries'
import type {
  CertificateType,
  EventCategory,
} from '@/lib/supabase/database.types'
import { Card, EmptyState, StatCard } from '@/components/dashboard/ui'
import { fullDate, CATEGORY_LABEL } from '@/components/dashboard/format'
import Icon from '@/components/landing/Icon'

// The current user's certificate wallet. Certificates are code-designed, so each
// row links to its live /certificates/<serial> page (view / download / share).
// Two filter rows (type + event category) and newest-first ordering, mirroring
// the events page's URL-searchParam filter pattern.

const CERT_TYPES: { key: CertificateType; label: string }[] = [
  { key: 'participation', label: 'Participation' },
  { key: 'winner', label: 'Winner' },
  { key: 'runnerup', label: 'Runner-up' },
  { key: 'volunteer', label: 'Volunteer' },
]
const CERT_LABEL = Object.fromEntries(
  CERT_TYPES.map((t) => [t.key, t.label])
) as Record<CertificateType, string>

// Accent tint per type, reusing the design tokens.
const TYPE_TINT: Record<CertificateType, string> = {
  participation: 'bg-indigo/12 text-indigo',
  winner: 'bg-peach/15 text-peach',
  runnerup: 'bg-sky/15 text-sky',
  volunteer: 'bg-mint/15 text-mint',
}

const CATEGORIES = Object.keys(CATEGORY_LABEL) as EventCategory[]

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string }>
}) {
  const sp = await searchParams
  const type = CERT_TYPES.some((t) => t.key === sp.type)
    ? (sp.type as CertificateType)
    : undefined
  const category = CATEGORIES.includes(sp.category as EventCategory)
    ? (sp.category as EventCategory)
    : undefined

  const all = await listMyCertificates()

  // Filter (type + event category) then sort newest-first by issue date.
  const filtered = all
    .filter((c) => !type || c.certificate_type === type)
    .filter((c) => !category || c.event?.category === category)
    .sort(
      (a, b) =>
        new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
    )

  // Summary counts by type (over all, not the filtered view).
  const counts = CERT_TYPES.map((t) => ({
    ...t,
    n: all.filter((c) => c.certificate_type === t.key).length,
  }))

  return (
    <div className="space-y-5">
      {/* Heading */}
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

      {/* Filters */}
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
      {filtered.length === 0 ? (
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

// URL-param filter chips (same behavior as the events page).
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
    // Mobile: single horizontally-scrollable row (no wrap) so filters take one
    // thin line; desktop (sm+) wraps inline. Mirrors the events page.
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
