using FitnessCompanion.Api.Modules.Identity.Services;
using Xunit;

namespace FitnessCompanion.Tests;

public class RefreshTokenHasherTests
{
    [Fact]
    public void Hash_IsDeterministic_ForTheSameInput()
    {
        const string token = "some-refresh-token-value";

        Assert.Equal(RefreshTokenHasher.Hash(token), RefreshTokenHasher.Hash(token));
    }

    [Fact]
    public void Hash_Differs_ForDifferentInputs()
    {
        Assert.NotEqual(RefreshTokenHasher.Hash("token-a"), RefreshTokenHasher.Hash("token-b"));
    }

    [Fact]
    public void Hash_NeverReturnsThePlainTextToken()
    {
        const string token = "some-refresh-token-value";

        Assert.NotEqual(token, RefreshTokenHasher.Hash(token));
    }
}
