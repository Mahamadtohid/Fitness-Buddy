using FitnessCompanion.Api.Modules.Nutrition;
using FitnessCompanion.Api.Modules.Profile;
using FitnessCompanion.Api.Modules.Progress;
using FitnessCompanion.Api.Modules.Sync.Dtos;
using FitnessCompanion.Api.Modules.Water;
using FitnessCompanion.Api.Modules.Workouts;
using FitnessCompanion.Api.Shared;
using Microsoft.EntityFrameworkCore;

namespace FitnessCompanion.Api.Modules.Sync.PullSources;

public sealed class WeightEntryPullSource(AppDbContext db) : ISyncPullSource
{
    public async Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct)
    {
        var rows = await db.WeightEntries
            .Where(w => w.ServerSeq > cursorExclusive)
            .OrderBy(w => w.ServerSeq)
            .Take(limit)
            .ToListAsync(ct);

        return rows.Select(w => new SyncPullItemDto("weight_entry", w.Id, w.ServerSeq, w.Version, ToPayload(w), w.DeletedAt)).ToList();
    }

    private static object ToPayload(WeightEntry w) => new
    {
        localDate = w.LocalDate.ToString("yyyy-MM-dd"),
        weightKg = w.WeightKg,
        clientUpdatedAt = w.ClientUpdatedAt,
    };
}

public sealed class CustomExercisePullSource(AppDbContext db) : ISyncPullSource
{
    public async Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct)
    {
        var rows = await db.CustomExercises
            .Where(e => e.ServerSeq > cursorExclusive)
            .OrderBy(e => e.ServerSeq)
            .Take(limit)
            .ToListAsync(ct);

        return rows.Select(e => new SyncPullItemDto("custom_exercise", e.Id, e.ServerSeq, e.Version, ToPayload(e), e.DeletedAt)).ToList();
    }

    private static object ToPayload(CustomExercise e) => new
    {
        name = e.Name,
        muscleGroup = e.MuscleGroup,
        equipment = e.Equipment,
        isLowerBody = e.IsLowerBody,
        repMin = e.RepMin,
        repMax = e.RepMax,
        restSeconds = e.RestSeconds,
        clientUpdatedAt = e.ClientUpdatedAt,
    };
}

public sealed class WorkoutTemplatePullSource(AppDbContext db) : ISyncPullSource
{
    public async Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct)
    {
        var rows = await db.WorkoutTemplates
            .Where(t => t.ServerSeq > cursorExclusive)
            .OrderBy(t => t.ServerSeq)
            .Take(limit)
            .ToListAsync(ct);

        return rows.Select(t => new SyncPullItemDto("workout_template", t.Id, t.ServerSeq, t.Version, ToPayload(t), t.DeletedAt)).ToList();
    }

    private static object ToPayload(WorkoutTemplate t) => new
    {
        name = t.Name,
        itemsJson = t.ItemsJson,
        clientUpdatedAt = t.ClientUpdatedAt,
    };
}

public sealed class ScheduleEntryPullSource(AppDbContext db) : ISyncPullSource
{
    public async Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct)
    {
        var rows = await db.ScheduleEntries
            .Where(s => s.ServerSeq > cursorExclusive)
            .OrderBy(s => s.ServerSeq)
            .Take(limit)
            .ToListAsync(ct);

        return rows.Select(s => new SyncPullItemDto("schedule", s.Id, s.ServerSeq, s.Version, ToPayload(s), s.DeletedAt)).ToList();
    }

    private static object ToPayload(ScheduleEntry s) => new
    {
        weekday = s.Weekday,
        templateId = s.TemplateId,
        clientUpdatedAt = s.ClientUpdatedAt,
    };
}

public sealed class WorkoutSessionPullSource(AppDbContext db) : ISyncPullSource
{
    public async Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct)
    {
        var rows = await db.WorkoutSessions
            .Where(s => s.ServerSeq > cursorExclusive)
            .OrderBy(s => s.ServerSeq)
            .Take(limit)
            .ToListAsync(ct);

        return rows.Select(s => new SyncPullItemDto("workout_session", s.Id, s.ServerSeq, s.Version, ToPayload(s), s.DeletedAt)).ToList();
    }

    private static object ToPayload(WorkoutSession s) => new
    {
        localDate = s.LocalDate.ToString("yyyy-MM-dd"),
        templateId = s.TemplateId,
        startedAt = s.StartedAt,
        endedAt = s.EndedAt,
        notes = s.Notes,
        clientUpdatedAt = s.ClientUpdatedAt,
    };
}

public sealed class SetEntryPullSource(AppDbContext db) : ISyncPullSource
{
    public async Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct)
    {
        var rows = await db.SetEntries
            .Where(s => s.ServerSeq > cursorExclusive)
            .OrderBy(s => s.ServerSeq)
            .Take(limit)
            .ToListAsync(ct);

        return rows.Select(s => new SyncPullItemDto("set_entry", s.Id, s.ServerSeq, s.Version, ToPayload(s), s.DeletedAt)).ToList();
    }

    private static object ToPayload(SetEntry s) => new
    {
        sessionId = s.SessionId,
        exerciseId = s.ExerciseId,
        setNo = s.SetNo,
        weightKg = s.WeightKg,
        reps = s.Reps,
        rpe = s.Rpe,
        isWarmup = s.IsWarmup,
        completed = s.Completed,
        clientUpdatedAt = s.ClientUpdatedAt,
    };
}

