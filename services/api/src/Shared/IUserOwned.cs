namespace FitnessCompanion.Api.Shared;

/// <summary>Marker for entities owned by a single user; entities implementing this get an
/// automatic EF Core global query filter on <see cref="UserId"/> (see AppDbContext.OnModelCreating).</summary>
public interface IUserOwned
{
    Guid UserId { get; }
}
