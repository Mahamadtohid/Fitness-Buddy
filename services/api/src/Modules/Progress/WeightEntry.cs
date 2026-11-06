using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Progress;

/// <summary>PRD §8.3 weight_entry: one per user per local date (enforced by a unique index in
/// AppDbContext). Conflict rule and sync wiring live in the Sync module (PRD §7.4 — domain data
/// moves through sync endpoints, not per-entity CRUD, so ProgressEndpoints stays empty).</summary>
public class WeightEntry : BaseEntity
{
    public DateOnly LocalDate { get; set; }
    public decimal WeightKg { get; set; }
}
