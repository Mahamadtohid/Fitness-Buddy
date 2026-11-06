using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Nutrition;

/// <summary>PRD §8.3 food: user-created custom foods only — the ~150 seeded catalog entries are
/// shipped as static bundled data in the mobile app and never touch the server, same reasoning
/// as Workouts' CustomExercise.</summary>
public class CustomFood : BaseEntity
{
    public required string Name { get; set; }
    public required string ServingUnit { get; set; }
    public decimal ServingG { get; set; }
    public int Kcal { get; set; }
    public decimal ProteinG { get; set; }
    public decimal CarbG { get; set; }
    public decimal FatG { get; set; }
}
