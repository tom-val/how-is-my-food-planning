using FoodPlanning.Api.Shared.Database;
using Npgsql;

namespace FoodPlanning.Api.Features.Shopping;

public record ShoppingListItem(
    Guid Id,
    Guid WeeklyPlanId,
    string IngredientName,
    decimal? TotalQuantity,
    string? Unit,
    bool IsChecked,
    string? CheckedBy,
    Guid? CategoryId);

public record AggregatedIngredient(string Name, decimal? TotalQuantity, string? Unit);

public record IngredientRecipeMapping(string IngredientName, string? Unit, string RecipeName);

public record ShoppingListResponse(List<ShoppingListItem> Items, List<IngredientRecipeMapping> RecipeMappings);

public interface IShoppingRepository
{
    Task<List<ShoppingListItem>> GetByPlanIdAsync(Guid planId);
    Task<List<ShoppingListItem>> GenerateAsync(Guid planId);
    Task<ShoppingListItem> AddCustomItemAsync(Guid planId, string ingredientName, decimal? quantity, string? unit);
    Task<bool> DeleteItemAsync(Guid itemId, Guid familyId);
    Task<bool> ToggleItemAsync(Guid itemId, Guid familyId, bool isChecked, string userId);
    Task<List<IngredientRecipeMapping>> GetRecipeMappingsAsync(Guid planId);
}

public class ShoppingRepository : IShoppingRepository
{
    private readonly DbConnectionFactory _db;

    // Item columns plus the family's remembered category for the item name (the family
    // comes from the item's weekly plan). Both expect the item row to be aliased "sli".
    private const string ItemColumns =
        "sli.id, sli.weekly_plan_id, sli.ingredient_name, sli.total_quantity, sli.unit, sli.is_checked, sli.checked_by, sic.category_id";

    private const string CategoryJoin =
        """
        JOIN weekly_plans wp ON wp.id = sli.weekly_plan_id
        LEFT JOIN shopping_item_categories sic
            ON sic.family_id = wp.family_id AND sic.item_key = lower(btrim(sli.ingredient_name))
        """;

    public ShoppingRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<List<ShoppingListItem>> GetByPlanIdAsync(Guid planId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            $"""
            SELECT {ItemColumns}
            FROM shopping_list_items sli
            {CategoryJoin}
            WHERE sli.weekly_plan_id = @planId
            ORDER BY sli.is_checked, sli.ingredient_name
            """, conn);
        cmd.Parameters.AddWithValue("planId", planId);

        var items = new List<ShoppingListItem>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            items.Add(ReadItem(reader));

