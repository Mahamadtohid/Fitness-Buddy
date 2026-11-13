using Microsoft.AspNetCore.Identity;

namespace FitnessCompanion.Api.Modules.Identity.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    /// <summary>Display name captured at sign-up. Nullable because accounts created before this
    /// field existed have none, and nothing in the app requires it to be set.</summary>
    public string? FullName { get; set; }

    /// <summary>Stable Google OpenID Connect subject. The email is not used as the provider
    /// identifier because Google accounts can change email addresses.</summary>
    public string? GoogleSubject { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
