# Fitness Companion — Product Requirements Document (v2)

**Version:** 2.0 · **Date:** Nov 6, 2026 · **Owner:** @Mahamadtohid
**Status:** Draft for build · **Previous version:** v1 (Nov 1, 2026)

> **What changed in v2:** full-stack architecture made concrete (ASP.NET Core + PostgreSQL backend, auth, sync engine); data model extended for sync; conflict, date/time-zone and store-compliance rules added; contradictions fixed (AI keys, widget priority, single-user scope); release plan re-planned from 8 to ~15 weeks; several open questions resolved with decisions.

---

## 1. Overview

Fitness Companion is a personal, offline-first mobile app for **Android and iOS** that puts workouts, food, body weight and water in one place, and uses each to adjust the others. It is backed by a secure cloud API so data is safe and available across devices.

**Primary user:** a software developer in Pune who trains in the gym 3–5 days a week and eats mostly home-cooked Indian food.

**Scope of users in v1:** built for personal use, but **multi-user capable** (every record is owned by an account and isolated per user). Public sign-up is **closed in v1** — accounts are created by invite code. This keeps hosting cost, support and legal scope small while leaving the door open to friends or a public release later.

**Problem.** Today this lives in 3–4 separate apps or nowhere. Workout logs don't know what I ate, calorie apps don't know I trained, and daily weight swings make it hard to tell if the plan is working. Logging Indian meals in generic food apps is slow.

**Vision.** Logging a full day takes under 2 minutes, and the app answers one question each week: *is my plan working, and what should I change?*

### Goals

- Log a workout set in 2 taps, with the last session's numbers pre-filled.
- Log a regular meal in 1 tap from saved meals.
- Show calories and protein remaining for today at a glance.
- Adjust calorie targets from training days and the real weight trend.
- Core logging works fully offline; changes sync to the backend when connectivity returns, without duplicates or data loss.
- Same features and data behavior on Android and iOS from v1.

### Non-goals (v1)

- Social features, sharing, leaderboards.
- Public open sign-up (invite-only in v1).
- Social / third-party login (email + password only in v1).
- A full public food database or barcode scanning.
- Wearable / health-platform sync (Health Connect, Apple Health) — v2.
- Cloud storage or sync of progress photos.
- Microservices.
- Medical or clinical advice; targets are general estimates.

---

## 2. Success metrics

The app succeeds if I still use it daily after 8 weeks of real use and it changes at least one decision a month.

| Metric | Target | How it's measured |
| --- | --- | --- |
| Logging consistency | Food logged ≥ 6 of 7 days | Days with ≥ 1 food entry |
| Workout logging | 100% of gym sessions logged | Sessions vs planned days |
| Time to log a day | < 2 min total | Self-timed for one week |
| Protein target hit | ≥ 5 of 7 days | Days within 10% of target |
| Weight trend vs goal | Within ±0.25 kg/week of planned rate | 7-day trend |
| Strength progress | Main lifts up over 8 weeks | Estimated 1-rep max per lift |
| Retention | Still opened daily at week 8 | Last-open dates |
| Sync reliability | 0 lost or duplicated records | Sync audit + integration tests |
| Sync latency | Changes on server < 10 s after reconnect | Client sync logs |

---

## 3. Core features

v1 ships five modules — Profile & targets, Workouts, Nutrition, Body progress, Water — tied together by a Today dashboard, plus Account and Sync.
**P0** = must have for v1 · **P1** = v1 if time allows · **P2** = later.

### 3.1 Account & sync

*As a user, I want my data backed up to my account and available on a new phone, while the app still works in the gym with no signal.*

- **P0** Sign up with invite code, email and password; log in; log out; password reset by email.
- **P0** Initial sync after first sign-in; afterwards the app works fully offline.
- **P0** Sync status indicator (synced / syncing / offline / error) with a "retry now" action and readable error messages.
- **P0** **Delete account** inside the app: removes all server data and signs out (required by Apple App Store and Google Play).
- **P0** Consent screen at sign-up and a privacy policy link (health-related personal data).
- **P1** Active sessions list and "sign out of all devices".

**Acceptance:** with airplane mode on after initial sync, I can log a full day; after reconnecting, everything appears on the server once, with no duplicates.

### 3.2 Profile & targets

*As a user, I want the app to calculate my daily calorie and protein targets so I don't have to work them out myself.*

