# IEDC Hub — Supabase Backend

Auth + profile + events system for the IEDC Hub app.

## Files (run in this order in the Supabase SQL Editor)

1. **`schema.sql`** — extensions, enums, tables, auto-compute triggers, role helpers
2. **`roster-lifecycle.sql`** — converts stored `year`/`is_active` into derived values (no yearly UPDATEs); creates `students_current` & `profiles_current` views
3. **`rls.sql`** — Row Level Security policies + column-level grants
4. **`views.sql`** — leaderboard & department/year stat views (read from `profiles_current`)
5. **`view-security.sql`** — `security_invoker` + role grants so views respect table RLS (run LAST, after the views exist)

> **Always query the `students_current` and `profiles_current` views** for display —
> they expose live `year`, `is_active`, `is_alumni`. The base `students`/`profiles`
> tables only store the immutable `admission_year` anchor.

### Roster lifecycle — how year rollover & passout work for free
`year` is **not stored**; it's derived from an immutable `admission_year` + the current
academic year (flips each July). So:
- **New batch each July** → one bulk `INSERT` (the only recurring work).
- **Everyone advances a year** → nothing to do; it's computed.
- **Final-year students pass out** → `is_alumni` flips automatically when
  `current_year > program_length`; `is_active` follows.

`profiles.manual_active` (nullable) is an override for exceptions (ban / leave); `null`
means "follow the roster." See [`roster-lifecycle.sql`](./roster-lifecycle.sql).

## Data model

| Table | Purpose |
|-------|---------|
| `students` | Pre-loaded **roster** (the eligibility source of truth). Holds `student_id`, `name`, `email`, `department`, `year`. Seed this with dummy data. |
| `profiles` | The **account**. `profiles.id = auth.users.id`. Linked to a student via `student_id`. Counters are auto-computed. |
| `events` | Events. `benefits` is flattened into `benefit_attendance` / `benefit_certificate` / `benefit_activity_points`. |
| `event_registrations` | Who registered / attended an event. |
| `event_scores` | Rank + score per participant per event. |
| `certificates` | Issued certificates. |
| `notifications` | Targeted notices (all / department / year / individual). |

### Auto-computed counters
`profiles.total_points`, `total_events`, `total_certificates` are **never written directly**.
Triggers recompute them whenever `event_registrations`, `event_scores`, `certificates`,
or an event's `points` change:

- `total_events` = count of registrations with status `attended`
- `total_points` = Σ `events.points` for attended events + Σ `event_scores.score`
- `total_certificates` = count of certificates

Column grants in `rls.sql` allow students to update only `name`, `phone`, `avatar`
on their own profile — they cannot touch counters or `role`.

## Roles
- **student** — reads events/leaderboard, registers themselves, cancels own registration, edits own profile (limited columns).
- **coordinator** — manages events, registrations, scores, certificates, notifications.
- **admin** — everything, including roles and the `students` roster.

Role checks use `SECURITY DEFINER` helpers (`current_user_role()`, `is_staff()`, `is_admin()`)
to avoid RLS recursion on `profiles`.

## Leaderboard views
- `leaderboard` — overall student ranking (dense rank by points, tiebreak by events)
- `leaderboard_top3` — top 3 overall
- `leaderboard_by_department` — rank within each department
- `leaderboard_by_dept_year` — top 3 per department+year
- `department_stats` — per-department totals & averages
- `year_stats` — per-year totals & averages

---

## Signup flow (3-step stepper)

```
[1] enter studentId ──► [2] enter OTP code emailed to student ──► [3] set password ──► profile page
```

The OTP must be sent to the **email on file in `students`**, not an email the user types.
That requires a server-side step using the **service_role** key, so it goes in an Edge Function.

### Why an Edge Function?
- It looks up `student_id` in `students` (RLS would otherwise hide the roster from anon users).
- It confirms no `profiles` row exists yet for that student.
- It triggers Supabase Auth to email an OTP to the on-file address.

### Edge Function: `request-signup-otp`
Pseudocode (`supabase/functions/request-signup-otp/index.ts`):

```ts
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { studentId } = await req.json();

  // service_role bypasses RLS — keep this key server-side only
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. student must exist on the roster
  const { data: student } = await admin
    .from("students")
    .select("email")
    .eq("student_id", studentId)
    .single();
  if (!student) return json({ error: "Student not found" }, 404);

  // 2. must not already have an account
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("student_id", studentId)
    .maybeSingle();
  if (existing) return json({ error: "Account already exists" }, 409);

  // 3. send OTP to the ON-FILE email (shouldCreateUser creates the auth user)
  const { error } = await admin.auth.signInWithOtp({
    email: student.email,
    options: { shouldCreateUser: true },
  });
  if (error) return json({ error: error.message }, 400);

  return json({ ok: true, emailHint: maskEmail(student.email) });
});
```

### Client steps
1. **Step 1** — POST `studentId` to `request-signup-otp`. Show masked email hint.
2. **Step 2** — user enters the 6-digit code:
   ```ts
   await supabase.auth.verifyOtp({ email, token, type: "email" });
   ```
   (Carry `email` back from the function's hint flow, or have the function return a
   short-lived signed token; do **not** let the client pass an arbitrary email.)
3. **Step 3** — set a password and create the profile:
   ```ts
   await supabase.auth.updateUser({ password });

   // Create the profile, copying details from the roster.
   // Easiest: a second Edge Function `complete-signup` (service_role) that reads
   // students by the now-authenticated user's email and inserts the profile.
   ```

> **Recommended:** do the profile insert in a `complete-signup` Edge Function so the
> roster fields (`name`, `department`, `year`) are copied server-side and can't be spoofed.
> Alternatively the `profiles_insert_self` RLS policy lets the client insert its own row
> keyed to `auth.uid()` — but then the client supplies dept/year, which is less safe.

### Required environment variables
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# server / Edge Function only — never expose to the browser:
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Seeding the roster (example)
```sql
insert into students (student_id, name, email, department, year) values
  ('KTE21CS001', 'Asha Menon',  'asha@example.edu',  'CS', 3),
  ('KTE21EC014', 'Rahul Nair',  'rahul@example.edu', 'EC', 2),
  ('KTE22ME007', 'Fatima K',    'fatima@example.edu','ME', 1);
```
