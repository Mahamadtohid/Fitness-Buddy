namespace FitnessCompanion.Api.Shared;

/// <summary>Stamps PRD §7.5's global monotonically increasing server_seq, shared across every
/// synced entity so pull cursors have a single consistent ordering.</summary>
public interface IServerSequence
{
    Task<long> NextAsync(CancellationToken ct);
}
