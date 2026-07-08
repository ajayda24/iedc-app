import type { EventCategory } from '@/lib/supabase/database.types'

// Default certificate template per event category. Today every category maps to
// the flagship 'aurora' template; the map exists so new templates can be routed
// by category later without touching call sites.
const CATEGORY_TEMPLATE: Record<EventCategory, string> = {
  workshop: 'aurora',
  bootcamp: 'aurora',
  hackathon: 'aurora',
  competition: 'aurora',
  talk: 'aurora',
  meeting: 'aurora',
}

export const DEFAULT_TEMPLATE = 'aurora'

// Resolve which template to render, in priority order:
//   1. the event's explicit `certificate_template` (staff override)
//   2. the category default
//   3. the global fallback
export function resolveTemplateId(
  explicit: string | null | undefined,
  category: EventCategory | null | undefined
): string {
  if (explicit) return explicit
  if (category) return CATEGORY_TEMPLATE[category] ?? DEFAULT_TEMPLATE
  return DEFAULT_TEMPLATE
}
