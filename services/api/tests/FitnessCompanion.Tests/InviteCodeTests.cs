using FitnessCompanion.Api.Modules.Identity.Entities;
using Xunit;

namespace FitnessCompanion.Tests;

public class InviteCodeTests
{
    [Fact]
    public void IsUsable_ReturnsTrue_ForFreshUnexpiredCode()
    {
        var invite = new InviteCode { Code = "ABC123", ExpiresAt = DateTimeOffset.UtcNow.AddDays(7) };

        Assert.True(invite.IsUsable(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsUsable_ReturnsFalse_WhenAlreadyUsed()
    {
        var invite = new InviteCode
        {
            Code = "ABC123",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            UsedBy = Guid.NewGuid(),
            UsedAt = DateTimeOffset.UtcNow,
        };

        Assert.False(invite.IsUsable(DateTimeOffset.UtcNow));
    }

    [Fact]
    public void IsUsable_ReturnsFalse_WhenExpired()
    {
        var invite = new InviteCode { Code = "ABC123", ExpiresAt = DateTimeOffset.UtcNow.AddDays(-1) };

        Assert.False(invite.IsUsable(DateTimeOffset.UtcNow));
    }
}
