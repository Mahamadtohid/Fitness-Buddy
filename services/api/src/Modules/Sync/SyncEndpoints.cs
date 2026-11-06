using FitnessCompanion.Api.Modules.Progress;
using FitnessCompanion.Api.Modules.Sync.Dtos;
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

        // Same local_date appearing twice in one batch (e.g. two offline edits to today's weigh-in)
        // must not race itself against the database — track what this request has already written.
        var touchedWeightEntries = new Dictionary<DateOnly, WeightEntry>();

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
        var clientUpdatedAt = op.Payload.TryGetProperty("clientUpdatedAt", out var clientUpdatedAtProp)
            ? clientUpdatedAtProp.GetDateTimeOffset()
            : now;

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

    private static async Task<IResult> Pull(long? cursor, int? limit, AppDbContext db, CancellationToken ct)
    {
        var effectiveLimit = Math.Clamp(limit ?? DefaultPullLimit, 1, MaxPullLimit);
        var sinceSeq = cursor ?? 0;

        // The global per-user query filter (AppDbContext.OnModelCreating) already scopes this to
        // the caller's own rows; it does not exclude tombstones, so deletes are pulled too.
        var rows = await db.WeightEntries
            .Where(w => w.ServerSeq > sinceSeq)
            .OrderBy(w => w.ServerSeq)
            .Take(effectiveLimit + 1)
            .ToListAsync(ct);

        var hasMore = rows.Count > effectiveLimit;
        var page = hasMore ? rows.Take(effectiveLimit).ToList() : rows;

        var items = page
            .Select(w => new SyncPullItemDto("weight_entry", w.Id, w.ServerSeq, w.Version, ToPayload(w), w.DeletedAt))
            .ToList();

        var nextCursor = page.Count > 0 ? page[^1].ServerSeq : sinceSeq;

        return Results.Ok(new SyncPullResponse(items, nextCursor, hasMore));
    }

    private static object ToPayload(WeightEntry entry) => new
    {
        localDate = entry.LocalDate.ToString("yyyy-MM-dd"),
        weightKg = entry.WeightKg,
        clientUpdatedAt = entry.ClientUpdatedAt,
    };
}
