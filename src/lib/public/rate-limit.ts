import 'server-only'

// Minimal fixed-window rate limiter for the public (no-login) Server Actions.
//
// In-memory, so it's per server instance — on serverless it softens bursts from
// one client rather than being a hard global cap. It exists to make brute-force
// guessing of student ID + email pairs slow and noisy. Swap for a shared store
// (e.g. Upstash/Redis) if abuse shows up in practice.
import { headers } from 'next/headers'

const buckets = new Map<string, { count: number; resetAt: number }>()

async function clientKey(scope: string): Promise<string> {
  const h = await headers()
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown'
  return `${scope}:${ip}`
}

// Returns true when the caller is within `limit` hits per `windowMs`.
export async function allowRequest(
  scope: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const key = await clientKey(scope)
  const now = Date.now()

  // Opportunistic cleanup so the map can't grow without bound.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  bucket.count += 1
  return bucket.count <= limit
}
