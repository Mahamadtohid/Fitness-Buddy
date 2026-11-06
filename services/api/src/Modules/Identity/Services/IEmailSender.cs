namespace FitnessCompanion.Api.Modules.Identity.Services;

public interface IEmailSender
{
    Task SendPasswordResetAsync(string email, string resetToken, CancellationToken cancellationToken);
}

/// <summary>Stub: logs instead of sending. PRD §7.1 names Resend/SendGrid for the real
/// transactional provider — wire one of those in before phase 6 (account/password-reset flows
/// must actually reach the user before release).</summary>
public sealed class LoggingEmailSender(ILogger<LoggingEmailSender> logger) : IEmailSender
{
    public Task SendPasswordResetAsync(string email, string resetToken, CancellationToken cancellationToken)
    {
        logger.LogInformation("Password reset requested for {Email} (token omitted from logs)", email);
        return Task.CompletedTask;
    }
}
