namespace FitnessCompanion.Api.Shared;

/// <summary>Common columns for every synced table (PRD §8.1). Modules added in later phases
/// (Workouts, Nutrition, Progress, Water) derive from this.</summary>
public abstract class BaseEntity : IUserOwned
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ClientUpdatedAt { get; set; }
    public long Version { get; set; }
    public long ServerSeq { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}
