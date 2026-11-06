using FitnessCompanion.Api.Modules.Progress;
using FitnessCompanion.Api.Modules.Sync;
using Xunit;

namespace FitnessCompanion.Tests;

public class WeightEntryConflictResolverTests
{
    private static readonly DateTimeOffset Earlier = new(2026, 1, 1, 7, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset Later = new(2026, 1, 1, 8, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Resolve_Applies_WhenNoExistingRecord()
    {
        var decision = WeightEntryConflictResolver.Resolve(existing: null, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(WeightEntryConflictResolver.Outcome.Apply, decision.Outcome);
        Assert.False(decision.Delete);
    }

    [Fact]
    public void Resolve_Applies_WhenExistingRecordIsATombstone()
    {
        var tombstoned = new WeightEntry { ClientUpdatedAt = Later, DeletedAt = Later };

        var decision = WeightEntryConflictResolver.Resolve(tombstoned, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(WeightEntryConflictResolver.Outcome.Apply, decision.Outcome);
    }

    [Fact]
    public void Resolve_Applies_WhenIncomingEditIsNewerThanExisting()
    {
        var existing = new WeightEntry { ClientUpdatedAt = Earlier };

        var decision = WeightEntryConflictResolver.Resolve(existing, op: "upsert", incomingClientUpdatedAt: Later);

        Assert.Equal(WeightEntryConflictResolver.Outcome.Apply, decision.Outcome);
        Assert.False(decision.Delete);
    }

    [Fact]
    public void Resolve_Conflicts_WhenIncomingEditIsOlderThanExisting()
    {
        var existing = new WeightEntry { ClientUpdatedAt = Later };

        var decision = WeightEntryConflictResolver.Resolve(existing, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(WeightEntryConflictResolver.Outcome.Conflict, decision.Outcome);
    }

    [Fact]
    public void Resolve_DeleteWins_WhenNewerThanExistingEdit()
    {
        var existing = new WeightEntry { ClientUpdatedAt = Earlier };

        var decision = WeightEntryConflictResolver.Resolve(existing, op: "delete", incomingClientUpdatedAt: Later);

        Assert.Equal(WeightEntryConflictResolver.Outcome.Apply, decision.Outcome);
        Assert.True(decision.Delete);
    }

    [Fact]
    public void Resolve_DeleteLoses_WhenOlderThanExistingEdit()
    {
        var existing = new WeightEntry { ClientUpdatedAt = Later };

        var decision = WeightEntryConflictResolver.Resolve(existing, op: "delete", incomingClientUpdatedAt: Earlier);

        Assert.Equal(WeightEntryConflictResolver.Outcome.Conflict, decision.Outcome);
    }
}
