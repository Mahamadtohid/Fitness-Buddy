namespace FitnessCompanion.Api.Modules.Identity.Entities;

/// <summary>PRD §8.3 refresh_tokens. One row per issued refresh token; tokens issued from the
/// same login (and every rotation of it) share FamilyId so reuse of a revoked token can
/// revoke the whole family (PRD §7.8).</summary>
public class RefreshToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public required string TokenHash { get; set; }
    public Guid FamilyId { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public string? DeviceName { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public bool IsActive(DateTimeOffset now) => RevokedAt is null && ExpiresAt > now;
}
