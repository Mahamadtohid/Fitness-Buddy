namespace FitnessCompanion.Api.Shared;

/// <summary>PRD §8.3 processed_ops: idempotency ledger for sync pushes. A retried op_id is
/// acknowledged from here with its original result instead of being re-applied (PRD §7.5 step 3).
/// (OpId, UserId) is the primary key — a client-generated op_id only needs to be unique per user.</summary>
public class ProcessedOp
{
    public Guid OpId { get; set; }
    public Guid UserId { get; set; }
    public required string Status { get; set; }
    public string? Reason { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
