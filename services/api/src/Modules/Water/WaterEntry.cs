using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Water;

/// <summary>PRD §8.3 water_entry: summed per day client-side. Append-mostly, plain id-keyed,
/// same shape as SetEntry.</summary>
public class WaterEntry : BaseEntity
{
    public DateOnly LocalDate { get; set; }
    public DateTimeOffset LoggedAt { get; set; }
    public int Ml { get; set; }
}
