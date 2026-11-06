using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Workouts;

/// <summary>PRD §8.3 exercise: user-created custom exercises only — the ~80 seeded catalog
/// entries are shipped as static bundled data in the mobile app and never touch the server
/// (they have no owning user, which doesn't fit the IUserOwned auto-filter on BaseEntity).</summary>
public class CustomExercise : BaseEntity
{
    public required string Name { get; set; }
    public required string MuscleGroup { get; set; }
    public string? Equipment { get; set; }
    public bool IsLowerBody { get; set; }
    public int RepMin { get; set; }
    public int RepMax { get; set; }
    public int RestSeconds { get; set; }
}
