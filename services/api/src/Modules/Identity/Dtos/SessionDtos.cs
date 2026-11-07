namespace FitnessCompanion.Api.Modules.Identity.Dtos;

public sealed record SessionDto(Guid FamilyId, string? DeviceName, DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt);
