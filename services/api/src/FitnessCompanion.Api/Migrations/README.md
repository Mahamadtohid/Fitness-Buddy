# EF Core migrations

No migration has been generated here yet. EF Core migrations (the `*.cs`, `*.Designer.cs` and
`AppDbContextModelSnapshot.cs` triad) are tool-generated artifacts with exact formatting that
`dotnet ef` produces from the live model — hand-authoring them risked a migration that *looks*
right but silently diverges from what `dotnet ef database update` would actually apply, which is
worse than no migration at all.

The schema itself is fully defined in code and ready to generate from:
- `src/Shared/AppDbContext.cs` (DbSets, `OnModelCreating`, per-user query filter)
- `src/Modules/Identity/Entities/*.cs` (`ApplicationUser`, `RefreshToken`, `InviteCode`)
- ASP.NET Core Identity's own built-in tables (added automatically via `IdentityDbContext`)

Once the .NET 10 SDK is installed:

```bash
dotnet tool install --global dotnet-ef   # if not already installed
cd services/api
dotnet ef migrations add InitialCreate --project src/FitnessCompanion.Api --output-dir Migrations
dotnet ef database update --project src/FitnessCompanion.Api
```

This requires a reachable PostgreSQL instance matching `ConnectionStrings:Postgres` in
`appsettings.Development.json` (the docker-compose `postgres` service works for this).

## Phase 2 addition: sync engine

`AddWeightEntryAndSync` adds, on top of `InitialCreate`:
- `WeightEntries` table (PRD §8.3 `weight_entry`) with a unique index on `(UserId, LocalDate)`
  filtered to live (non-tombstoned) rows.
- `ProcessedOps` table (PRD §8.3 `processed_ops`), keyed by `(OpId, UserId)`.
- The `global_server_seq` Postgres sequence used to stamp `ServerSeq` on every applied/conflicted
  write (PRD §7.5).

If `InitialCreate` hasn't been generated yet, running `dotnet ef migrations add` once after
installing the SDK will fold both into a single initial migration — that's fine, there's no
need to generate them as two separate steps.

```bash
cd services/api
dotnet ef migrations add AddWeightEntryAndSync --project src/FitnessCompanion.Api --output-dir Migrations
dotnet ef database update --project src/FitnessCompanion.Api
```

## Phase 3 addition: workouts entities

`AddWorkoutsEntities` adds, on top of the above:
- `CustomExercises` table (PRD §8.3 `exercise`, custom rows only — the seeded catalog is
  client-only static data and never reaches the server).
- `WorkoutTemplates` table (PRD §8.3 `workout_template`) — `ItemsJson` is an opaque
  client-serialized blob, not child rows.
- `ScheduleEntries` table (PRD §8.3 `schedule`) with a unique index on `(UserId, Weekday)`
  filtered to live rows, same shape as `WeightEntries`' `(UserId, LocalDate)` index.
- `WorkoutSessions` table (PRD §8.3 `workout_session`), no date uniqueness.
- `SetEntries` table (PRD §8.3 `set_entry`), referencing `WorkoutSessions`/`CustomExercises`
  by id only (no FK constraint enforced yet — exercise ids can also be the client's static
  seeded-catalog UUIDs, which have no server-side row to reference).

```bash
cd services/api
dotnet ef migrations add AddWorkoutsEntities --project src/FitnessCompanion.Api --output-dir Migrations
dotnet ef database update --project src/FitnessCompanion.Api
```

## Phase 4 addition: profile, targets, nutrition and water entities

`AddNutritionProfileEntities` adds, on top of the above:
- `UserProfiles` table (PRD §8.3 `profile`) with a unique index on `UserId` alone (one live
  profile row per user — sync lookup is by UserId, not RecordId, since it's a singleton).
- `Targets` table (PRD §8.3 `targets`) — append-only history, no extra uniqueness.
- `CustomFoods` table (PRD §8.3 `food`, custom rows only — the seeded ~150-item catalog is
  client-only static data, same reasoning as Workouts' `CustomExercise`).
- `FoodOverrides` table (PRD §8.3 `food_override`) with a unique index on `(UserId, FoodId)`,
  same shape as `ScheduleEntries`' `(UserId, Weekday)` index.
- `SavedMeals` table (PRD §8.3 `saved_meal`) — `ItemsJson` is an opaque client-serialized blob.
- `FoodEntries` table (PRD §8.3 `food_entry`), no date uniqueness (multiple entries/day).
- `WaterEntries` table (PRD §8.3 `water_entry`), no date uniqueness (multiple entries/day).

```bash
cd services/api
dotnet ef migrations add AddNutritionProfileEntities --project src/FitnessCompanion.Api --output-dir Migrations
dotnet ef database update --project src/FitnessCompanion.Api
```

## Phase 5 addition: progress measurements and weekly check-in

`AddProgressCheckInEntities` adds, on top of the above:
- `Measurements` table (PRD §8.3 `measurement`) — append-mostly, no extra uniqueness, same shape
  as `SetEntries`.
- `CheckIns` table (PRD §8.3 `check_in`) with a unique index on `(UserId, WeekStart)` filtered to
  live rows. Conflict rule is deliberately different from every other unique-keyed entity: PRD
  §4.4's "first one created wins" means a different device's independently-created row for the
  same week always loses, regardless of timestamp — see `CheckInConflictResolver`.

```bash
cd services/api
dotnet ef migrations add AddProgressCheckInEntities --project src/FitnessCompanion.Api --output-dir Migrations
dotnet ef database update --project src/FitnessCompanion.Api
```
