using FitnessCompanion.Api.Modules.Sync;
using FitnessCompanion.Api.Modules.Workouts;
using Xunit;

namespace FitnessCompanion.Tests;

public class ScheduleEntryConflictResolverTests
{
    private static readonly DateTimeOffset Earlier = new(2026, 1, 1, 7, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset Later = new(2026, 1, 1, 8, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Resolve_Applies_WhenNoExistingRecord()
    {
        var decision = ScheduleEntryConflictResolver.Resolve(existing: null, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(ScheduleEntryConflictResolver.Outcome.Apply, decision.Outcome);
        Assert.False(decision.Delete);
    }

    [Fact]
    public void Resolve_Applies_WhenExistingRecordIsATombstone()
    {
        var tombstoned = new ScheduleEntry { ClientUpdatedAt = Later, DeletedAt = Later };

        var decision = ScheduleEntryConflictResolver.Resolve(tombstoned, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(ScheduleEntryConflictResolver.Outcome.Apply, decision.Outcome);
    }

    [Fact]
    public void Resolve_Applies_WhenTwoDevicesIndependentlyCreateTheSameWeekday_AndIncomingIsNewer()
    {
        // Two devices, each offline, both assign Monday a template. The second device's push
        // arrives with a different RecordId but the same Weekday — this is the collision the
        // (UserId, Weekday) lookup (not RecordId) is meant to catch.
        var existing = new ScheduleEntry { Weekday = 1, ClientUpdatedAt = Earlier };

        var decision = ScheduleEntryConflictResolver.Resolve(existing, op: "upsert", incomingClientUpdatedAt: Later);

        Assert.Equal(ScheduleEntryConflictResolver.Outcome.Apply, decision.Outcome);
    }

    [Fact]
    public void Resolve_Conflicts_WhenIncomingEditIsOlderThanExisting()
    {
        var existing = new ScheduleEntry { Weekday = 1, ClientUpdatedAt = Later };

        var decision = ScheduleEntryConflictResolver.Resolve(existing, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(ScheduleEntryConflictResolver.Outcome.Conflict, decision.Outcome);
    }

    [Fact]
    public void Resolve_DeleteWins_WhenNewerThanExistingEdit()
    {
        var existing = new ScheduleEntry { Weekday = 1, ClientUpdatedAt = Earlier };

        var decision = ScheduleEntryConflictResolver.Resolve(existing, op: "delete", incomingClientUpdatedAt: Later);

        Assert.Equal(ScheduleEntryConflictResolver.Outcome.Apply, decision.Outcome);
        Assert.True(decision.Delete);
    }

    [Fact]
    public void Resolve_DeleteLoses_WhenOlderThanExistingEdit()
    {
        var existing = new ScheduleEntry { Weekday = 1, ClientUpdatedAt = Later };

        var decision = ScheduleEntryConflictResolver.Resolve(existing, op: "delete", incomingClientUpdatedAt: Earlier);

        Assert.Equal(ScheduleEntryConflictResolver.Outcome.Conflict, decision.Outcome);
    }
}
