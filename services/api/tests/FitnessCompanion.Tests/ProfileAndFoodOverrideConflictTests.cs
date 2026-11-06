using FitnessCompanion.Api.Modules.Sync;
using Xunit;

namespace FitnessCompanion.Tests;

/// <summary>`profile` (singleton, looked up by UserId alone) and `food_override` (unique per
/// (UserId, FoodId)) both reuse RecordConflictResolver's generic timestamp comparison — the
/// resolver itself doesn't care what the secondary key is, only SyncEndpoints' lookup query
/// differs per entity. RecordConflictResolverTests.cs already covers the comparison logic
/// exhaustively; these tests document the two entities' specific collision scenarios.</summary>
public class ProfileAndFoodOverrideConflictTests
{
    private static readonly DateTimeOffset Earlier = new(2026, 1, 1, 7, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset Later = new(2026, 1, 1, 8, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Profile_Applies_WhenSecondDeviceEditsTheSameSingletonProfileWithANewerTimestamp()
    {
        // Two devices, each offline, both edit "my profile" (there is only ever one profile row
        // per user — looked up by UserId, not RecordId). The second device's push arrives with a
        // different RecordId but the same UserId; the newer edit should win.
        var decision = RecordConflictResolver.Resolve(
            existingClientUpdatedAt: Earlier, existingIsTombstoned: false, op: "upsert", incomingClientUpdatedAt: Later);

        Assert.Equal(RecordConflictResolver.Outcome.Apply, decision.Outcome);
    }

    [Fact]
    public void Profile_Conflicts_WhenIncomingProfileEditIsOlderThanWhatsAlreadyStored()
    {
        var decision = RecordConflictResolver.Resolve(
            existingClientUpdatedAt: Later, existingIsTombstoned: false, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(RecordConflictResolver.Outcome.Conflict, decision.Outcome);
    }

    [Fact]
    public void FoodOverride_Applies_WhenTwoDevicesIndependentlyOverrideTheSameFoodId_AndIncomingIsNewer()
    {
        // Same shape as schedule's (UserId, Weekday) collision: two devices override the same
        // seeded food's nutrition values with different RecordIds but the same FoodId.
        var decision = RecordConflictResolver.Resolve(
            existingClientUpdatedAt: Earlier, existingIsTombstoned: false, op: "upsert", incomingClientUpdatedAt: Later);

        Assert.Equal(RecordConflictResolver.Outcome.Apply, decision.Outcome);
    }

    [Fact]
    public void FoodOverride_Applies_WhenPreviousOverrideForThatFoodWasDeleted()
    {
        var decision = RecordConflictResolver.Resolve(
            existingClientUpdatedAt: Later, existingIsTombstoned: true, op: "upsert", incomingClientUpdatedAt: Earlier);

        Assert.Equal(RecordConflictResolver.Outcome.Apply, decision.Outcome);
    }
}
