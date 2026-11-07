using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Progress;

/// <summary>PRD §8.3 measurement: append-mostly, multiple per type over time — same plain
/// id-keyed shape as SetEntry, no extra uniqueness.</summary>
public class Measurement : BaseEntity
{
    public DateOnly LocalDate { get; set; }
    public required string Type { get; set; }
    public decimal ValueCm { get; set; }
}
