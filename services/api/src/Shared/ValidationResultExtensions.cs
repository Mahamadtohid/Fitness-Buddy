using FluentValidation.Results;

namespace FitnessCompanion.Api.Shared;

public static class ValidationResultExtensions
{
    /// <summary>Shapes FluentValidation failures for <c>Results.ValidationProblem</c>. The plain
    /// FluentValidation package (no MVC/AspNetCore integration package) has no built-in
    /// equivalent, so this is hand-rolled rather than assumed.</summary>
    public static IDictionary<string, string[]> ToDictionary(this ValidationResult result) =>
        result.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
}
