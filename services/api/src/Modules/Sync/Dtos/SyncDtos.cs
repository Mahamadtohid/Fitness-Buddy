using System.Text.Json;

namespace FitnessCompanion.Api.Modules.Sync.Dtos;

/// <summary>One outbox row from the client (PRD §7.5 step 1-2). Entity-specific fields (including
/// client_updated_at, used by conflict rules) travel inside Payload rather than as envelope
/// fields, so the envelope stays the same for every entity added in later phases.</summary>
public sealed record SyncOpDto(Guid OpId, string Entity, Guid RecordId, string Op, JsonElement Payload, long? BaseVersion);

public sealed record SyncPushRequest(IReadOnlyList<SyncOpDto> Ops);

public sealed record SyncOpResultDto(Guid OpId, string Status, string? Reason, object? ServerCopy);

public sealed record SyncPushResponse(IReadOnlyList<SyncOpResultDto> Results);

public sealed record SyncPullItemDto(string Entity, Guid RecordId, long ServerSeq, long Version, object Payload, DateTimeOffset? DeletedAt);

public sealed record SyncPullResponse(IReadOnlyList<SyncPullItemDto> Items, long NextCursor, bool HasMore);
