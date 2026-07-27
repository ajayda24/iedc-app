import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { EventRow } from '@/lib/supabase/database.types'

// Public feed of upcoming events for the marketing landing page (no auth). Uses
// the service-role client but hard-filters to PUBLISHED events starting from now
// and returns only presentation-safe fields — so nothing private is exposed even
// though RLS is bypassed. Cached briefly at the edge; the landing page is public.

export const revalidate = 60

// Trimmed shape sent to the public page — no created_by, no internal flags.
export interface PublicEvent {
  id: string
  title: string
  category: EventRow['category']
  start_date: string
  end_date: string | null
  venue: string | null
  banner: string | null
  points: number
}

export async function GET() {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('events')
    .select('id, title, category, start_date, end_date, venue, banner, points')
    .eq('status', 'published')
    .gte('start_date', now)
    .order('start_date', { ascending: true })
    .limit(6)

  if (error) {
    return NextResponse.json({ events: [] as PublicEvent[] }, { status: 200 })
  }

  return NextResponse.json({ events: (data ?? []) as PublicEvent[] })
}
