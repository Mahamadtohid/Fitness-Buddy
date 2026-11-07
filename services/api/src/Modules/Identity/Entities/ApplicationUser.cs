using Microsoft.AspNetCore.Identity;

namespace FitnessCompanion.Api.Modules.Identity.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    /// <summary>Display name captured at sign-up. Nullable because accounts created before this
    /// field existed have none, and nothing in the app requires it to be set.</summary>
    public string? FullName { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
