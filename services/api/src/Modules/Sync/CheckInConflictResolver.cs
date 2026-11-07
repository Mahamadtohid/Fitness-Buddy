using FitnessCompanion.Api.Modules.Progress;

namespace FitnessCompanion.Api.Modules.Sync;

/// <summary>PRD §4.4 check_in rule: "Unique per user per week; first one created wins, later
/// duplicates are merged into it." This is deliberately NOT the same "newer client_updated_at
/// wins" rule every other unique-keyed entity (schedule, food_override, profile) uses — a
/// check-in is a one-time historical record of what was decided, not an editable setting, so
/// whichever device's row reaches the server first for a given week stays canonical regardless
/// of timestamps. The one exception is a device continuing to push updates to the SAME record it
/// already created (e.g. recording the user's accept/edit/skip decision after the row was first
/// generated) — that's a same-id update-in-place, not a cross-device race, and is always allowed.</summary>
public static class CheckInConflictResolver
{
    public enum Outcome { Apply, Conflict }

    public sealed record Decision(Outcome Outcome, bool Delete);

    public static Decision Resolve(CheckIn? existing, Guid incomingRecordId, string op, DateTimeOffset incomingClientUpdatedAt)
    {
        var isDelete = op == "delete";

        if (existing is null || existing.DeletedAt is not null)
        {
            return new Decision(Outcome.Apply, isDelete);
        }

        if (existing.Id == incomingRecordId)
        {
            // Same record continuing to be updated by the device that created it (e.g. recording
            // the user's decision) — not the cross-device race the "first wins" rule guards
            // against. Still require newer-or-equal so a stale retried push can't regress it.
            var isAtLeastAsNew = incomingClientUpdatedAt >= existing.ClientUpdatedAt;
            return new Decision(isAtLeastAsNew ? Outcome.Apply : Outcome.Conflict, isDelete);
        }

        // A different record claiming the same week — the existing one was created first and
        // stays canonical no matter what the incoming timestamp says.
        return new Decision(Outcome.Conflict, isDelete);
    }
}
