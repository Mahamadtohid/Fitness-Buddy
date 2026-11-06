using FitnessCompanion.Api.Shared;

namespace FitnessCompanion.Api.Modules.Workouts;

/// <summary>PRD §8.3 schedule: one per user per weekday (enforced by a unique index in
/// AppDbContext), same unique-keyed conflict shape as weight_entry.</summary>
public class ScheduleEntry : BaseEntity
{
    public int Weekday { get; set; }
    public Guid? TemplateId { get; set; }
}
