using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Workouts;

/// <summary>PRD §8.3 workout_template. ItemsJson is an opaque client-serialized
/// {exerciseId,setCount,order}[] blob — not modeled as child rows, since PRD §7.5's conflict
/// rule treats the whole template as one last-write-wins unit.</summary>
public class WorkoutTemplate : BaseEntity
{
    public required string Name { get; set; }
    public required string ItemsJson { get; set; }
}