- **P0** Onboarding captures sex, age, height, current weight, lifestyle activity level and goal (lose / maintain / gain) with a target rate per week.
- **P0** Calculates rest-day and training-day calorie targets plus protein, fat and carb targets (formulas in section 4).
- **P0** Targets recalculate when goal or activity changes, and via the weekly check-in; I can override any target manually.
- **P1** Units: kg/cm by default, lb/in optional (always stored in metric).

**Acceptance:** after onboarding, the dashboard shows today's calorie and protein target; editing my goal updates targets immediately.

### 3.3 Workout log

*As a user, I want to log my sets quickly in the gym and see that I'm getting stronger.*

- **P0** Exercise library (~80 common gym exercises, grouped by muscle) plus custom exercises.
- **P0** Workout templates (e.g. Push / Pull / Legs, Upper / Lower) and a weekly schedule of training days.
- **P0** Logging screen: each set = weight × reps, pre-filled from the last session of that exercise; one tap to confirm a set.
- **P0** Rest timer starts automatically after a set (default 90 s, per-exercise override), with vibration/haptic at the end.
- **P0** Progressive-overload hint (rules in section 4.5).
- **P1** Per-exercise history and estimated 1-rep max chart; personal-record badges.
- **P1** Optional RPE (effort 1–10) per set and session notes.
- **P2** Plate calculator, supersets, deload-week suggestions.

**Acceptance:** logging a 5-exercise workout needs no typing when weights don't change; finishing a workout marks today as a training day.

### 3.4 Nutrition: calories & protein

*As a user, I want to log my usual Indian meals in one tap and know how much I can still eat today.*

- **P0** Food entries with calories, protein, carbs, fat per serving; servings in grams or household units (katori, roti, piece, glass, scoop).
- **P0** Seed list of ~150 common Indian home foods and gym staples (dal, rice, roti, paneer, eggs, chicken, curd, whey, oats, peanut butter); values editable as personal overrides.
- **P0** Saved meals: a named combo (e.g. "Lunch: 2 roti + dal + sabzi + curd") logged in one tap, quantities adjustable before saving.
- **P0** Meals grouped as breakfast, lunch, snacks, dinner; "copy yesterday" for a meal.
- **P0** Today ring: calories eaten vs target, protein eaten vs target, macros remaining.
- **P1** Quick-add raw calories/protein without a food item (eating out).
- **P1** Recent and frequent foods at the top of search.
- **P1 (optional)** AI meal estimate from a text description or photo — see section 7.6. Opt-in; requires internet; keys live only on the server. Manual logging never depends on it.

**Acceptance:** logging a saved meal takes 1 tap + confirm; the dashboard ring updates instantly, online or offline.

### 3.5 Body progress

*As a user, I want to see whether my weight is really trending in the right direction, without being fooled by daily swings.*

- **P0** Daily weigh-in (one number, ideally morning).
- **P0** Trend weight shown beside the raw value and on a chart; weekly rate of change in kg/week.
- **P0** Weekly check-in card: trend change vs planned rate, and a suggested calorie adjustment.
- **P1** Measurements (waist, chest, arms, thighs) every 1–2 weeks.
- **P1** Progress photos, front/side/back, with side-by-side compare. **Stored only on the device; they do not sync and will not appear on a second phone in v1.** App lock protects them.

**Acceptance:** with 14+ days of weigh-ins the app shows a weekly rate and an adjustment suggestion.

### 3.6 Water

- **P0** Daily water target (default 35 ml per kg body weight, +500 ml on training days), editable.
- **P0** One-tap +250 ml / +500 ml / custom buttons on the dashboard.
- **P1** Reminders every 2 hours between set waking hours, skipped once the target is met.

### 3.7 Today dashboard

- **P0** One screen with: calories and protein left, today's workout (or rest day), water progress, weigh-in prompt if not logged, sync status.
- **P0** Week strip showing training days, food-logged days and target hits.
- **P2** Home-screen widget with calories/protein left and water (moved to v2; needs native widget modules on both platforms).

### 3.8 Data & settings

- **P0** Export all my data as a JSON file locally (works without the backend); CSV export per module.
- **P0** Import from a JSON export.
- **P1** Encrypted scheduled external backup (e.g. Google Drive).
- **P1** Dark mode; app lock (fingerprint / Face ID / PIN).

---

## 4. How the modules feed each other

