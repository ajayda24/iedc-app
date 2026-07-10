import { NextResponse } from 'next/server'
import { listMyCertificates } from '@/lib/queries'
import { getUser } from '@/lib/auth/queries'
import type { Certificate, EventRow } from '@/lib/supabase/database.types'

// Client data source for the certificates page. Returns the caller's
// certificates (with joined event). Filtering by type/category happens client
// side. Fetched via SWR — cached, background-revalidated for snappy revisits.

export type CertWithEvent = Certificate & { event: EventRow | null }

export interface CertificatesPayload {
  certificates: CertWithEvent[]
}

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const certificates = await listMyCertificates()
  return NextResponse.json({ certificates } satisfies CertificatesPayload)
}
