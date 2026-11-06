using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Nutrition;

/// <summary>PRD §8.3 saved_meal: a named combo logged in one tap. ItemsJson is an opaque
/// client-serialized blob (not child rows) — whole-record conflict unit, same shape as
/// workout_template.</summary>
public class SavedMeal : BaseEntity
{
    public required string Name { get; set; }
    public required string ItemsJson { get; set; }
}
