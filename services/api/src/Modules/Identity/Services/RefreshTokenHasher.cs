using System.Security.Cryptography;
using System.Text;

namespace FitnessCompanion.Api.Modules.Identity.Services;

/// <summary>Refresh tokens are stored hashed (PRD §7.8: "tokens never stored in plain text" —
/// applied server-side too, so a DB leak doesn't hand out usable tokens).</summary>
public static class RefreshTokenHasher
{
    public static string Hash(string plainTextToken)
    {
        var bytes = Encoding.UTF8.GetBytes(plainTextToken);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash);
    }
}
