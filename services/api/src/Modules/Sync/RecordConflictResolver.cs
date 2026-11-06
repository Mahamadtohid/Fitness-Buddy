namespace FitnessCompanion.Api.Modules.Sync;

/// <summary>Shared plain id-keyed conflict rule (PRD §7.5) for every append-mostly/whole-record
/// entity added from Phase 3 on (custom_exercise, workout_template, workout_session, set_entry):
/// lookup is always by RecordId, so unlike weight_entry/schedule there's no secondary unique key
/// to resolve — just "does a live row already exist, and if so whose edit is newer."</summary>
public static class RecordConflictResolver
{
    public enum Outcome { Apply, Conflict }

    public sealed record Decision(Outcome Outcome, bool Delete);

    public static Decision Resolve(DateTimeOffset? existingClientUpdatedAt, bool existingIsTombstoned, string op, DateTimeOffset incomingClientUpdatedAt)
    {
        var isDelete = op == "delete";

        if (existingClientUpdatedAt is null || existingIsTombstoned)
        {
            return new Decision(Outcome.Apply, isDelete);
        }

        var incomingIsNewer = incomingClientUpdatedAt > existingClientUpdatedAt;
        return new Decision(incomingIsNewer ? Outcome.Apply : Outcome.Conflict, isDelete);
    }
}
