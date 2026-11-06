using FitnessCompanion.Api.Modules.Sync;
using Xunit;

namespace FitnessCompanion.Tests;

public class RecordConflictResolverTests
{
    private static readonly DateTimeOffset Earlier = new(2026, 1, 1, 7, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset Later = new(2026, 1, 1, 8, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Resolve_Applies_WhenNoExistingRecord()
    {
        var decision = RecordConflictResolver.Resolve(
            existingClientUpdatedAt: null, existingIsTombstoned: false, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(RecordConflictResolver.Outcome.Apply, decision.Outcome);
        Assert.False(decision.Delete);
    }

    [Fact]
    public void Resolve_Applies_WhenExistingRecordIsATombstone()
    {
        var decision = RecordConflictResolver.Resolve(
            existingClientUpdatedAt: Later, existingIsTombstoned: true, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(RecordConflictResolver.Outcome.Apply, decision.Outcome);
    }

    [Fact]
    public void Resolve_Applies_WhenIncomingEditIsNewerThanExisting()
    {
        var decision = RecordConflictResolver.Resolve(
            existingClientUpdatedAt: Earlier, existingIsTombstoned: false, op: "upsert", incomingClientUpdatedAt: Later);

        Assert.Equal(RecordConflictResolver.Outcome.Apply, decision.Outcome);
        Assert.False(decision.Delete);
    }

    [Fact]
    public void Resolve_Conflicts_WhenIncomingEditIsOlderThanExisting()
    {
        var decision = RecordConflictResolver.Resolve(
            existingClientUpdatedAt: Later, existingIsTombstoned: false, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(RecordConflictResolver.Outcome.Conflict, decision.Outcome);
    }

    [Fact]
    public void Resolve_DeleteWins_WhenNewerThanExistingEdit()
    {
        var decision = RecordConflictResolver.Resolve(
            existingClientUpdatedAt: Earlier, existingIsTombstoned: false, op: "delete", incomingClientUpdatedAt: Later);

        Assert.Equal(RecordConflictResolver.Outcome.Apply, decision.Outcome);
        Assert.True(decision.Delete);
    }

    [Fact]
    public void Resolve_DeleteLoses_WhenOlderThanExistingEdit()
    {
        var decision = RecordConflictResolver.Resolve(
            existingClientUpdatedAt: Later, existingIsTombstoned: false, op: "delete", incomingClientUpdatedAt: Earlier);

        Assert.Equal(RecordConflictResolver.Outcome.Conflict, decision.Outcome);
    }
}
