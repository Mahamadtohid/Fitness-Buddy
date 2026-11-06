# EF Core migrations

No migration has been generated here yet. EF Core migrations (the `*.cs`, `*.Designer.cs` and
`AppDbContextModelSnapshot.cs` triad) are tool-generated artifacts with exact formatting that
`dotnet ef` produces from the live model — hand-authoring them risked a migration that *looks*
right but silently diverges from what `dotnet ef database update` would actually apply, which is
worse than no migration at all.

The schema itself is fully defined in code and ready to generate from:
- `src/Shared/AppDbContext.cs` (DbSets, `OnModelCreating`, per-user query filter)
- `src/Modules/Identity/Entities/*.cs` (`ApplicationUser`, `RefreshToken`, `InviteCode`)
- ASP.NET Core Identity's own built-in tables (added automatically via `IdentityDbContext`)

Once the .NET 10 SDK is installed:

```bash
dotnet tool install --global dotnet-ef   # if not already installed
cd services/api
dotnet ef migrations add InitialCreate --project src/FitnessCompanion.Api --output-dir Migrations
dotnet ef database update --project src/FitnessCompanion.Api
```

This requires a reachable PostgreSQL instance matching `ConnectionStrings:Postgres` in
`appsettings.Development.json` (the docker-compose `postgres` service works for this).