My profile sets starting targets, training days raise them, food and weigh-ins measure what happened, and a weekly check-in corrects the targets. All numbers are defaults I can override. **All formulas live in a shared, pure domain module on the client** (unit-tested); the server stores results and validates inputs but does not need to recompute them.

### 4.1 Starting calorie target

Mifflin–St Jeor (w = weight kg, h = height cm, a = age years; s = +5 men, −161 women):

```
BMR = 10w + 6.25h − 5a + s
Rest-day target = BMR × f_lifestyle + (r × 7700) / 7
```

- f_lifestyle excludes gym sessions: 1.2 (desk job, little walking), 1.3 (some walking), 1.4 (on my feet a lot).
- r = planned rate in kg/week (negative to lose); 7700 kcal ≈ 1 kg body weight.
- **Training-day bump:** +300 kcal by default, mostly as carbs; editable, or estimated as session minutes × 5 kcal.
- **Which days count as training days (decision):** the schedule sets the *planned* target shown in the morning; the bump is *confirmed* when a workout is logged that day. If a scheduled workout is skipped, the target falls back to rest-day at the end of the day for check-in maths. An unscheduled logged workout adds the bump.
- **Guardrails:** planned loss capped at 1% of body weight per week, gain at 0.5%; the target never goes below BMR without a warning.

### 4.2 Macro targets

- **Protein:** 1.8 g/kg body weight by default (range 1.6–2.2). If BMI > 30, use goal weight.
- **Fat:** 25% of calories, never below 0.6 g/kg.
- **Carbs:** remaining calories. Training days get the extra carbs.

### 4.3 Weight trend

```
T_t = T_(t−1) + 0.1 × (W_t − T_(t−1))
```

Weekly rate = today's trend − trend 7 days ago. Missing days are skipped, not filled with zero.

### 4.4 Weekly check-in (adaptive targets)

