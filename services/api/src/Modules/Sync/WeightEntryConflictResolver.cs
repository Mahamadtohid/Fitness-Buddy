using FitnessCompanion.Api.Modules.Progress;

namespace FitnessCompanion.Api.Modules.Sync;

/// <summary>PRD §7.5 conflict rule for weight_entry: one per user per local date; whichever write
/// has the newer client_updated_at wins — including the general "delete vs edit: delete wins
/// unless the edit is newer" rule, which this same comparison already implements.</summary>
public static class WeightEntryConflictResolver
{
    public enum Outcome { Apply, Conflict }

    public sealed record Decision(Outcome Outcome, bool Delete);

    public static Decision Resolve(WeightEntry? existing, string op, DateTimeOffset incomingClientUpdatedAt)
    {
        var isDelete = op == "delete";

        // No live row for this date yet (never existed, or was previously tombstoned) — nothing
        // to lose to, so the incoming op always applies.
        if (existing is null || existing.DeletedAt is not null)
        {
            return new Decision(Outcome.Apply, isDelete);
        }

        var incomingIsNewer = incomingClientUpdatedAt > existing.ClientUpdatedAt;
        return new Decision(incomingIsNewer ? Outcome.Apply : Outcome.Conflict, isDelete);
    }
}
