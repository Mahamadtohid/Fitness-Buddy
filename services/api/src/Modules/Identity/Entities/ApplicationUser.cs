using Microsoft.AspNetCore.Identity;

namespace FitnessCompanion.Api.Modules.Identity.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
