using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Progress;

/// <summary>PRD §8.3 check_in: unique per user per week (enforced by a unique index in
/// AppDbContext) — "first one created wins, later duplicates are merged into it," same
/// unique-keyed conflict shape as schedule/food_override, lookup by (UserId, WeekStart) instead
/// of RecordId.</summary>
public class CheckIn : BaseEntity
{
    public DateOnly WeekStart { get; set; }
    public decimal TrendChange { get; set; }
    public int SuggestedKcal { get; set; }
    public required string Decision { get; set; }
}
