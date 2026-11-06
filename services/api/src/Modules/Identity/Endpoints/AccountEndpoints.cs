using FitnessCompanion.Api.Modules.Identity.Entities;
using FitnessCompanion.Api.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FitnessCompanion.Api.Modules.Identity.Endpoints;

public static class AccountEndpoints
{
    public static void MapAccountEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/v1/account", DeleteAccount).RequireAuthorization();
    }

    /// <summary>Deletes the user and every row they own, and revokes their refresh tokens —
    /// required by Apple App Store and Google Play (PRD §3.1, §7.9). As new modules add
    /// user-owned tables, their deletion must be added here too.</summary>
    private static async Task<IResult> DeleteAccount(
        ICurrentUser currentUser,
        UserManager<ApplicationUser> userManager,
        AppDbContext db,
        CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(currentUser.UserId.ToString());
        if (user is null)
        {
            return Results.Problem(title: "User not found.", statusCode: StatusCodes.Status404NotFound);
        }

        var tokens = await db.RefreshTokens.Where(t => t.UserId == user.Id).ToListAsync(ct);
        db.RefreshTokens.RemoveRange(tokens);
        await db.SaveChangesAsync(ct);

        await userManager.DeleteAsync(user);

        return Results.NoContent();
    }
}
