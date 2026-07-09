# IEDC Hub

An events, leaderboard, and certificate platform for a college IEDC (Innovation
& Entrepreneurship Development Cell). Students discover and register for events,
climb a monthly leaderboard, and collect verifiable certificates; coordinators
and admins run the whole thing from a role-based dashboard.

Built with **Next.js 16** (App Router, React 19), **Supabase** (Postgres + Auth
+ Storage, RLS-secured), and **Tailwind CSS v4**.

## Features

- **Animated landing page** — 3D ambient canvas + scroll-driven "road journey".
- **Events** — browse, filter, and register in one tap; capacity, deadlines, and
  attendance tracking.
- **Leaderboard** — all-time and **monthly** boards (derived from date, so the
  month resets with no cron), plus per-department / per-year rankings.
- **Certificates** — code-designed templates rendered to A4 and exported as
  PNG/PDF; each has a public, anon-verifiable link (shareable on LinkedIn).
- **Profiles** — resume-style pages with activity timeline, certificates,
  monthly-honour badges, and social links.
- **Staff dashboard** — create/publish/manage events, mark attendance, score
  participants, and issue certificates.
- **Admin tools** — student roster (with Excel import), and users & roles.
- **Analytics** — participation and points dashboards with custom SVG charts.
- **Role-based access** — student / coordinator / admin, enforced in the app
  *and* by Postgres Row-Level Security.

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Supabase
(Postgres, Auth, Storage) · three.js / react-three-fiber · GSAP + Lenis ·
html-to-image + jsPDF (certificate export).

## Getting started

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is fine)

### 2. Install

```bash
npm install
```

### 3. Environment

Create a `.env` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-only, keep secret
```

### 4. Database

Run the SQL files in `src/supabase/` in your Supabase SQL editor, in order:

```
schema.sql → rls.sql → roster-lifecycle.sql → views.sql →
view-security.sql → profile-fields.sql → migrations-dashboard.sql →
leaderboard-monthly.sql → certificates-module.sql → avatars-bucket.sql
```

(`seed.sql` optionally loads sample data.)

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server                 |
| `npm run build`     | Production build                     |
| `npm run start`     | Serve the production build           |
| `npm run lint`      | Lint with ESLint                     |
| `npm run seed:roster` | Seed the student roster            |

## Project structure

```
src/
├─ app/                 # routes (landing, auth, dashboard/*, certificates/*)
├─ components/          # landing, dashboard, and certificate UI
├─ lib/                 # queries, auth, certificate config, Supabase clients
└─ supabase/            # SQL: schema, RLS, views, modules
```

## Contributing

Contributions are welcome — open an issue or a pull request. Please run
`npm run lint` and `npm run build` before submitting.

## License

Open source. A license file hasn't been added yet — MIT is recommended; drop a
`LICENSE` file in the root to make it official.
