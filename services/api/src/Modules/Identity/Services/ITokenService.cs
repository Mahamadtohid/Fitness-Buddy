using FitnessCompanion.Api.Modules.Identity.Entities;

namespace FitnessCompanion.Api.Modules.Identity.Services;

public interface ITokenService
{
    string CreateAccessToken(ApplicationUser user, out DateTimeOffset expiresAt);

    /// <summary>Returns the plain-text refresh token to hand to the client; only its hash is persisted.</summary>
    string CreateRefreshTokenPlainText();

    TimeSpan RefreshTokenLifetime { get; }
}
