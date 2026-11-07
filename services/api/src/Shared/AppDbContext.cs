using System.Linq.Expressions;
using FitnessCompanion.Api.Modules.Identity.Entities;
using FitnessCompanion.Api.Modules.Nutrition;
using FitnessCompanion.Api.Modules.Profile;
using FitnessCompanion.Api.Modules.Progress;
using FitnessCompanion.Api.Modules.Water;
using FitnessCompanion.Api.Modules.Workouts;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FitnessCompanion.Api.Shared;

/// <summary>One DbContext, one database in v1 (PRD §7.3). Every module's entities are
/// registered here as they're built; entities implementing <see cref="IUserOwned"/> get an
/// automatic per-user query filter so a missing WHERE clause can't leak another user's rows
/// (PRD §7.4, §7.8).</summary>
public class AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUser currentUser)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<InviteCode> InviteCodes => Set<InviteCode>();
    public DbSet<WeightEntry> WeightEntries => Set<WeightEntry>();
    public DbSet<ProcessedOp> ProcessedOps => Set<ProcessedOp>();
    public DbSet<CustomExercise> CustomExercises => Set<CustomExercise>();
    public DbSet<WorkoutTemplate> WorkoutTemplates => Set<WorkoutTemplate>();
    public DbSet<ScheduleEntry> ScheduleEntries => Set<ScheduleEntry>();
    public DbSet<WorkoutSession> WorkoutSessions => Set<WorkoutSession>();
    public DbSet<SetEntry> SetEntries => Set<SetEntry>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<Target> Targets => Set<Target>();
    public DbSet<CustomFood> CustomFoods => Set<CustomFood>();
    public DbSet<FoodOverride> FoodOverrides => Set<FoodOverride>();
    public DbSet<SavedMeal> SavedMeals => Set<SavedMeal>();
    public DbSet<FoodEntry> FoodEntries => Set<FoodEntry>();
    public DbSet<WaterEntry> WaterEntries => Set<WaterEntry>();
    public DbSet<Measurement> Measurements => Set<Measurement>();
    public DbSet<CheckIn> CheckIns => Set<CheckIn>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // PRD §7.5: a single global monotonically increasing sequence stamped onto every synced
        // entity's ServerSeq, so pull cursors have one consistent ordering across all entity types.
        builder.HasSequence<long>("global_server_seq").StartsAt(1);

        builder.Entity<RefreshToken>(e =>
        {
            e.Property(r => r.TokenHash).IsRequired();
            e.HasIndex(r => r.TokenHash).IsUnique();
            e.HasIndex(r => r.FamilyId);
            e.HasOne<ApplicationUser>().WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<InviteCode>(e =>
        {
            e.HasIndex(i => i.Code).IsUnique();
        });

        builder.Entity<WeightEntry>(e =>
        {
            e.HasIndex(w => new { w.UserId, w.LocalDate })
                .IsUnique()
                .HasFilter("\"DeletedAt\" IS NULL");
        });

        builder.Entity<ScheduleEntry>(e =>
        {
            e.HasIndex(s => new { s.UserId, s.Weekday })
                .IsUnique()
                .HasFilter("\"DeletedAt\" IS NULL");
        });

        builder.Entity<UserProfile>(e =>
        {
            // One live profile row per user (singleton) — sync lookup is by UserId alone.
            e.HasIndex(p => p.UserId)
                .IsUnique()
                .HasFilter("\"DeletedAt\" IS NULL");
        });

        builder.Entity<FoodOverride>(e =>
        {
            e.HasIndex(f => new { f.UserId, f.FoodId })
                .IsUnique()
                .HasFilter("\"DeletedAt\" IS NULL");
        });

        builder.Entity<CheckIn>(e =>
        {
            e.HasIndex(c => new { c.UserId, c.WeekStart })
                .IsUnique()
                .HasFilter("\"DeletedAt\" IS NULL");
        });

        builder.Entity<ProcessedOp>(e =>
        {
            // op_id only needs to be unique per user; this composite key doubles as the
            // idempotency lookup index used on every push (PRD §7.5 step 3).
            e.HasKey(p => new { p.OpId, p.UserId });
        });

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (!typeof(IUserOwned).IsAssignableFrom(entityType.ClrType))
            {
                continue;
            }

            var parameter = Expression.Parameter(entityType.ClrType, "e");
            var userIdAccess = Expression.Property(parameter, nameof(IUserOwned.UserId));
            var currentUserIdAccess = Expression.Property(Expression.Constant(currentUser), nameof(ICurrentUser.UserId));
            var filter = Expression.Lambda(Expression.Equal(userIdAccess, currentUserIdAccess), parameter);
            builder.Entity(entityType.ClrType).HasQueryFilter(filter);
        }
    }
}
