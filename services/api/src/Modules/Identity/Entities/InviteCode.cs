namespace FitnessCompanion.Api.Modules.Identity.Entities;

/// <summary>PRD §8.3 invite_codes. Public sign-up is closed in v1 (PRD §1); every registration
/// must consume one single-use, expiring code.</summary>
public class InviteCode
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Code { get; set; }
    public Guid? CreatedBy { get; set; }
    public Guid? UsedBy { get; set; }
    public DateTimeOffset? UsedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public bool IsUsable(DateTimeOffset now) => UsedBy is null && ExpiresAt > now;
}
