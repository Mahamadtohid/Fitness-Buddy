using FitnessCompanion.Api.Modules.Sync.Dtos;

namespace FitnessCompanion.Api.Modules.Sync;

/// <summary>One entity type's contribution to GET /sync/pull. Phase 3 generalizes pull across
/// six tables that share one global ServerSeq ordering (PRD §7.5) — each source just queries its
/// own table scoped to the current user (via AppDbContext's automatic per-user filter);
/// SyncEndpoints.Pull merges every source's candidates and sorts by ServerSeq.</summary>
public interface ISyncPullSource
{
    Task<List<SyncPullItemDto>> FetchSinceAsync(long cursorExclusive, int limit, CancellationToken ct);
}
