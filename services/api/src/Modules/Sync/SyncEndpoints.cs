using System.Text.Json;
using FitnessCompanion.Api.Modules.Progress;
using FitnessCompanion.Api.Modules.Sync.Dtos;
using FitnessCompanion.Api.Modules.Workouts;
using FitnessCompanion.Api.Shared;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace FitnessCompanion.Api.Modules.Sync;

public static class SyncEndpoints
{
    private const int DefaultPullLimit = 200;
    private const int MaxPullLimit = 200;

    public static void MapSyncEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/sync").RequireAuthorization().RequireRateLimiting("sync");

        group.MapPost("/push", Push);
        group.MapGet("/pull", Pull);
    }

    private static async Task<IResult> Push(
        SyncPushRequest request,
        AppDbContext db,
        ICurrentUser currentUser,
        IServerSequence serverSequence,
        CancellationToken ct)
    {
        var results = new List<SyncOpResultDto>(request.Ops.Count);
        var now = DateTimeOffset.UtcNow;

        // Same record (or, for unique-keyed entities, the same key) appearing twice in one batch
        // must not race itself against the database — track what this request has already written.
        var touchedWeightEntries = new Dictionary<DateOnly, WeightEntry>();
        var touchedCustomExercises = new Dictionary<Guid, CustomExercise>();
        var touchedWorkoutTemplates = new Dictionary<Guid, WorkoutTemplate>();
        var touchedScheduleEntries = new Dictionary<int, ScheduleEntry>();
        var touchedWorkoutSessions = new Dictionary<Guid, WorkoutSession>();
        var touchedSetEntries = new Dictionary<Guid, SetEntry>();

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        foreach (var op in request.Ops)
        {
            var processed = await db.ProcessedOps.FindAsync([op.OpId, currentUser.UserId], ct);
            if (processed is not null)
            {
                results.Add(new SyncOpResultDto(op.OpId, processed.Status, processed.Reason, null));
                continue;
            }

            (string Status, string? Reason, object? ServerCopy) outcome = op.Entity switch
            {
                "weight_entry" => await ApplyWeightEntryAsync(op, currentUser.UserId, now, db, serverSequence, touchedWeightEntries, ct),
                "custom_exercise" => await ApplyCustomExerciseAsync(op, currentUser.UserId, now, db, serverSequence, touchedCustomExercises, ct),
                "workout_template" => await ApplyWorkoutTemplateAsync(op, currentUser.UserId, now, db, serverSequence, touchedWorkoutTemplates, ct),
                "schedule" => await ApplyScheduleEntryAsync(op, currentUser.UserId, now, db, serverSequence, touchedScheduleEntries, ct),
                "workout_session" => await ApplyWorkoutSessionAsync(op, currentUser.UserId, now, db, serverSequence, touchedWorkoutSessions, ct),
                "set_entry" => await ApplySetEntryAsync(op, currentUser.UserId, now, db, serverSequence, touchedSetEntries, ct),
                _ => ("rejected", "entity not supported yet", null),
            };

            db.ProcessedOps.Add(new ProcessedOp
            {
                OpId = op.OpId,
                UserId = currentUser.UserId,
                Status = outcome.Status,
                Reason = outcome.Reason,
                CreatedAt = now,
            });

            results.Add(new SyncOpResultDto(op.OpId, outcome.Status, outcome.Reason, outcome.ServerCopy));
        }

        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return Results.Ok(new SyncPushResponse(results));
    }

    private static DateTimeOffset GetClientUpdatedAt(SyncOpDto op, DateTimeOffset fallback) =>
        op.Payload.TryGetProperty("clientUpdatedAt", out var prop) ? prop.GetDateTimeOffset() : fallback;

    private static async Task<(string Status, string? Reason, object? ServerCopy)> ApplyWeightEntryAsync(
        SyncOpDto op,
        Guid userId,
        DateTimeOffset now,
        AppDbContext db,
        IServerSequence serverSequence,
        Dictionary<DateOnly, WeightEntry> touched,
        CancellationToken ct)
    {
        if (!op.Payload.TryGetProperty("localDate", out var localDateProp))
        {
            return ("rejected", "payload missing localDate", null);
        }

        var localDate = DateOnly.Parse(localDateProp.GetString()!);
        var clientUpdatedAt = GetClientUpdatedAt(op, now);

        if (!touched.TryGetValue(localDate, out var existing))
        {
            existing = await db.WeightEntries.SingleOrDefaultAsync(w => w.UserId == userId && w.LocalDate == localDate, ct);
        }

        var decision = WeightEntryConflictResolver.Resolve(existing, op.Op, clientUpdatedAt);

        if (decision.Outcome == WeightEntryConflictResolver.Outcome.Conflict)
        {
            return ("conflict", "a newer edit already exists for this date", ToPayload(existing!));
        }

        if (decision.Delete)
        {
            if (existing is null)
            {
                return ("applied", null, null); // already absent — deleting it is a no-op
            }

            existing.DeletedAt = now;
            existing.ClientUpdatedAt = clientUpdatedAt;
            existing.UpdatedAt = now;
            existing.Version++;
            existing.ServerSeq = await serverSequence.NextAsync(ct);
            touched[localDate] = existing;
            return ("applied", null, null);
        }

        if (!op.Payload.TryGetProperty("weightKg", out var weightKgProp))
        {
            return ("rejected", "payload missing weightKg", null);
        }

        var weightKg = weightKgProp.GetDecimal();

        if (existing is null)
        {
            existing = new WeightEntry
            {
                Id = op.RecordId,
                UserId = userId,
                LocalDate = localDate,
                WeightKg = weightKg,
                ClientUpdatedAt = clientUpdatedAt,
                CreatedAt = now,
                UpdatedAt = now,
                Version = 1,
                ServerSeq = await serverSequence.NextAsync(ct),
            };
            db.WeightEntries.Add(existing);
            touched[localDate] = existing;
            return ("applied", null, null);
        }

        existing.WeightKg = weightKg;
        existing.ClientUpdatedAt = clientUpdatedAt;
        existing.UpdatedAt = now;
        existing.DeletedAt = null;
        existing.Version++;
        existing.ServerSeq = await serverSequence.NextAsync(ct);
        touched[localDate] = existing;

        return ("applied", null, null);
    }

    private static async Task<(string Status, string? Reason, object? ServerCopy)> ApplyCustomExerciseAsync(
        SyncOpDto op,
        Guid userId,
        DateTimeOffset now,
        AppDbContext db,
        IServerSequence serverSequence,
        Dictionary<Guid, CustomExercise> touched,
        CancellationToken ct)
    {
        var clientUpdatedAt = GetClientUpdatedAt(op, now);

        if (!touched.TryGetValue(op.RecordId, out var existing))
        {
            existing = await db.CustomExercises.SingleOrDefaultAsync(e => e.Id == op.RecordId, ct);
        }

        var decision = RecordConflictResolver.Resolve(existing?.ClientUpdatedAt, existing?.DeletedAt is not null, op.Op, clientUpdatedAt);

        if (decision.Outcome == RecordConflictResolver.Outcome.Conflict)
        {
            return ("conflict", "a newer edit already exists for this record", ToPayload(existing!));
        }

        if (decision.Delete)
        {
            if (existing is null)
            {
                return ("applied", null, null);
            }

            existing.DeletedAt = now;
            existing.ClientUpdatedAt = clientUpdatedAt;
            existing.UpdatedAt = now;
            existing.Version++;
            existing.ServerSeq = await serverSequence.NextAsync(ct);
            touched[op.RecordId] = existing;
            return ("applied", null, null);
        }

        if (!op.Payload.TryGetProperty("name", out var nameProp) ||
            !op.Payload.TryGetProperty("muscleGroup", out var muscleGroupProp) ||
            !op.Payload.TryGetProperty("repMin", out var repMinProp) ||
            !op.Payload.TryGetProperty("repMax", out var repMaxProp) ||
            !op.Payload.TryGetProperty("restSeconds", out var restSecondsProp))
        {
            return ("rejected", "payload missing required custom_exercise fields", null);
        }

        var name = nameProp.GetString()!;
        var muscleGroup = muscleGroupProp.GetString()!;
        var equipment = op.Payload.TryGetProperty("equipment", out var equipmentProp) && equipmentProp.ValueKind != JsonValueKind.Null
            ? equipmentProp.GetString()
            : null;
        var isLowerBody = op.Payload.TryGetProperty("isLowerBody", out var isLowerBodyProp) && isLowerBodyProp.GetBoolean();
        var repMin = repMinProp.GetInt32();
        var repMax = repMaxProp.GetInt32();
        var restSeconds = restSecondsProp.GetInt32();

        if (existing is null)
        {
            existing = new CustomExercise
            {
                Id = op.RecordId,
                UserId = userId,
                Name = name,
                MuscleGroup = muscleGroup,
                Equipment = equipment,
                IsLowerBody = isLowerBody,
                RepMin = repMin,
                RepMax = repMax,
                RestSeconds = restSeconds,
                ClientUpdatedAt = clientUpdatedAt,
                CreatedAt = now,
                UpdatedAt = now,
                Version = 1,
                ServerSeq = await serverSequence.NextAsync(ct),
            };
            db.CustomExercises.Add(existing);
            touched[op.RecordId] = existing;
            return ("applied", null, null);
        }

        existing.Name = name;
        existing.MuscleGroup = muscleGroup;
        existing.Equipment = equipment;
        existing.IsLowerBody = isLowerBody;
        existing.RepMin = repMin;
        existing.RepMax = repMax;
        existing.RestSeconds = restSeconds;
        existing.ClientUpdatedAt = clientUpdatedAt;
        existing.UpdatedAt = now;
        existing.DeletedAt = null;
        existing.Version++;
        existing.ServerSeq = await serverSequence.NextAsync(ct);
        touched[op.RecordId] = existing;

        return ("applied", null, null);
    }

    private static async Task<(string Status, string? Reason, object? ServerCopy)> ApplyWorkoutTemplateAsync(
        SyncOpDto op,
        Guid userId,
        DateTimeOffset now,
        AppDbContext db,
        IServerSequence serverSequence,
        Dictionary<Guid, WorkoutTemplate> touched,
        CancellationToken ct)
    {
        var clientUpdatedAt = GetClientUpdatedAt(op, now);

        if (!touched.TryGetValue(op.RecordId, out var existing))
        {
            existing = await db.WorkoutTemplates.SingleOrDefaultAsync(t => t.Id == op.RecordId, ct);
        }

        var decision = RecordConflictResolver.Resolve(existing?.ClientUpdatedAt, existing?.DeletedAt is not null, op.Op, clientUpdatedAt);

        if (decision.Outcome == RecordConflictResolver.Outcome.Conflict)
        {
            return ("conflict", "a newer edit already exists for this record", ToPayload(existing!));
        }

        if (decision.Delete)
        {
            if (existing is null)
            {
                return ("applied", null, null);
            }

            existing.DeletedAt = now;
            existing.ClientUpdatedAt = clientUpdatedAt;
            existing.UpdatedAt = now;
            existing.Version++;
            existing.ServerSeq = await serverSequence.NextAsync(ct);
            touched[op.RecordId] = existing;
            return ("applied", null, null);
        }

        if (!op.Payload.TryGetProperty("name", out var nameProp) || !op.Payload.TryGetProperty("itemsJson", out var itemsJsonProp))
        {
            return ("rejected", "payload missing required workout_template fields", null);
        }

        var name = nameProp.GetString()!;
        var itemsJson = itemsJsonProp.GetString()!;

        if (existing is null)
        {
            existing = new WorkoutTemplate
            {
                Id = op.RecordId,
                UserId = userId,
                Name = name,
                ItemsJson = itemsJson,
                ClientUpdatedAt = clientUpdatedAt,
                CreatedAt = now,
                UpdatedAt = now,
                Version = 1,
                ServerSeq = await serverSequence.NextAsync(ct),
            };
            db.WorkoutTemplates.Add(existing);
            touched[op.RecordId] = existing;
            return ("applied", null, null);
        }

        existing.Name = name;
        existing.ItemsJson = itemsJson;
        existing.ClientUpdatedAt = clientUpdatedAt;
        existing.UpdatedAt = now;
        existing.DeletedAt = null;
        existing.Version++;
        existing.ServerSeq = await serverSequence.NextAsync(ct);
        touched[op.RecordId] = existing;

        return ("applied", null, null);
    }

    private static async Task<(string Status, string? Reason, object? ServerCopy)> ApplyScheduleEntryAsync(
        SyncOpDto op,
        Guid userId,
        DateTimeOffset now,
        AppDbContext db,
        IServerSequence serverSequence,
        Dictionary<int, ScheduleEntry> touched,
        CancellationToken ct)
    {
        if (!op.Payload.TryGetProperty("weekday", out var weekdayProp))
        {
            return ("rejected", "payload missing weekday", null);
        }

        var weekday = weekdayProp.GetInt32();
        var clientUpdatedAt = GetClientUpdatedAt(op, now);

        if (!touched.TryGetValue(weekday, out var existing))
        {
            existing = await db.ScheduleEntries.SingleOrDefaultAsync(s => s.UserId == userId && s.Weekday == weekday, ct);
        }

        var decision = ScheduleEntryConflictResolver.Resolve(existing, op.Op, clientUpdatedAt);

        if (decision.Outcome == ScheduleEntryConflictResolver.Outcome.Conflict)
        {
            return ("conflict", "a newer edit already exists for this weekday", ToPayload(existing!));
        }

        if (decision.Delete)
        {
            if (existing is null)
            {
                return ("applied", null, null);
            }

            existing.DeletedAt = now;
            existing.ClientUpdatedAt = clientUpdatedAt;
            existing.UpdatedAt = now;
            existing.Version++;
            existing.ServerSeq = await serverSequence.NextAsync(ct);
            touched[weekday] = existing;
            return ("applied", null, null);
        }

        Guid? templateId = op.Payload.TryGetProperty("templateId", out var templateIdProp) && templateIdProp.ValueKind != JsonValueKind.Null
            ? templateIdProp.GetGuid()
            : null;

        if (existing is null)
        {
            existing = new ScheduleEntry
            {
                Id = op.RecordId,
                UserId = userId,
                Weekday = weekday,
                TemplateId = templateId,
                ClientUpdatedAt = clientUpdatedAt,
                CreatedAt = now,
                UpdatedAt = now,
                Version = 1,
                ServerSeq = await serverSequence.NextAsync(ct),
            };
            db.ScheduleEntries.Add(existing);
            touched[weekday] = existing;
            return ("applied", null, null);
        }

        existing.TemplateId = templateId;
        existing.ClientUpdatedAt = clientUpdatedAt;
        existing.UpdatedAt = now;
        existing.DeletedAt = null;
        existing.Version++;
        existing.ServerSeq = await serverSequence.NextAsync(ct);
        touched[weekday] = existing;

        return ("applied", null, null);
    }

    private static async Task<(string Status, string? Reason, object? ServerCopy)> ApplyWorkoutSessionAsync(
        SyncOpDto op,
        Guid userId,
        DateTimeOffset now,
        AppDbContext db,
        IServerSequence serverSequence,
        Dictionary<Guid, WorkoutSession> touched,
        CancellationToken ct)
    {
        var clientUpdatedAt = GetClientUpdatedAt(op, now);

        if (!touched.TryGetValue(op.RecordId, out var existing))
        {
            existing = await db.WorkoutSessions.SingleOrDefaultAsync(s => s.Id == op.RecordId, ct);
        }

        var decision = RecordConflictResolver.Resolve(existing?.ClientUpdatedAt, existing?.DeletedAt is not null, op.Op, clientUpdatedAt);

        if (decision.Outcome == RecordConflictResolver.Outcome.Conflict)
        {
            return ("conflict", "a newer edit already exists for this record", ToPayload(existing!));
        }

        if (decision.Delete)
        {
            if (existing is null)
            {
                return ("applied", null, null);
            }

            existing.DeletedAt = now;
            existing.ClientUpdatedAt = clientUpdatedAt;
            existing.UpdatedAt = now;
            existing.Version++;
            existing.ServerSeq = await serverSequence.NextAsync(ct);
            touched[op.RecordId] = existing;
            return ("applied", null, null);
        }

        if (!op.Payload.TryGetProperty("localDate", out var localDateProp) ||
            !op.Payload.TryGetProperty("startedAt", out var startedAtProp))
        {
            return ("rejected", "payload missing required workout_session fields", null);
        }

        var localDate = DateOnly.Parse(localDateProp.GetString()!);
        var startedAt = startedAtProp.GetDateTimeOffset();
        Guid? templateId = op.Payload.TryGetProperty("templateId", out var templateIdProp) && templateIdProp.ValueKind != JsonValueKind.Null
            ? templateIdProp.GetGuid()
            : null;
        DateTimeOffset? endedAt = op.Payload.TryGetProperty("endedAt", out var endedAtProp) && endedAtProp.ValueKind != JsonValueKind.Null
            ? endedAtProp.GetDateTimeOffset()
            : null;
        var notes = op.Payload.TryGetProperty("notes", out var notesProp) && notesProp.ValueKind != JsonValueKind.Null
            ? notesProp.GetString()
            : null;

        if (existing is null)
        {
            existing = new WorkoutSession
            {
                Id = op.RecordId,
                UserId = userId,
                LocalDate = localDate,
                TemplateId = templateId,
                StartedAt = startedAt,
                EndedAt = endedAt,
                Notes = notes,
                ClientUpdatedAt = clientUpdatedAt,
                CreatedAt = now,
                UpdatedAt = now,
                Version = 1,
                ServerSeq = await serverSequence.NextAsync(ct),
            };
            db.WorkoutSessions.Add(existing);
            touched[op.RecordId] = existing;
            return ("applied", null, null);
        }

        existing.LocalDate = localDate;
        existing.TemplateId = templateId;
        existing.StartedAt = startedAt;
        existing.EndedAt = endedAt;
        existing.Notes = notes;
        existing.ClientUpdatedAt = clientUpdatedAt;
        existing.UpdatedAt = now;
        existing.DeletedAt = null;
        existing.Version++;
        existing.ServerSeq = await serverSequence.NextAsync(ct);
        touched[op.RecordId] = existing;

        return ("applied", null, null);
    }

    private static async Task<(string Status, string? Reason, object? ServerCopy)> ApplySetEntryAsync(
        SyncOpDto op,
        Guid userId,
        DateTimeOffset now,
        AppDbContext db,
        IServerSequence serverSequence,
        Dictionary<Guid, SetEntry> touched,
        CancellationToken ct)
    {
        var clientUpdatedAt = GetClientUpdatedAt(op, now);

        if (!touched.TryGetValue(op.RecordId, out var existing))
        {
            existing = await db.SetEntries.SingleOrDefaultAsync(s => s.Id == op.RecordId, ct);
        }

        var decision = RecordConflictResolver.Resolve(existing?.ClientUpdatedAt, existing?.DeletedAt is not null, op.Op, clientUpdatedAt);

        if (decision.Outcome == RecordConflictResolver.Outcome.Conflict)
        {
            return ("conflict", "a newer edit already exists for this record", ToPayload(existing!));
        }

        if (decision.Delete)
        {
            if (existing is null)
            {
                return ("applied", null, null);
            }

            existing.DeletedAt = now;
            existing.ClientUpdatedAt = clientUpdatedAt;
            existing.UpdatedAt = now;
            existing.Version++;
            existing.ServerSeq = await serverSequence.NextAsync(ct);
            touched[op.RecordId] = existing;
            return ("applied", null, null);
        }

        if (!op.Payload.TryGetProperty("sessionId", out var sessionIdProp) ||
            !op.Payload.TryGetProperty("exerciseId", out var exerciseIdProp) ||
            !op.Payload.TryGetProperty("setNo", out var setNoProp) ||
            !op.Payload.TryGetProperty("weightKg", out var weightKgProp) ||
            !op.Payload.TryGetProperty("reps", out var repsProp))
        {
            return ("rejected", "payload missing required set_entry fields", null);
        }

        var sessionId = sessionIdProp.GetGuid();
        var exerciseId = exerciseIdProp.GetGuid();
        var setNo = setNoProp.GetInt32();
        var weightKg = weightKgProp.GetDecimal();
        var reps = repsProp.GetInt32();
        decimal? rpe = op.Payload.TryGetProperty("rpe", out var rpeProp) && rpeProp.ValueKind != JsonValueKind.Null
            ? rpeProp.GetDecimal()
            : null;
        var isWarmup = op.Payload.TryGetProperty("isWarmup", out var isWarmupProp) && isWarmupProp.GetBoolean();
        var completed = op.Payload.TryGetProperty("completed", out var completedProp) && completedProp.GetBoolean();

        if (existing is null)
        {
            existing = new SetEntry
            {
                Id = op.RecordId,
                UserId = userId,
                SessionId = sessionId,
                ExerciseId = exerciseId,
                SetNo = setNo,
                WeightKg = weightKg,
                Reps = reps,
                Rpe = rpe,
                IsWarmup = isWarmup,
                Completed = completed,
                ClientUpdatedAt = clientUpdatedAt,
                CreatedAt = now,
                UpdatedAt = now,
                Version = 1,
                ServerSeq = await serverSequence.NextAsync(ct),
            };
            db.SetEntries.Add(existing);
            touched[op.RecordId] = existing;
            return ("applied", null, null);
        }

        existing.SessionId = sessionId;
        existing.ExerciseId = exerciseId;
        existing.SetNo = setNo;
        existing.WeightKg = weightKg;
        existing.Reps = reps;
        existing.Rpe = rpe;
        existing.IsWarmup = isWarmup;
        existing.Completed = completed;
        existing.ClientUpdatedAt = clientUpdatedAt;
        existing.UpdatedAt = now;
        existing.DeletedAt = null;
        existing.Version++;
        existing.ServerSeq = await serverSequence.NextAsync(ct);
        touched[op.RecordId] = existing;

        return ("applied", null, null);
    }

    private static async Task<IResult> Pull(long? cursor, int? limit, IEnumerable<ISyncPullSource> pullSources, CancellationToken ct)
    {
        var effectiveLimit = Math.Clamp(limit ?? DefaultPullLimit, 1, MaxPullLimit);
        var sinceSeq = cursor ?? 0;

        // Six tables share one global ServerSeq ordering (AppDbContext's global_server_seq
        // sequence) — each source is already scoped to the caller via the automatic per-user
        // query filter, and does not exclude tombstones, so deletes are pulled too.
        var candidates = new List<SyncPullItemDto>();
        foreach (var source in pullSources)
        {
            candidates.AddRange(await source.FetchSinceAsync(sinceSeq, effectiveLimit + 1, ct));
        }

        candidates.Sort((a, b) => a.ServerSeq.CompareTo(b.ServerSeq));

        var hasMore = candidates.Count > effectiveLimit;
        var page = hasMore ? candidates.Take(effectiveLimit).ToList() : candidates;

        var nextCursor = page.Count > 0 ? page[^1].ServerSeq : sinceSeq;

        return Results.Ok(new SyncPullResponse(page, nextCursor, hasMore));
    }

    private static object ToPayload(WeightEntry entry) => new
    {
        localDate = entry.LocalDate.ToString("yyyy-MM-dd"),
        weightKg = entry.WeightKg,
        clientUpdatedAt = entry.ClientUpdatedAt,
    };

    private static object ToPayload(CustomExercise entry) => new
    {
        name = entry.Name,
        muscleGroup = entry.MuscleGroup,
        equipment = entry.Equipment,
        isLowerBody = entry.IsLowerBody,
        repMin = entry.RepMin,
        repMax = entry.RepMax,
        restSeconds = entry.RestSeconds,
        clientUpdatedAt = entry.ClientUpdatedAt,
    };

    private static object ToPayload(WorkoutTemplate entry) => new
    {
        name = entry.Name,
        itemsJson = entry.ItemsJson,
        clientUpdatedAt = entry.ClientUpdatedAt,
    };

    private static object ToPayload(ScheduleEntry entry) => new
    {
        weekday = entry.Weekday,
        templateId = entry.TemplateId,
        clientUpdatedAt = entry.ClientUpdatedAt,
    };

    private static object ToPayload(WorkoutSession entry) => new
    {
        localDate = entry.LocalDate.ToString("yyyy-MM-dd"),
        templateId = entry.TemplateId,
        startedAt = entry.StartedAt,
        endedAt = entry.EndedAt,
        notes = entry.Notes,
        clientUpdatedAt = entry.ClientUpdatedAt,
    };

    private static object ToPayload(SetEntry entry) => new
    {
        sessionId = entry.SessionId,
        exerciseId = entry.ExerciseId,
        setNo = entry.SetNo,
        weightKg = entry.WeightKg,
        reps = entry.Reps,
        rpe = entry.Rpe,
        isWarmup = entry.IsWarmup,
        completed = entry.Completed,
        clientUpdatedAt = entry.ClientUpdatedAt,
    };
}
