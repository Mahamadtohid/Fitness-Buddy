using Microsoft.EntityFrameworkCore;

namespace FitnessCompanion.Api.Shared;

/// <summary>Backed by the "global_server_seq" Postgres sequence declared in
/// AppDbContext.OnModelCreating.</summary>
public sealed class PostgresServerSequence(AppDbContext db) : IServerSequence
{
    public async Task<long> NextAsync(CancellationToken ct)
    {
        var values = await db.Database
            .SqlQueryRaw<long>("SELECT nextval('global_server_seq')")
            .ToListAsync(ct);
        return values[0];
    }
}
