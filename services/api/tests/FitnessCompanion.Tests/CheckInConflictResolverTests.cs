using FitnessCompanion.Api.Modules.Progress;
using FitnessCompanion.Api.Modules.Sync;
using Xunit;

namespace FitnessCompanion.Tests;

public class CheckInConflictResolverTests
{
    private static readonly DateTimeOffset Earlier = new(2026, 1, 5, 7, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset Later = new(2026, 1, 5, 8, 0, 0, TimeSpan.Zero);
    private static readonly Guid RecordA = Guid.NewGuid();
    private static readonly Guid RecordB = Guid.NewGuid();

    [Fact]
    public void Resolve_Applies_WhenNoExistingRecord()
    {
        var decision = CheckInConflictResolver.Resolve(existing: null, incomingRecordId: RecordA, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(CheckInConflictResolver.Outcome.Apply, decision.Outcome);
        Assert.False(decision.Delete);
    }

    [Fact]
    public void Resolve_Applies_WhenExistingRecordIsATombstone()
    {
        var tombstoned = new CheckIn { Id = RecordA, Decision = "skipped", ClientUpdatedAt = Later, DeletedAt = Later };

        var decision = CheckInConflictResolver.Resolve(tombstoned, incomingRecordId: RecordB, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(CheckInConflictResolver.Outcome.Apply, decision.Outcome);
    }

    [Fact]
    public void Resolve_Conflicts_WhenADifferentDeviceIndependentlyCreatedTheSameWeek_EvenIfIncomingIsNewer()
    {
        // PRD §4.4: "first one created wins, later duplicates are merged into it" — unlike every
        // other unique-keyed entity, a newer timestamp from a DIFFERENT record does NOT win here.
        var existing = new CheckIn { Id = RecordA, Decision = "skipped", ClientUpdatedAt = Earlier };

        var decision = CheckInConflictResolver.Resolve(existing, incomingRecordId: RecordB, op: "upsert", incomingClientUpdatedAt: Later);

        Assert.Equal(CheckInConflictResolver.Outcome.Conflict, decision.Outcome);
    }

    [Fact]
    public void Resolve_Applies_WhenTheSameDeviceUpdatesItsOwnRecordWithANewerOrEqualTimestamp()
    {
        // Same RecordId as the existing row — this is the generating device recording the user's
        // decision after the fact, not a cross-device race, so it's always allowed to proceed.
        var existing = new CheckIn { Id = RecordA, Decision = "skipped", ClientUpdatedAt = Earlier };

        var decision = CheckInConflictResolver.Resolve(existing, incomingRecordId: RecordA, op: "upsert", incomingClientUpdatedAt: Later);

        Assert.Equal(CheckInConflictResolver.Outcome.Apply, decision.Outcome);
    }

    [Fact]
    public void Resolve_Conflicts_WhenTheSameRecordIsRetriedWithAnOlderTimestamp()
    {
        var existing = new CheckIn { Id = RecordA, Decision = "accepted", ClientUpdatedAt = Later };

        var decision = CheckInConflictResolver.Resolve(existing, incomingRecordId: RecordA, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(CheckInConflictResolver.Outcome.Conflict, decision.Outcome);
    }
}
