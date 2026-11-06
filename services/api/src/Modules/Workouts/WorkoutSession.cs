using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Workouts;

/// <summary>PRD §8.3 workout_session: one per gym visit, no date uniqueness (multiple sessions
/// per day are allowed) — plain id-keyed last-write-wins per PRD §7.5.</summary>
public class WorkoutSession : BaseEntity
{
    public DateOnly LocalDate { get; set; }
    public Guid? TemplateId { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? EndedAt { get; set; }
    public string? Notes { get; set; }
}
