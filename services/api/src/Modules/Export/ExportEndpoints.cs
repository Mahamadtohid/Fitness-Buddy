using FitnessCompanion.Api.Modules.Nutrition;
using FitnessCompanion.Api.Modules.Profile;
using FitnessCompanion.Api.Modules.Progress;
using FitnessCompanion.Api.Modules.Water;
using FitnessCompanion.Api.Modules.Workouts;
using FitnessCompanion.Api.Shared;
using Microsoft.EntityFrameworkCore;

namespace FitnessCompanion.Api.Modules.Export;

public static class ExportEndpoints
{
    /// <summary>PRD §7.4 `GET /api/v1/export` — a full JSON export of every table the caller owns.
    /// Distinct from the sync mechanism: a plain authenticated read, no outbox/idempotency/paging
    /// involved. Every DbSet queried here is already scoped to the caller by AppDbContext's
    /// automatic per-user query filter.</summary>
    public static void MapExportEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/v1/export", Export).RequireAuthorization();
    }

    private static async Task<IResult> Export(AppDbContext db, CancellationToken ct)
    {
        var export = new
        {
            weightEntries = await db.WeightEntries.ToListAsync(ct),
            customExercises = await db.CustomExercises.ToListAsync(ct),
            workoutTemplates = await db.WorkoutTemplates.ToListAsync(ct),
            scheduleEntries = await db.ScheduleEntries.ToListAsync(ct),
            workoutSessions = await db.WorkoutSessions.ToListAsync(ct),
            setEntries = await db.SetEntries.ToListAsync(ct),
            profile = await db.UserProfiles.ToListAsync(ct),
            targets = await db.Targets.ToListAsync(ct),
            customFoods = await db.CustomFoods.ToListAsync(ct),
            foodOverrides = await db.FoodOverrides.ToListAsync(ct),
            savedMeals = await db.SavedMeals.ToListAsync(ct),
            foodEntries = await db.FoodEntries.ToListAsync(ct),
            waterEntries = await db.WaterEntries.ToListAsync(ct),
            measurements = await db.Measurements.ToListAsync(ct),
            checkIns = await db.CheckIns.ToListAsync(ct),
        };

        return Results.Ok(export);
    }
}
