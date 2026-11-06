using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Profile;

/// <summary>PRD §8.3 profile: one per user (enforced by a unique index on UserId alone in
/// AppDbContext). Sync lookup is by UserId only — no RecordId, no secondary field — since there
/// is exactly one live row per user. PRD describes per-field last-write-wins; this implements
/// whole-record last-write-wins instead (same simplification already made for workout_template's
/// "(conflict copy)" nuance in Phase 3) — acceptable for a single real device/user.</summary>
public class UserProfile : BaseEntity
{
    public required string Sex { get; set; }
    public DateOnly BirthDate { get; set; }
    public decimal HeightCm { get; set; }
    public decimal LifestyleFactor { get; set; }
    public required string Goal { get; set; }
    public decimal RateKgPerWeek { get; set; }
    public required string Units { get; set; }
    public required string TimeZone { get; set; }
}
