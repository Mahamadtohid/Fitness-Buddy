using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Nutrition;

/// <summary>PRD §8.3 food_entry: either a reference to a catalog/custom FoodId, or a quick-add
/// raw kcal/protein entry with no food item. Append-mostly, plain id-keyed, same shape as
/// SetEntry.</summary>
public class FoodEntry : BaseEntity
{
    public DateOnly LocalDate { get; set; }
    public required string MealSlot { get; set; }
    public Guid? FoodId { get; set; }
    public string? QuickAddName { get; set; }
    public int? QuickAddKcal { get; set; }
    public decimal? QuickAddProteinG { get; set; }
    public decimal Servings { get; set; }
}