Every Monday (user's local time zone), once there are ≥ 14 days of weigh-ins and food logged on ≥ 5 of the last 7 days:

1. Estimate real maintenance: average daily intake − (trend change kg × 7700 ÷ days).
2. Compare actual weekly rate with planned rate.
3. Suggest a calorie change of (planned − actual) × 7700 ÷ 7, capped at ±150 kcal per week.
4. I accept, edit or skip; nothing changes silently. An accepted change creates a new `targets` row with source = check-in.

If logging is too sparse, the check-in says so instead of guessing. Each check-in is stored as a `check_in` record so it is generated once, even across devices.

### 4.5 Progressive overload (double progression)

1. Each exercise has a rep range (e.g. 8–12) and a starting weight.
2. When every working set hits the top of the range for 2 sessions in a row, suggest +2.5 kg (upper body) or +5 kg (lower body).
3. After adding weight, reps drop toward the bottom of the range and the cycle repeats.
4. If reps fall below the range for 2 sessions, suggest holding or reducing weight by 10%.

### 4.6 Cross-module signals

- Training day logged → today's calorie and water targets rise.
- Protein under 70% of target by 8 pm → a reminder with saved high-protein options.
- Weight trend flat for 3 weeks on a cut → check-in suggests a smaller calorie change or a step-count goal (step goal is manual entry in v1; automatic steps arrive with health sync in v2).
- Strength dropping on a cut for 2+ weeks → note suggesting a slower rate of loss.

---

## 5. Screens and navigation

Five bottom tabs, Today as home, and a floating **+** button for quick logging anywhere. Navigation follows platform conventions (back gestures, sheets, dialogs) on each OS while keeping the same structure.

| Tab | Main screen | Key actions | Sub-screens |
| --- | --- | --- | --- |
| Today | Calories/protein rings, workout card, water bar, weigh-in prompt, week strip, sync status | Start workout, +water, log weight, open check-in | Weekly check-in |
| Train | This week's schedule and templates | Start / resume workout, edit templates | Active workout, exercise history, exercise library |
| Food | Today's meals by slot with totals | Log saved meal, search food, quick-add, copy yesterday | Food search, food editor, saved-meal builder, AI estimate review (optional) |
| Progress | Trend weight chart and weekly rate | Log weight, measurements, photos | Lift charts and PRs, measurements, photo compare |
| Settings | Profile and targets | Edit goal, override targets, units, reminders | Account, sync, export/import, backup, app lock, delete account |

**Auth screens (outside tabs):** welcome · sign up (invite code) · log in · forgot password · consent.

**Quick-add (+) sheet:** weight · water · saved meal · food search · start workout.

**Active workout screen rules:** large tap targets for sweaty hands, screen stays awake, rest timer shown in an ongoing notification, and a workout in progress survives the app being closed.

**Platform difference (documented):** on Android the rest timer runs in an ongoing notification. On iOS, a live lock-screen countdown needs Live Activities (a native module via an Expo config plugin); v1 iOS uses a scheduled notification at timer end, and Live Activities is P1.

---

## 6. UI / visual design requirements

The app must look intentionally designed and production-ready on both platforms.

- Define a small design system **before** building screens: color tokens (light + dark), typography scale, spacing scale, icon set, component shapes, interaction states.
- Clean visual hierarchy: calories, protein, workout and water are easy to scan without competing for attention.
- Restrained color, strong contrast, consistent alignment, purposeful whitespace — no decorative effects.
- Avoid template-like styling: no unnecessary gradients, card-within-card layouts, random accent colors, oversized headings, ornamental charts, glass effects, or emoji used as icons.
- One consistent component set for buttons, inputs, progress indicators, charts, sheets and cards; consistent radii, shadows and spacing.
- Charts and indicators always pair color with labels or values.
- Design empty, loading, error, **offline**, **syncing**, permission-denied and success states — not only the ideal screen.
- Follow each platform's conventions for navigation, sheets, keyboard, safe areas, status bar, haptics and permission prompts.
- Validate on a small and a large phone on each platform before release.

**Acceptance:** the five tabs and key logging flows behave consistently on Android and iOS; no screen uses placeholder styling or one-off components.

---

## 7. Architecture and tech stack

### 7.1 Decision summary

| Layer | Choice | Why it fits |
| --- | --- | --- |
| Mobile | React Native + Expo (SDK current at build time), TypeScript, Expo Router | One codebase for Android + iOS; fits a JS/TS developer |
| Local DB | SQLite via expo-sqlite + Drizzle ORM | Offline-first, typed schema and migrations |
| UI state | Zustand | Light transient state; persisted data goes through repositories |
| Server state & sync | Custom sync engine (outbox + push/pull) | Full control of conflicts; no vendor lock-in |
| Backend | ASP.NET Core Web API on **.NET 10 (LTS)**, modular monolith, Minimal APIs grouped per module | LTS support window; fast; one deployable |
| Server DB | PostgreSQL 16+ via EF Core 10 + Npgsql, explicit migrations | Reliable system of record, good JSON and indexing |
| Auth | ASP.NET Core Identity + JWT access tokens and rotating refresh tokens | Built in, free, no external provider needed for a small user base |
| Secure storage | expo-secure-store (Keychain / Keystore) | Tokens never stored in plain text |
| Validation | FluentValidation (server), Zod (client) | Same rules enforced on both sides |
| API contract | OpenAPI generated by ASP.NET Core; TypeScript client generated from it | Client and server DTOs never drift |
| Hosting | Docker container for the API + managed PostgreSQL (see 7.7) | Cheap, simple, portable |
| CI/CD | GitHub Actions; EAS Build / EAS Submit for apps | Automated tests, builds and store uploads |
| Monitoring | Sentry (crash + error reporting, PII scrubbing on); structured logs via Serilog | Treated as essential for reliability; no product analytics |
| Email | Transactional email provider for password reset (e.g. Resend or SendGrid) | Only sends account emails |

**Why not alternatives:** a Node/TypeScript backend would share types with the app, but the OpenAPI-generated client gives the same safety, and .NET gives strong typing, EF Core migrations and built-in Identity. Firebase/Supabase-style BaaS would be faster to start but makes custom conflict rules and the AI gateway harder to control. Microservices are explicitly out of scope.

### 7.2 Mobile app structure

```
app/                    Expo Router screens (UI only)
src/features/<module>/  profile, workouts, nutrition, progress, water, account, sync
    components/         presentational UI
    hooks/              screen-level hooks
src/domain/             pure TS: formulas, trend, check-in, overload rules (no React, no DB, no HTTP)
src/data/
    db/                 Drizzle schema, migrations, seed data
    repositories/       interfaces + SQLite implementations (write locally + enqueue outbox)
    sync/               outbox processor, push/pull client, conflict handling
    api/                generated OpenAPI client + auth interceptor (token refresh)
src/platform/           notifications, haptics, secure storage, file system, keep-awake adapters
src/design/             tokens, typography, components
```

**Rules:** screens never issue SQL or HTTP directly; they call repositories. Domain rules are unit-tested without rendering screens or touching the network.

### 7.3 Backend structure (modular monolith)

```
src/FitnessCompanion.Api/          host: Program.cs, auth, rate limiting, health checks, OpenAPI
src/Modules/
    Identity/      register (invite), login, refresh, revoke, password reset, delete account
    Profile/       profile, targets history, preferences
    Workouts/      exercises (custom), templates, schedule, sessions, sets
    Nutrition/     foods (custom + overrides), saved meals, food entries
    Progress/      weigh-ins, measurements, check-ins
    Water/         water entries
    Sync/          push, pull, cursors, idempotency, conflicts, tombstones
    Export/        server-side JSON export of all user data
    AiGateway/     provider-neutral meal estimation (optional, feature-flagged)
src/Shared/        DbContext, base entity, user context, result/error types
tests/             unit tests + integration tests (WebApplicationFactory + Testcontainers PostgreSQL)
```

Each module owns its endpoints, DTOs, validators and EF entity configuration. One `DbContext` and one database in v1. API DTOs are separate from EF entities and from mobile domain models.

### 7.4 API conventions

- Versioned REST: `/api/v1/...`. Breaking changes only in a new version.
- Every user-owned query is filtered by the authenticated `user_id` (EF Core global query filter **and** explicit checks in tests).
- Errors as RFC 7807 Problem Details.
- Rate limiting on auth, password reset, sync and AI endpoints.
- Health checks: `/health/live`, `/health/ready` (includes DB).
- Structured logs without sensitive payloads (no food, weight or token values in logs).
- **Minimum app version:** `/api/v1/meta` returns the minimum supported client version; older apps show an "update required" screen instead of breaking.

**Key endpoints**

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Sign up with invite code |
| POST | `/api/v1/auth/login` | Returns access + refresh token |
| POST | `/api/v1/auth/refresh` | Rotates refresh token |
| POST | `/api/v1/auth/logout` | Revokes refresh token |
| POST | `/api/v1/auth/forgot-password`, `/reset-password` | Password reset |
| DELETE | `/api/v1/account` | Delete account and all data |
| POST | `/api/v1/sync/push` | Upload a batch of changes |
| GET | `/api/v1/sync/pull?cursor=&limit=` | Download changes since cursor |
| GET | `/api/v1/export` | Full JSON export |
| POST | `/api/v1/ai/meal-estimate` | Optional AI estimate (feature-flagged) |
| GET | `/api/v1/meta` | Min app version, feature flags |

Domain data moves through the sync endpoints rather than per-entity CRUD, which keeps the API small. Read-only catalog endpoints (seed exercises/foods) can be added if needed.

### 7.5 Synchronization design

**Principles:** local first, server is system of record, sync is idempotent and resumable.

1. **Local write:** the repository writes to SQLite and, in the same transaction, appends an `outbox` row `{op_id (UUID), entity, record_id, op: upsert|delete, payload, base_version}`.
2. **Push:** when online (app start, foreground, reconnect, every 60 s while active, after writes with a 2 s debounce), the client sends outbox rows in batches of ≤ 200 to `/sync/push`.
3. **Server apply:** for each op, the server checks `op_id` in a `processed_ops` table (idempotency — a retried op is acknowledged, not re-applied), validates, applies the entity's conflict rule, bumps the row's `version`, and stamps a global monotonically increasing `server_seq` (PostgreSQL sequence).
4. **Ack:** response lists each op as `applied`, `merged`, `rejected` (with reason) or `conflict` (with server copy). The client removes acknowledged ops, writes back server versions and surfaces rejections in the sync status.
5. **Pull:** the client calls `/sync/pull?cursor=<last server_seq>` and pages until `has_more = false`, applying rows newer than its local version. Deletions arrive as tombstones.
6. **Retry:** exponential backoff (2 s → 5 min max) with jitter; the outbox survives app restarts.
7. **Initial sync:** after first sign-in, a full pull with paging; a progress indicator shows until done.

**Conflict rules (per entity)**

| Entity | Rule |
| --- | --- |
| set_entry, food_entry, water_entry, measurement | Append-mostly: different records always merge. Same record edited on two devices → last write wins by `client_updated_at`, server timestamp as tie-break. |
| weight_entry | One per user per local date (unique key). Two devices log the same date → latest `client_updated_at` wins. |
| workout_session | Merge child sets; session fields last-write-wins. |
| profile, preferences | Last write wins **per field** (field-level timestamps). |
| targets | Append-only history; never edited in place, so no conflicts. |
| check_in | Unique per user per week; first one created wins, later duplicates are merged into it. |
| workout_template, saved_meal | Last write wins for the whole record; the losing copy is kept as "(conflict copy)" for the user to delete. |
| Custom foods / exercises | Last write wins per record. |
| Any delete vs edit | Delete wins unless the edit's `client_updated_at` is newer than the delete. |

**Tombstones:** deletes set `deleted_at`; tombstones are kept on the server for 90 days, then purged. A client whose cursor is older than the purge window performs a full re-sync.

### 7.6 Optional AI meal estimation

- Opt-in and feature-flagged (`/meta`); disabled when no provider is configured. Manual search, saved meals and quick-add never depend on it.
- Input: text description and/or a meal photo. The photo is sent only for the estimate and **not stored** on the server.
- Flow: app → `/api/v1/ai/meal-estimate` → AiGateway → provider. The app never calls the provider directly.
- Provider-neutral contract: `{ items: [{ name, quantity, unit, kcal, protein_g, carb_g, fat_g, confidence }], assumptions, total }`.
- Server validates and clamps output (non-negative numbers, sane ranges, max items), handles timeouts, rate limits, malformed responses and provider errors.
- The user reviews and edits every item before it becomes a normal food entry. Nothing is added silently.
- Provider keys live only in server secret configuration — never in the app or source control.
- Per-user daily limit (default 20 estimates) to control cost.
- **Provider (decision):** start with one multimodal LLM provider behind the gateway; the choice is a config value, not a code dependency.

### 7.7 Hosting and environments (decision)

For a personal, invite-only app, keep it cheap and simple:

- **API:** one Docker container on a low-cost container host or small VPS (e.g. Railway, Render, Fly.io, or a small Hetzner/DigitalOcean VM with Docker Compose + Caddy for HTTPS). Prefer an Asia region close to India for latency.
- **Database:** managed PostgreSQL with automated daily backups and point-in-time recovery (e.g. Neon, Supabase Postgres, or the host's managed Postgres). Region matched to the API.
- **Secrets:** host's secret store / environment variables; JWT signing key and AI keys never in the repo.
- **Environments:** `dev` (local Docker Compose: API + PostgreSQL) and `prod`. A `staging` environment is P1.
- **Mobile builds:** EAS Build with `development`, `preview` (internal testers) and `production` profiles; each points to its matching API URL.

Check current pricing and free-tier limits when choosing; they change often.

### 7.8 Security

- Passwords hashed by ASP.NET Core Identity; lockout after repeated failures.
- Access token lifetime 15 min; refresh token 30 days, rotated on every use, revoked on logout and password change; refresh-token reuse revokes the whole token family.
- HTTPS only; HSTS on the API.
- Per-user data isolation tested for **every** user-owned resource.
- Invite codes are single-use and expire.
- Local SQLite is protected by the OS app sandbox; app lock (P1) guards photos and data on shared devices.

### 7.9 Privacy and compliance

- Collect only what the features need; no ads; no product analytics. Crash/error reporting (Sentry) is enabled with PII scrubbing and is disclosed in the privacy policy.
- Consent at sign-up for processing personal and health-related data; a privacy policy reachable in-app and on the store listing.
- **In-app account deletion** (Apple and Google requirement) deletes all server data; local data is wiped on that device.
- Data export available anytime (local JSON and server JSON).
- If the app is opened beyond personal use, review obligations under India's Digital Personal Data Protection (DPDP) Act before public launch.
- No third-party social login in v1, so Sign in with Apple is not required. If Google or other social login is added later, Sign in with Apple must be added on iOS.

---

## 8. Data model

SQLite is the local store; PostgreSQL is the server system of record. Matching domain records share stable client-generated UUIDs. Daily totals are computed from entries, never stored.

### 8.1 Common columns (every synced table)

| Column | Purpose |
| --- | --- |
| `id` | UUID, generated on the client |
| `user_id` | Owner (server; implied locally) |
| `created_at`, `updated_at` | UTC timestamps |
| `client_updated_at` | Device time of last edit, used for conflict rules |
| `version` | Incremented by the server on every applied change |
| `server_seq` | Global change sequence (server only) used by pull cursors |
| `deleted_at` | Tombstone; null when live |

### 8.2 Dates and time zones

- Every dated entry stores both a **`local_date`** (YYYY-MM-DD in the user's time zone at logging time) and a UTC timestamp.
- Daily totals, streaks and targets use `local_date`, so a late-night snack stays on the day it was eaten, even when travelling.
- The profile stores the user's IANA time zone (e.g. `Asia/Kolkata`); the day rolls over at local midnight; the weekly check-in uses local Monday.

### 8.3 Tables

| Table | Key fields | Notes |
| --- | --- | --- |
| profile | sex, birth_date, height_cm, lifestyle_factor, goal, rate_kg_per_week, units, time_zone, field-level timestamps | One per user |
| targets | effective_from, kcal_rest, kcal_training, protein_g, fat_g, carb_g, water_ml, source (auto / manual / check-in) | Append-only history |
| exercise | name, muscle_group, equipment, is_lower_body, rep_min, rep_max, rest_s, is_custom | ~80 seeded with **fixed UUIDs**, shared catalog; custom ones are user-owned |
| workout_template | name, items (exercise_id, set_count, order) | e.g. Push, Pull, Legs |
| schedule | weekday, template_id | Planned training days |
| workout_session | local_date, template_id, started_at, ended_at, notes | One per gym visit |
| set_entry | session_id, exercise_id, set_no, weight_kg, reps, rpe, is_warmup, completed | Core of strength history |
| food | name, serving_unit, serving_g, kcal, protein_g, carb_g, fat_g, is_custom | ~150 seeded with fixed UUIDs |
| food_override | food_id, edited nutrition values | User's edits to a seeded food, without changing the shared catalog |
| saved_meal | name, items (food_id, servings) | One-tap meals |
| food_entry | local_date, meal_slot, food_id or quick-add values, servings | Calories computed at read time |
| weight_entry | local_date, weight_kg | Unique per user per local_date |
| measurement | local_date, type (waist / chest / arm / thigh), value_cm | Optional |
| water_entry | local_date, logged_at, ml | Summed per day |
| check_in | week_start (local Monday), trend_change, suggested_kcal, decision (accepted / edited / skipped) | Unique per user per week |
| photo (local only) | local_date, pose, file_path | Not synced in v1 |

**Sync tables**

| Table | Where | Purpose |
| --- | --- | --- |
| outbox | client | Pending ops: op_id, entity, record_id, op, payload, base_version, attempts, last_error |
| sync_state | client | Last pull cursor, last successful sync, initial-sync status |
| processed_ops | server | op_id + user_id + result; guarantees idempotency (kept 30 days) |
| refresh_tokens | server | Hashed token, family_id, expiry, revoked_at, device name |
| invite_codes | server | Code, created_by, used_by, expires_at |

---

## 9. Non-functional requirements

- **Offline-first:** after initial sign-in and sync, all viewing, logging, editing and calculations work in airplane mode. Network is needed only for sign-up/login, initial sync, cross-device updates, export from server and AI estimates.
- **Speed:** app opens to Today in < 1.5 s; logging a set or meal responds in < 100 ms (local write; sync runs in the background).
- **Reliability:** workout progress saved after every set; outbox survives app termination; no lost or duplicated records after reconnect.
- **Backup:** server sync is the primary backup in v1, plus managed PostgreSQL daily backups; local JSON export always available; external encrypted backup is P1.
- **Accessibility:** ≥ 48 dp tap targets in the workout screen, readable in gym lighting, dark mode, dynamic text size, accessible labels on all controls.
- **Cross-platform:** every P0 flow works on Android and iOS; platform differences are documented (section 5) and tested.
- **Visual quality:** per section 6.
- **Battery:** rest timer and reminders use scheduled notifications; sync runs on app events, not a constant background process.
- **Security & privacy:** per sections 7.8 and 7.9.

---

## 10. Testing and quality

| Layer | Tooling | What's covered |
| --- | --- | --- |
| Domain rules (client) | Jest | BMR, macros, trend, check-in, overload, training-day logic, date rollover |
| Repositories & sync (client) | Jest with in-memory SQLite | Outbox writes, retries, conflict handling, tombstones |
| Backend unit | xUnit | Validators, conflict rules, token rotation |
| Backend integration | xUnit + WebApplicationFactory + Testcontainers (PostgreSQL) | Every endpoint, per-user isolation, idempotent push, paged pull |
| End-to-end | Maestro on Android emulator + iOS simulator | Onboarding, log workout, log meal, offline → online sync |
| Manual | Real devices (1 Android, 1 iPhone; small + large) | Notifications, haptics, permissions, gym use |

**CI (GitHub Actions):** on every PR, run lint + type-check + Jest (mobile) and build + xUnit + integration tests (backend). On merge to `main`, build the API Docker image and deploy to prod; trigger EAS preview builds on tags.

---

## 11. Release plan

v1 takes about **15 weeks** of evening and weekend work. The backend, auth and sync come first, so every feature after that is built on the real architecture rather than retrofitted.

| Phase | Weeks | Scope | Exit gate |
| --- | --- | --- | --- |
| 1. Foundation | 1–3 | Design system and tokens; Expo app shell with tabs; .NET 10 API skeleton; PostgreSQL + EF migrations; Identity + JWT auth; invite sign-up; CI; hosting for dev and prod | I can sign up and log in on both platforms against prod |
| 2. Sync engine | 4–5 | Outbox, push/pull, idempotency, cursors, tombstones, conflict framework; proven end to end with `weight_entry` | Airplane-mode weigh-ins sync with no duplicates |
| 3. Workouts | 6–8 | Exercise library, templates, schedule, active workout, rest timer, overload hints, synced | Every gym session logged for 1 week |
| 4. Nutrition + water | 9–11 | Food seed list, search, saved meals, copy yesterday, quick-add, Today rings, water + reminders | Food logged 6 of 7 days for 1 week |
| 5. Progress + check-in | 12–13 | Trend chart, weekly check-in, measurements, photos (local), JSON/CSV export and import | First real check-in accepted |
| 6. Hardening + release | 14–15 | Account deletion, consent and privacy policy, empty/error/offline states, platform polish, E2E tests, store submissions | **v1 used daily for 2 weeks** on both platforms |

**Optional in parallel or after week 15:** AI meal estimation behind the gateway (≈ 1–2 weeks).

**v2 candidates:** Health Connect / Apple Health (steps, weight), home-screen widgets, iOS Live Activities rest timer (if not done in v1), external encrypted backup, opt-in photo backup, plate calculator and deload suggestions, public sign-up, staging environment, optional Python + FastAPI service for specialized AI workloads.

---

## 12. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Backend + sync work delays the features I actually use | High | Sync proven on one entity in phase 2; strict P0 list; AI optional |
| Sync bugs cause lost or duplicated data | High | Transactional outbox, idempotent ops, integration tests, local JSON export, DB backups |
| Logging food feels like a chore and I stop | High | Saved meals, copy yesterday, quick-add; 1-tap logging target |
| Indian food calorie values are inaccurate | Medium | Editable overrides; weigh portions for the first 2 weeks to calibrate |
| Daily weight swings cause bad decisions | Medium | Decisions only from trend; check-in needs 14 days of data |
| iOS-specific limits (Live Activities, notifications) | Medium | Documented differences; scheduled notifications fallback |
| Hosting and AI costs creep up | Low–Medium | Small instance, invite-only, per-user AI limits, budget alerts |
| Store review rejection | Medium | Account deletion, privacy policy and consent built in phase 6 checklist |
| Scope creep delays v1 | Medium | P0 list fixed; new ideas go to v2 |

---

## 13. Decisions made in v2 (previously open)

| Question | Decision |
| --- | --- |
| Training days from schedule or logs? | Schedule sets the planned target; a logged workout confirms the bump (section 4.1). |
| Authentication option | ASP.NET Core Identity + JWT with rotating refresh tokens; email + password only. |
| Hosting | Docker API on a low-cost container host or VPS + managed PostgreSQL, Asia region (section 7.7). |
| Conflict policy | Per-entity rules (section 7.5). |
| Public sign-up | Invite-only in v1. |
| AI provider | One multimodal provider behind a provider-neutral gateway; swappable by config. |
| Home-screen widget | Moved to v2. |

## 14. Open questions

- [ ] Is a step-count goal worth adding to the check-in in v1 (manual entry), or wait for health sync in v2?
- [ ] Which specific host and managed PostgreSQL provider, after comparing current pricing?
- [ ] Which AI provider and model for meal estimation, after a small accuracy test on 20 typical Indian meals?
- [ ] Should a staging environment be in v1 or added only when there are other users?
