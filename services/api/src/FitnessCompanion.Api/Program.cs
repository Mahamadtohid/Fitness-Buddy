using System.Reflection;
using System.Text;
using FitnessCompanion.Api.Modules.AiGateway;
using FitnessCompanion.Api.Modules.Export;
using FitnessCompanion.Api.Modules.Identity.Endpoints;
using FitnessCompanion.Api.Modules.Identity.Entities;
using FitnessCompanion.Api.Modules.Identity.Options;
using FitnessCompanion.Api.Modules.Identity.Services;
using FitnessCompanion.Api.Modules.Nutrition;
using FitnessCompanion.Api.Modules.Profile;
using FitnessCompanion.Api.Modules.Progress;
using FitnessCompanion.Api.Modules.Sync;
using FitnessCompanion.Api.Modules.Sync.PullSources;
using FitnessCompanion.Api.Modules.Water;
using FitnessCompanion.Api.Modules.Workouts;
using FitnessCompanion.Api.Shared;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Jwt configuration section is missing.");

var connectionString = builder.Configuration.GetConnectionString("Postgres")
    ?? throw new InvalidOperationException("ConnectionStrings:Postgres is missing.");

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, HttpContextCurrentUser>();

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.Password.RequiredLength = 8;
        options.User.RequireUniqueEmail = true;
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("auth", o => { o.Window = TimeSpan.FromMinutes(1); o.PermitLimit = 10; });
    options.AddFixedWindowLimiter("sync", o => { o.Window = TimeSpan.FromMinutes(1); o.PermitLimit = 120; });
    options.AddFixedWindowLimiter("ai", o => { o.Window = TimeSpan.FromDays(1); o.PermitLimit = 20; });
});

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailSender, LoggingEmailSender>();
builder.Services.AddScoped<IServerSequence, PostgresServerSequence>();
builder.Services.AddScoped<ISyncPullSource, WeightEntryPullSource>();
builder.Services.AddScoped<ISyncPullSource, CustomExercisePullSource>();
builder.Services.AddScoped<ISyncPullSource, WorkoutTemplatePullSource>();
builder.Services.AddScoped<ISyncPullSource, ScheduleEntryPullSource>();
builder.Services.AddScoped<ISyncPullSource, WorkoutSessionPullSource>();
builder.Services.AddScoped<ISyncPullSource, SetEntryPullSource>();
builder.Services.AddScoped<ISyncPullSource, UserProfilePullSource>();
builder.Services.AddScoped<ISyncPullSource, TargetPullSource>();
builder.Services.AddScoped<ISyncPullSource, CustomFoodPullSource>();
builder.Services.AddScoped<ISyncPullSource, FoodOverridePullSource>();
builder.Services.AddScoped<ISyncPullSource, SavedMealPullSource>();
builder.Services.AddScoped<ISyncPullSource, FoodEntryPullSource>();
builder.Services.AddScoped<ISyncPullSource, WaterEntryPullSource>();
builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString, name: "postgres", tags: ["ready"]);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseExceptionHandler();
app.UseSerilogRequestLogging();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") });

app.MapGet("/api/v1/meta", () => Results.Ok(new
{
    minAppVersion = "1.0.0",
    featureFlags = new { aiMealEstimate = false },
}));

app.MapAuthEndpoints();
app.MapAccountEndpoints();
app.MapProfileEndpoints();
app.MapWorkoutsEndpoints();
app.MapNutritionEndpoints();
app.MapProgressEndpoints();
app.MapWaterEndpoints();
app.MapSyncEndpoints();
app.MapExportEndpoints();
app.MapAiGatewayEndpoints();

app.Run();

// Exposed for WebApplicationFactory-based integration tests (PRD §10).
public partial class Program;
