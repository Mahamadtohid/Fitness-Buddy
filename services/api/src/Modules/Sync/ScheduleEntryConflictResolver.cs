using FitnessCompanion.Api.Modules.Workouts;

namespace FitnessCompanion.Api.Modules.Sync;

/// <summary>PRD §7.5-style conflict rule for schedule: one per user per weekday (same
/// unique-keyed shape as weight_entry's WeightEntryConflictResolver); whichever write has the
/// newer client_updated_at wins, including delete-vs-edit.</summary>
public static class ScheduleEntryConflictResolver
{
    public enum Outcome { Apply, Conflict }

    public sealed record Decision(Outcome Outcome, bool Delete);

    public static Decision Resolve(ScheduleEntry? existing, string op, DateTimeOffset incomingClientUpdatedAt)
    {
        var isDelete = op == "delete";

        if (existing is null || existing.DeletedAt is not null)
        {
            return new Decision(Outcome.Apply, isDelete);
        }

        var incomingIsNewer = incomingClientUpdatedAt > existing.ClientUpdatedAt;
        return new Decision(incomingIsNewer ? Outcome.Apply : Outcome.Conflict, isDelete);
    }
}
