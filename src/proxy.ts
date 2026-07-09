// Next.js 16 renamed `middleware` -> `proxy` (Node.js runtime by default).
// This refreshes the Supabase auth session on every matched request so Server
// Components always see a valid session, and gates the protected app routes.
//
// IMPORTANT: proxy is NOT a security boundary on its own. Always re-check auth
// inside Server Actions / Route Handlers too (see lib/auth/queries.ts).
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require a logged-in user. Everything else (landing page, the
// /login and /signup flow, static assets) stays public. The whole app lives
// under /dashboard/*; there are no top-level /profile, /events or /admin routes.
const PROTECTED_PREFIXES = ['/dashboard']

export async function proxy(request: NextRequest) {
  // Skip RSC prefetches: the router fires these in the background as links enter
  // the viewport. They don't need gating (the real navigation will be gated) and
  // running auth on each just adds latency to every hover/scroll. The eventual
  // click still passes through here as a normal request.
  if (request.headers.get('next-router-prefetch') === '1') {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Gate with getClaims(): it verifies the JWT signature LOCALLY against the
  // project's cached JWKS — no auth-server round-trip per request (getUser()
  // hit the network ~200ms every navigation AND every RSC prefetch, the biggest
  // source of sluggish page switches). This still refreshes the session cookie
  // (the SSR client does that while reading claims). The middleware is NOT the
  // security boundary anyway — Server Components/Actions call getUser() and RLS
  // enforces access; here we only need a fast "is there a valid session" check.
  const { data: claims } = await supabase.auth.getClaims()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !claims) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  // Run on everything except static assets and image optimization.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
