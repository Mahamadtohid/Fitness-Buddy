using FitnessCompanion.Api.Modules.Progress;
using FitnessCompanion.Api.Modules.Sync.Dtos;
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
