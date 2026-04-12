using System.Text.Json;
using FoodPlanning.Api.Shared.Database;
using Npgsql;
using NpgsqlTypes;

namespace FoodPlanning.Api.Features.Recipes;

public record AiRecipeJob(
    Guid Id,
    string Status,
    AiSuggestResponse? Response,
    string? Error);

public interface IAiRecipeJobRepository
{
    Task<Guid> CreateJobAsync(Guid familyId, string userId, List<AiMessage> messages);
    Task<AiRecipeJob?> GetJobAsync(Guid jobId);
    Task<(Guid Id, Guid FamilyId, string UserId, List<AiMessage> Messages)?> GetPendingJobAsync(Guid jobId);
    Task CompleteJobAsync(Guid jobId, AiSuggestResponse response);
    Task FailJobAsync(Guid jobId, string error);
}

public class AiRecipeJobRepository : IAiRecipeJobRepository
{
    private readonly DbConnectionFactory _db;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public AiRecipeJobRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<Guid> CreateJobAsync(Guid familyId, string userId, List<AiMessage> messages)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var requestJson = JsonSerializer.Serialize(messages, JsonOptions);

        await using var cmd = new NpgsqlCommand(
            """
            INSERT INTO ai_recipe_jobs (family_id, user_id, request_body)
            VALUES (@familyId, @userId, @requestBody::jsonb)
            RETURNING id
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("requestBody", requestJson);

        return (Guid)(await cmd.ExecuteScalarAsync())!;
    }

    public async Task<AiRecipeJob?> GetJobAsync(Guid jobId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT id, status, response_body, error FROM ai_recipe_jobs WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", jobId);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        AiSuggestResponse? response = null;
        if (!reader.IsDBNull(2))
        {
            var json = reader.GetString(2);
            response = JsonSerializer.Deserialize<AiSuggestResponse>(json, JsonOptions);
        }

        return new AiRecipeJob(
            reader.GetGuid(0),
            reader.GetString(1),
            response,
            reader.IsDBNull(3) ? null : reader.GetString(3));
    }

    public async Task<(Guid Id, Guid FamilyId, string UserId, List<AiMessage> Messages)?> GetPendingJobAsync(Guid jobId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT id, family_id, user_id, request_body FROM ai_recipe_jobs WHERE id = @id AND status = 'pending'", conn);
        cmd.Parameters.AddWithValue("id", jobId);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        var messages = JsonSerializer.Deserialize<List<AiMessage>>(reader.GetString(3), JsonOptions) ?? [];

        return (reader.GetGuid(0), reader.GetGuid(1), reader.GetString(2), messages);
    }

    public async Task CompleteJobAsync(Guid jobId, AiSuggestResponse response)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var responseJson = JsonSerializer.Serialize(response, JsonOptions);

        await using var cmd = new NpgsqlCommand(
            """
            UPDATE ai_recipe_jobs
            SET status = 'completed', response_body = @response::jsonb, completed_at = now()
            WHERE id = @id
            """, conn);
        cmd.Parameters.AddWithValue("id", jobId);
        cmd.Parameters.AddWithValue("response", responseJson);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task FailJobAsync(Guid jobId, string error)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            UPDATE ai_recipe_jobs
            SET status = 'failed', error = @error, completed_at = now()
            WHERE id = @id
            """, conn);
        cmd.Parameters.AddWithValue("id", jobId);
        cmd.Parameters.AddWithValue("error", error);
        await cmd.ExecuteNonQueryAsync();
    }
}
