using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Nutrition;

/// <summary>PRD §8.3 food_override: the user's edited nutrition values for a seeded catalog food,
/// without changing the shared catalog. One per user per FoodId (enforced by a unique index on
/// (UserId, FoodId) in AppDbContext) — same unique-keyed conflict shape as schedule.</summary>
public class FoodOverride : BaseEntity
{
    public Guid FoodId { get; set; }
    public int Kcal { get; set; }
    public decimal ProteinG { get; set; }
    public decimal CarbG { get; set; }
    public decimal FatG { get; set; }
}
