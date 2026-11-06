using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Profile;

/// <summary>PRD §8.3 targets: append-only history — the client only ever inserts a new row
/// (never edits one in place), so this is plain id-keyed via RecordConflictResolver exactly like
/// WorkoutSession/SetEntry, even though a real edit-vs-edit collision should never occur here.</summary>
public class Target : BaseEntity
{
    public DateOnly EffectiveFrom { get; set; }
    public int KcalRest { get; set; }
    public int KcalTraining { get; set; }
    public decimal ProteinG { get; set; }
    public decimal FatG { get; set; }
    public decimal CarbG { get; set; }
    public int WaterMl { get; set; }
    public required string Source { get; set; }
}