public sealed class UserProfilePullSource(AppDbContext db) : ISyncPullSource
{
    public async Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct)
    {
        var rows = await db.UserProfiles
            .Where(p => p.ServerSeq > cursorExclusive)
            .OrderBy(p => p.ServerSeq)
            .Take(limit)
            .ToListAsync(ct);

        return rows.Select(p => new SyncPullItemDto("profile", p.Id, p.ServerSeq, p.Version, ToPayload(p), p.DeletedAt)).ToList();
    }

    private static object ToPayload(UserProfile p) => new
    {
        sex = p.Sex,
        birthDate = p.BirthDate.ToString("yyyy-MM-dd"),
        heightCm = p.HeightCm,
        lifestyleFactor = p.LifestyleFactor,
        goal = p.Goal,
        rateKgPerWeek = p.RateKgPerWeek,
        units = p.Units,
        timeZone = p.TimeZone,
        clientUpdatedAt = p.ClientUpdatedAt,
    };
}

public sealed class TargetPullSource(AppDbContext db) : ISyncPullSource
{
    public async Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct)
    {
        var rows = await db.Targets
            .Where(t => t.ServerSeq > cursorExclusive)
            .OrderBy(t => t.ServerSeq)
            .Take(limit)
            .ToListAsync(ct);

        return rows.Select(t => new SyncPullItemDto("targets", t.Id, t.ServerSeq, t.Version, ToPayload(t), t.DeletedAt)).ToList();
    }

    private static object ToPayload(Target t) => new
    {
        effectiveFrom = t.EffectiveFrom.ToString("yyyy-MM-dd"),
        kcalRest = t.KcalRest,
        kcalTraining = t.KcalTraining,
        proteinG = t.ProteinG,
        fatG = t.FatG,
        carbG = t.CarbG,
        waterMl = t.WaterMl,
        source = t.Source,
        clientUpdatedAt = t.ClientUpdatedAt,
    };
}

public sealed class CustomFoodPullSource(AppDbContext db) : ISyncPullSource
{
    public async Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct)
    {
        var rows = await db.CustomFoods
            .Where(f => f.ServerSeq > cursorExclusive)
            .OrderBy(f => f.ServerSeq)
            .Take(limit)
            .ToListAsync(ct);

        return rows.Select(f => new SyncPullItemDto("custom_food", f.Id, f.ServerSeq, f.Version, ToPayload(f), f.DeletedAt)).ToList();
    }

    private static object ToPayload(CustomFood f) => new
    {
        name = f.Name,
        servingUnit = f.ServingUnit,
        servingG = f.ServingG,
        kcal = f.Kcal,
        proteinG = f.ProteinG,
        carbG = f.CarbG,
        fatG = f.FatG,
        clientUpdatedAt = f.ClientUpdatedAt,
    };
}

public sealed class FoodOverridePullSource(AppDbContext db) : ISyncPullSource
{
    public async Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct)
    {
        var rows = await db.FoodOverrides
            .Where(f => f.ServerSeq > cursorExclusive)
            .OrderBy(f => f.ServerSeq)
            .Take(limit)
            .ToListAsync(ct);

        return rows.Select(f => new SyncPullItemDto("food_override", f.Id, f.ServerSeq, f.Version, ToPayload(f), f.DeletedAt)).ToList();
    }

    private static object ToPayload(FoodOverride f) => new
    {
        foodId = f.FoodId,
        kcal = f.Kcal,
        proteinG = f.ProteinG,
        carbG = f.CarbG,
        fatG = f.FatG,
        clientUpdatedAt = f.ClientUpdatedAt,
    };
}

public sealed class SavedMealPullSource(AppDbContext db) : ISyncPullSource
{
    public async Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct)
    {
        var rows = await db.SavedMeals
            .Where(m => m.ServerSeq > cursorExclusive)
            .OrderBy(m => m.ServerSeq)
            .Take(limit)
            .ToListAsync(ct);

        return rows.Select(m => new SyncPullItemDto("saved_meal", m.Id, m.ServerSeq, m.Version, ToPayload(m), m.DeletedAt)).ToList();
    }

    private static object ToPayload(SavedMeal m) => new
    {
        name = m.Name,
        itemsJson = m.ItemsJson,
        clientUpdatedAt = m.ClientUpdatedAt,
    };
}

public sealed class FoodEntryPullSource(AppDbContext db) : ISyncPullSource
{
    public async Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct)
    {
        var rows = await db.FoodEntries
            .Where(f => f.ServerSeq > cursorExclusive)
            .OrderBy(f => f.ServerSeq)
            .Take(limit)
            .ToListAsync(ct);

        return rows.Select(f => new SyncPullItemDto("food_entry", f.Id, f.ServerSeq, f.Version, ToPayload(f), f.DeletedAt)).ToList();
    }

    private static object ToPayload(FoodEntry f) => new
    {
        localDate = f.LocalDate.ToString("yyyy-MM-dd"),
        mealSlot = f.MealSlot,
        foodId = f.FoodId,
        quickAddName = f.QuickAddName,
        quickAddKcal = f.QuickAddKcal,
        quickAddProteinG = f.QuickAddProteinG,
        servings = f.Servings,
        clientUpdatedAt = f.ClientUpdatedAt,
    };
}

public sealed class WaterEntryPullSource(AppDbContext db) : ISyncPullSource
{
    public async Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct)
    {
        var rows = await db.WaterEntries
            .Where(w => w.ServerSeq > cursorExclusive)
            .OrderBy(w => w.ServerSeq)
            .Take(limit)
            .ToListAsync(ct);

        return rows.Select(w => new SyncPullItemDto("water_entry", w.Id, w.ServerSeq, w.Version, ToPayload(w), w.DeletedAt)).ToList();
    }

    private static object ToPayload(WaterEntry w) => new
    {
        localDate = w.LocalDate.ToString("yyyy-MM-dd"),
        loggedAt = w.LoggedAt,
        ml = w.Ml,
        clientUpdatedAt = w.ClientUpdatedAt,
    };
}
