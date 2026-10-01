using System.Text.Json;
using FoodPlanning.Api.Shared.Database;
using Npgsql;

namespace FoodPlanning.Api.Features.ShoppingCategories;

public record ShoppingCategory(Guid Id, string Name, int SortOrder);

public enum ShoppingCategorySaveOutcome
{
    Saved,
    NotFound,
    DuplicateName,
    LimitReached,
}

public record ShoppingCategorySaveResult(ShoppingCategorySaveOutcome Outcome, ShoppingCategory? Category = null);

/// <summary>Request body stored on a categorise job for the AI processor.</summary>
public record CategoriseJobRequest(List<CategoriseJobCategory> Categories, List<CategoriseJobItem> Items);
public record CategoriseJobCategory(Guid Id, string Name);
public record CategoriseJobItem(string Key, string Name);

public record ShoppingCategorySortJobStatus(string Status, string? Error);

public interface IShoppingCategoryRepository
{
    Task<List<ShoppingCategory>> GetByFamilyIdAsync(Guid familyId);
    Task<ShoppingCategorySaveResult> CreateAsync(Guid familyId, string name, string createdBy);
    Task<ShoppingCategorySaveResult> RenameAsync(Guid id, Guid familyId, string name);
    Task<bool> ReorderAsync(Guid familyId, IReadOnlyList<Guid> ids);
    Task<bool> DeleteAsync(Guid id, Guid familyId);
    Task<bool> AssignAsync(Guid familyId, string itemName, Guid categoryId);
    Task UnassignAsync(Guid familyId, string itemName);
    Task<List<CategoriseJobItem>> GetWeeklyItemsToSortAsync(Guid planId, Guid familyId, int limit);
    Task<List<CategoriseJobItem>> GetGeneralItemsToSortAsync(Guid familyId, int limit);
    Task<Guid> CreateSortJobAsync(Guid familyId, string userId, CategoriseJobRequest request);
    Task<ShoppingCategorySortJobStatus?> GetSortJobAsync(Guid jobId, Guid familyId);
}

public class ShoppingCategoryRepository : IShoppingCategoryRepository
{
    private readonly DbConnectionFactory _db;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public ShoppingCategoryRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<List<ShoppingCategory>> GetByFamilyIdAsync(Guid familyId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            SELECT id, name, sort_order
            FROM shopping_categories
            WHERE family_id = @familyId
            ORDER BY sort_order, name
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);

        var categories = new List<ShoppingCategory>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            categories.Add(ReadCategory(reader));

