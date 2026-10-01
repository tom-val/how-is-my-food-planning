using System.Buffers.Text;
using System.Security.Cryptography;

namespace FoodPlanning.Api.Features.Recipes;

/// <summary>
/// Generates and validates public recipe share tokens.
/// The token is the only thing protecting a shared recipe, so it must be
/// unguessable: 18 bytes (144 bits) from a CSPRNG, encoded as base64url
/// without padding (exactly 24 URL-safe characters).
/// </summary>
public static class RecipeShareTokens
{
    public const int ByteLength = 18;

    /// <summary>Length of an encoded token. 18 bytes encode to 24 base64url characters with no padding.</summary>
    public const int TokenLength = 24;

    public static string Generate()
    {
        Span<byte> bytes = stackalloc byte[ByteLength];
        RandomNumberGenerator.Fill(bytes);
        return Base64Url.EncodeToString(bytes);
    }

    /// <summary>
    /// Cheap shape check performed before touching the database, so malformed
    /// or oversized input is rejected without a query.
    /// </summary>
    public static bool IsValidFormat(string? token)
    {
        if (token is null || token.Length != TokenLength)
            return false;

        foreach (var c in token)
        {
            var isBase64UrlChar =
                c is >= 'A' and <= 'Z' or >= 'a' and <= 'z' or >= '0' and <= '9' or '-' or '_';
            if (!isBase64UrlChar)
                return false;
        }

        return true;
    }
}
