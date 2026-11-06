namespace FitnessCompanion.Api.Modules.Identity.Options;

/// <summary>Bound from configuration section "Jwt". Access token lifetime 15 min, refresh 30
/// days, per PRD §7.8.</summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public required string Key { get; set; }
    public required string Issuer { get; set; }
    public required string Audience { get; set; }
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 30;
}
