using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Workouts;

/// <summary>PRD §8.3 set_entry: append-mostly core of strength history, plain id-keyed
/// last-write-wins per PRD §7.5.</summary>
public class SetEntry : BaseEntity
{
    public Guid SessionId { get; set; }
    public Guid ExerciseId { get; set; }
    public int SetNo { get; set; }
    public decimal WeightKg { get; set; }
    public int Reps { get; set; }
    public decimal? Rpe { get; set; }
    public bool IsWarmup { get; set; }
    public bool Completed { get; set; }
}