        return items;
    }

    public async Task<List<ShoppingListItem>> GenerateAsync(Guid planId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();

        // Aggregate ingredients from all planned meals.
        var aggregated = await AggregateIngredientsAsync(conn, tx, planId);

        // Load existing items to preserve checkbox state.
        var existing = new Dictionary<string, ShoppingListItem>();
        await using (var existingCmd = new NpgsqlCommand(
            $"""
            SELECT {ItemColumns}
            FROM shopping_list_items sli
            {CategoryJoin}
            WHERE sli.weekly_plan_id = @planId
            """, conn, tx))
        {
            existingCmd.Parameters.AddWithValue("planId", planId);
            await using var reader = await existingCmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var item = ReadItem(reader);
                existing[BuildKey(item.IngredientName, item.Unit)] = item;
            }
        }

        // Delete old items.
        await using (var deleteCmd = new NpgsqlCommand(
            "DELETE FROM shopping_list_items WHERE weekly_plan_id = @planId", conn, tx))
        {
            deleteCmd.Parameters.AddWithValue("planId", planId);
            await deleteCmd.ExecuteNonQueryAsync();
        }

        // Insert new aggregated items, preserving checkbox state where ingredient+unit matches.
        var result = new List<ShoppingListItem>();
        foreach (var agg in aggregated)
        {
            var key = BuildKey(agg.Name, agg.Unit);
            var wasChecked = existing.TryGetValue(key, out var prev) && prev.IsChecked;
            var checkedBy = wasChecked ? prev!.CheckedBy : null;

            await using var insertCmd = new NpgsqlCommand(
                $"""
                WITH inserted AS (
                    INSERT INTO shopping_list_items (weekly_plan_id, ingredient_name, total_quantity, unit, is_checked, checked_by)
                    VALUES (@planId, @name, @quantity, @unit, @isChecked, @checkedBy)
                    RETURNING id, weekly_plan_id, ingredient_name, total_quantity, unit, is_checked, checked_by
                )
                SELECT {ItemColumns}
                FROM inserted sli
                {CategoryJoin}
                """, conn, tx);
            insertCmd.Parameters.AddWithValue("planId", planId);
            insertCmd.Parameters.AddWithValue("name", agg.Name);
            insertCmd.Parameters.AddWithValue("quantity", (object?)agg.TotalQuantity ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("unit", (object?)agg.Unit ?? DBNull.Value);
            insertCmd.Parameters.AddWithValue("isChecked", wasChecked);
            insertCmd.Parameters.AddWithValue("checkedBy", (object?)checkedBy ?? DBNull.Value);

            await using var reader = await insertCmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
                result.Add(ReadItem(reader));
        }

        await tx.CommitAsync();

        // Return sorted: unchecked first.
        return result.OrderBy(i => i.IsChecked).ThenBy(i => i.IngredientName).ToList();
    }

    public async Task<ShoppingListItem> AddCustomItemAsync(Guid planId, string ingredientName, decimal? quantity, string? unit)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            $"""
            WITH inserted AS (
                INSERT INTO shopping_list_items (weekly_plan_id, ingredient_name, total_quantity, unit)
                VALUES (@planId, @name, @quantity, @unit)
                RETURNING id, weekly_plan_id, ingredient_name, total_quantity, unit, is_checked, checked_by
            )
            SELECT {ItemColumns}
            FROM inserted sli
            {CategoryJoin}
            """, conn);
        cmd.Parameters.AddWithValue("planId", planId);
        cmd.Parameters.AddWithValue("name", ingredientName);
        cmd.Parameters.AddWithValue("quantity", (object?)quantity ?? DBNull.Value);
        cmd.Parameters.AddWithValue("unit", (object?)unit ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            throw new InvalidOperationException("Failed to add custom item.");

        return ReadItem(reader);
    }

    // Items have no family_id of their own, so they are scoped to the family via their weekly plan.
    public async Task<bool> DeleteItemAsync(Guid itemId, Guid familyId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            DELETE FROM shopping_list_items
            WHERE id = @itemId
              AND weekly_plan_id IN (SELECT id FROM weekly_plans WHERE family_id = @familyId)
            """, conn);
        cmd.Parameters.AddWithValue("itemId", itemId);
        cmd.Parameters.AddWithValue("familyId", familyId);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> ToggleItemAsync(Guid itemId, Guid familyId, bool isChecked, string userId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            UPDATE shopping_list_items
            SET is_checked = @isChecked, checked_by = CASE WHEN @isChecked THEN @userId ELSE NULL END
            WHERE id = @itemId
              AND weekly_plan_id IN (SELECT id FROM weekly_plans WHERE family_id = @familyId)
            """, conn);
        cmd.Parameters.AddWithValue("itemId", itemId);
        cmd.Parameters.AddWithValue("familyId", familyId);
        cmd.Parameters.AddWithValue("isChecked", isChecked);
        cmd.Parameters.AddWithValue("userId", userId);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task<List<IngredientRecipeMapping>> GetRecipeMappingsAsync(Guid planId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            SELECT DISTINCT ri.name, ri.unit, r.name AS recipe_name
            FROM planned_meals pm
            JOIN recipe_ingredients ri ON ri.recipe_id = pm.recipe_id
            JOIN recipes r ON r.id = pm.recipe_id
            WHERE pm.weekly_plan_id = @planId AND pm.is_shadow = false
            ORDER BY ri.name, r.name
            """, conn);
        cmd.Parameters.AddWithValue("planId", planId);

        var mappings = new List<IngredientRecipeMapping>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            mappings.Add(new IngredientRecipeMapping(
                reader.GetString(0),
                reader.IsDBNull(1) ? null : reader.GetString(1),
                reader.GetString(2)));
        }

        return mappings;
    }

    private static async Task<List<AggregatedIngredient>> AggregateIngredientsAsync(
        NpgsqlConnection conn, NpgsqlTransaction tx, Guid planId)
    {
        await using var cmd = new NpgsqlCommand(
            """
            SELECT ri.name, SUM(ri.quantity), ri.unit
            FROM planned_meals pm
            JOIN recipe_ingredients ri ON ri.recipe_id = pm.recipe_id
            WHERE pm.weekly_plan_id = @planId AND pm.is_shadow = false
            GROUP BY ri.name, ri.unit
            ORDER BY ri.name
            """, conn, tx);
        cmd.Parameters.AddWithValue("planId", planId);

        var list = new List<AggregatedIngredient>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(new AggregatedIngredient(
                reader.GetString(0),
                reader.IsDBNull(1) ? null : reader.GetDecimal(1),
                reader.IsDBNull(2) ? null : reader.GetString(2)));
        }

        return list;
    }

    private static string BuildKey(string name, string? unit) =>
        $"{name.ToLowerInvariant()}|{unit?.ToLowerInvariant() ?? ""}";

    private static ShoppingListItem ReadItem(NpgsqlDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        reader.GetString(2),
        reader.IsDBNull(3) ? null : reader.GetDecimal(3),
        reader.IsDBNull(4) ? null : reader.GetString(4),
        reader.GetBoolean(5),
        reader.IsDBNull(6) ? null : reader.GetString(6),
        reader.IsDBNull(7) ? null : reader.GetGuid(7));
}
