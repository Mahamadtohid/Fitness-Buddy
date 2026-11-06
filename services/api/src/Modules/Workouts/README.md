# Workouts module

PRD §11 Phase 3. `WorkoutsEndpoints.MapWorkoutsEndpoints` stays empty by design — per PRD §7.4,
domain data moves through the Sync module's `/sync/push` and `/sync/pull` endpoints, not
per-entity CRUD. This module only defines the entities (`CustomExercise`, `WorkoutTemplate`,
`ScheduleEntry`, `WorkoutSession`, `SetEntry`); their sync wiring (conflict resolution, push
dispatch, pull sources) lives in `src/Modules/Sync/`.

The ~80-exercise seed catalog is shipped as static bundled data in the mobile app and never
touches the server — only user-created custom exercises (`CustomExercise`) are stored here.