        return categories;
    }

    public async Task<ShoppingCategorySaveResult> CreateAsync(Guid familyId, string name, string createdBy)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        // Appends at the end. The HAVING clause enforces the per-family cap in the same
        // statement, so no row is inserted (and none returned) once the cap is reached.
        await using var cmd = new NpgsqlCommand(
            """
            INSERT INTO shopping_categories (family_id, name, sort_order, created_by)
            SELECT @familyId, @name, COALESCE(MAX(sort_order), -1) + 1, @createdBy
            FROM shopping_categories
            WHERE family_id = @familyId
            HAVING COUNT(*) < @maxCategories
            RETURNING id, name, sort_order
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);
        cmd.Parameters.AddWithValue("name", name);
        cmd.Parameters.AddWithValue("createdBy", createdBy);
        cmd.Parameters.AddWithValue("maxCategories", ShoppingCategoryLimits.MaxCategoriesPerFamily);

        try
        {
            await using var reader = await cmd.ExecuteReaderAsync();
            return await reader.ReadAsync()
                ? new ShoppingCategorySaveResult(ShoppingCategorySaveOutcome.Saved, ReadCategory(reader))
                : new ShoppingCategorySaveResult(ShoppingCategorySaveOutcome.LimitReached);
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            return new ShoppingCategorySaveResult(ShoppingCategorySaveOutcome.DuplicateName);
        }
    }

    public async Task<ShoppingCategorySaveResult> RenameAsync(Guid id, Guid familyId, string name)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            UPDATE shopping_categories
            SET name = @name
            WHERE id = @id AND family_id = @familyId
            RETURNING id, name, sort_order
            """, conn);
        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("familyId", familyId);
        cmd.Parameters.AddWithValue("name", name);

        try
        {
            await using var reader = await cmd.ExecuteReaderAsync();
            return await reader.ReadAsync()
                ? new ShoppingCategorySaveResult(ShoppingCategorySaveOutcome.Saved, ReadCategory(reader))
                : new ShoppingCategorySaveResult(ShoppingCategorySaveOutcome.NotFound);
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            return new ShoppingCategorySaveResult(ShoppingCategorySaveOutcome.DuplicateName);
        }
    }

    public async Task<bool> ReorderAsync(Guid familyId, IReadOnlyList<Guid> ids)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();

        // Lock the family's categories so the set cannot change under us.
        var existing = new HashSet<Guid>();
        await using (var lockCmd = new NpgsqlCommand(
            "SELECT id FROM shopping_categories WHERE family_id = @familyId FOR UPDATE", conn, tx))
        {
            lockCmd.Parameters.AddWithValue("familyId", familyId);
            await using var reader = await lockCmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                existing.Add(reader.GetGuid(0));
        }

        // The given ids must be exactly the family's category set.
        if (existing.Count != ids.Count || !existing.SetEquals(ids))
        {
            await tx.RollbackAsync();
            return false;
        }

        await using (var updateCmd = new NpgsqlCommand(
            """
            UPDATE shopping_categories sc
            SET sort_order = (o.ord - 1)::int
            FROM unnest(@ids) WITH ORDINALITY AS o(id, ord)
            WHERE sc.id = o.id AND sc.family_id = @familyId
            """, conn, tx))
        {
            updateCmd.Parameters.AddWithValue("ids", ids.ToArray());
            updateCmd.Parameters.AddWithValue("familyId", familyId);
            await updateCmd.ExecuteNonQueryAsync();
        }

        await tx.CommitAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id, Guid familyId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        // Item mappings for this category cascade, so those items become uncategorised.
        await using var cmd = new NpgsqlCommand(
            "DELETE FROM shopping_categories WHERE id = @id AND family_id = @familyId", conn);
        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("familyId", familyId);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> AssignAsync(Guid familyId, string itemName, Guid categoryId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        // Selecting from shopping_categories scopes the category to the family: no row is
        // written (and false returned) when the category belongs to another family.
        await using var cmd = new NpgsqlCommand(
            """
            INSERT INTO shopping_item_categories (family_id, item_key, category_id, source, updated_at)
            SELECT sc.family_id, lower(btrim(@itemName)), sc.id, 'manual', now()
            FROM shopping_categories sc
            WHERE sc.id = @categoryId AND sc.family_id = @familyId
            ON CONFLICT (family_id, item_key) DO UPDATE
            SET category_id = EXCLUDED.category_id, source = 'manual', updated_at = now()
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);
        cmd.Parameters.AddWithValue("itemName", itemName);
        cmd.Parameters.AddWithValue("categoryId", categoryId);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task UnassignAsync(Guid familyId, string itemName)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            DELETE FROM shopping_item_categories
            WHERE family_id = @familyId AND item_key = lower(btrim(@itemName))
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);
        cmd.Parameters.AddWithValue("itemName", itemName);

        await cmd.ExecuteNonQueryAsync();
    }

    public Task<List<CategoriseJobItem>> GetWeeklyItemsToSortAsync(Guid planId, Guid familyId, int limit) =>
        GetItemsToSortAsync(
            """
            SELECT sli.ingredient_name AS item_name
            FROM shopping_list_items sli
            JOIN weekly_plans wp ON wp.id = sli.weekly_plan_id
            WHERE sli.weekly_plan_id = @planId AND wp.family_id = @familyId
            """,
            familyId, limit, planId);

    public Task<List<CategoriseJobItem>> GetGeneralItemsToSortAsync(Guid familyId, int limit) =>
        GetItemsToSortAsync(
            """
            SELECT gsi.item_name
            FROM general_shopping_items gsi
            WHERE gsi.family_id = @familyId
            """,
            familyId, limit, planId: null);

    public async Task<Guid> CreateSortJobAsync(Guid familyId, string userId, CategoriseJobRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            INSERT INTO ai_recipe_jobs (family_id, user_id, request_body, job_type)
            VALUES (@familyId, @userId, @requestBody::jsonb, 'categorise')
            RETURNING id
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("requestBody", JsonSerializer.Serialize(request, JsonOptions));

        return (Guid)(await cmd.ExecuteScalarAsync())!;
    }

    public async Task<ShoppingCategorySortJobStatus?> GetSortJobAsync(Guid jobId, Guid familyId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            SELECT status, error
            FROM ai_recipe_jobs
            WHERE id = @id AND family_id = @familyId AND job_type = 'categorise'
            """, conn);
        cmd.Parameters.AddWithValue("id", jobId);
        cmd.Parameters.AddWithValue("familyId", familyId);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        return new ShoppingCategorySortJobStatus(
            reader.GetString(0),
            reader.IsDBNull(1) ? null : reader.GetString(1));
    }

    /// <summary>
    /// Collects the distinct item names (by normalised key) from the given source query,
    /// excluding items the family has categorised manually, as AI never overrides those.
    /// The source query must select a single <c>item_name</c> column and may use the
    /// <c>@familyId</c> and <c>@planId</c> parameters.
    /// </summary>
    private async Task<List<CategoriseJobItem>> GetItemsToSortAsync(
        string sourceSql, Guid familyId, int limit, Guid? planId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            $"""
            SELECT DISTINCT ON (items.item_key) items.item_key, items.item_name
            FROM (
                SELECT lower(btrim(src.item_name)) AS item_key, btrim(src.item_name) AS item_name
                FROM ({sourceSql}) src
            ) items
            WHERE items.item_key <> ''
              AND char_length(items.item_key) <= @maxNameLength
              AND NOT EXISTS (
                  SELECT 1
                  FROM shopping_item_categories sic
                  WHERE sic.family_id = @familyId
                    AND sic.item_key = items.item_key
                    AND sic.source = 'manual')
            ORDER BY items.item_key, items.item_name
            LIMIT @limit
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);
        cmd.Parameters.AddWithValue("maxNameLength", ShoppingCategoryLimits.MaxItemNameLength);
        cmd.Parameters.AddWithValue("limit", limit);
        if (planId.HasValue)
            cmd.Parameters.AddWithValue("planId", planId.Value);

        var items = new List<CategoriseJobItem>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            items.Add(new CategoriseJobItem(reader.GetString(0), reader.GetString(1)));

        return items;
    }

    private static ShoppingCategory ReadCategory(NpgsqlDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetString(1),
        reader.GetInt32(2));
}
