using FitnessCompanion.Api.Modules.Identity.Dtos;
using FitnessCompanion.Api.Modules.Identity.Entities;
using FitnessCompanion.Api.Modules.Identity.Services;
using FitnessCompanion.Api.Shared;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace FitnessCompanion.Api.Modules.Identity.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/auth").RequireRateLimiting("auth");

        group.MapPost("/register", Register);
        group.MapPost("/login", Login);
        group.MapPost("/refresh", Refresh);
        group.MapPost("/logout", Logout);
        group.MapPost("/forgot-password", ForgotPassword);
        group.MapPost("/reset-password", ResetPassword);
    }

    private static async Task<IResult> Register(
        RegisterRequest request,
        IValidator<RegisterRequest> validator,
        UserManager<ApplicationUser> userManager,
        AppDbContext db,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var now = DateTimeOffset.UtcNow;
        var invite = await db.InviteCodes.SingleOrDefaultAsync(i => i.Code == request.InviteCode, ct);
        if (invite is null || !invite.IsUsable(now))
        {
            return Results.Problem(
                title: "Invalid or expired invite code.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return Results.ValidationProblem(
                createResult.Errors.ToDictionary(e => e.Code, e => new[] { e.Description }));
        }

        invite.UsedBy = user.Id;
        invite.UsedAt = now;
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/v1/auth/users/{user.Id}", new { user.Id, user.Email });
    }

    private static async Task<IResult> Login(
        LoginRequest request,
        IValidator<LoginRequest> validator,
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        AppDbContext db,
        HttpContext http,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            return Results.Problem(title: "Invalid email or password.", statusCode: StatusCodes.Status401Unauthorized);
        }

        var response = await IssueTokenPairAsync(user, tokenService, db, Guid.NewGuid(), http, ct);
        return Results.Ok(response);
    }

    private static async Task<IResult> Refresh(
        RefreshRequest request,
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        AppDbContext db,
        HttpContext http,
        CancellationToken ct)
    {
        var hash = RefreshTokenHasher.Hash(request.RefreshToken);
        var now = DateTimeOffset.UtcNow;
        var existing = await db.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (existing is null)
        {
            return Results.Problem(title: "Invalid refresh token.", statusCode: StatusCodes.Status401Unauthorized);
        }

        if (existing.RevokedAt is not null || existing.ExpiresAt <= now)
        {
            // Reuse of an already-rotated/expired token: revoke the whole family (PRD §7.8).
            var family = await db.RefreshTokens.Where(t => t.FamilyId == existing.FamilyId && t.RevokedAt == null).ToListAsync(ct);
            foreach (var token in family)
            {
                token.RevokedAt = now;
            }
            await db.SaveChangesAsync(ct);
            return Results.Problem(title: "Refresh token has been revoked.", statusCode: StatusCodes.Status401Unauthorized);
        }

        var user = await userManager.FindByIdAsync(existing.UserId.ToString());
        if (user is null)
        {
            return Results.Problem(title: "Invalid refresh token.", statusCode: StatusCodes.Status401Unauthorized);
        }

        existing.RevokedAt = now;
        var response = await IssueTokenPairAsync(user, tokenService, db, existing.FamilyId, http, ct);
        return Results.Ok(response);
    }

    private static async Task<IResult> Logout(LogoutRequest request, AppDbContext db, CancellationToken ct)
    {
        var hash = RefreshTokenHasher.Hash(request.RefreshToken);
        var existing = await db.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (existing is not null)
        {
            existing.RevokedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
        }

        return Results.NoContent();
    }

    private static async Task<IResult> ForgotPassword(
        ForgotPasswordRequest request,
        UserManager<ApplicationUser> userManager,
        IEmailSender emailSender,
        CancellationToken ct)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is not null)
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            await emailSender.SendPasswordResetAsync(request.Email, token, ct);
        }

        // Always 204, whether or not the email exists, so the endpoint can't be used to enumerate accounts.
        return Results.NoContent();
    }

    private static async Task<IResult> ResetPassword(
        ResetPasswordRequest request,
        IValidator<ResetPasswordRequest> validator,
        UserManager<ApplicationUser> userManager,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return Results.ValidationProblem(validation.ToDictionary());
        }

        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return Results.Problem(title: "Invalid request.", statusCode: StatusCodes.Status400BadRequest);
        }

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            return Results.ValidationProblem(result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description }));
        }

        return Results.NoContent();
    }

    private static async Task<AuthResponse> IssueTokenPairAsync(
        ApplicationUser user,
        ITokenService tokenService,
        AppDbContext db,
        Guid familyId,
        HttpContext http,
        CancellationToken ct)
    {
        var accessToken = tokenService.CreateAccessToken(user, out var expiresAt);
        var refreshTokenPlainText = tokenService.CreateRefreshTokenPlainText();

        db.RefreshTokens.Add(new Entities.RefreshToken
        {
            UserId = user.Id,
            TokenHash = RefreshTokenHasher.Hash(refreshTokenPlainText),
            FamilyId = familyId,
            ExpiresAt = DateTimeOffset.UtcNow.Add(tokenService.RefreshTokenLifetime),
            DeviceName = http.Request.Headers.UserAgent.ToString(),
        });
        await db.SaveChangesAsync(ct);

        return new AuthResponse(accessToken, refreshTokenPlainText, expiresAt);
    }
}
