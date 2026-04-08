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
    string? CheckedBy);

public record AggregatedIngredient(string Name, decimal? TotalQuantity, string? Unit);

public interface IShoppingRepository
{
    Task<List<ShoppingListItem>> GetByPlanIdAsync(Guid planId);
    Task<List<ShoppingListItem>> GenerateAsync(Guid planId);
    Task<bool> ToggleItemAsync(Guid itemId, bool isChecked, string userId);
}

public class ShoppingRepository : IShoppingRepository
{
    private readonly DbConnectionFactory _db;

    public ShoppingRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<List<ShoppingListItem>> GetByPlanIdAsync(Guid planId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            SELECT id, weekly_plan_id, ingredient_name, total_quantity, unit, is_checked, checked_by
            FROM shopping_list_items
            WHERE weekly_plan_id = @planId
            ORDER BY is_checked, ingredient_name
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
            """
            SELECT id, weekly_plan_id, ingredient_name, total_quantity, unit, is_checked, checked_by
            FROM shopping_list_items
            WHERE weekly_plan_id = @planId
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
                """
                INSERT INTO shopping_list_items (weekly_plan_id, ingredient_name, total_quantity, unit, is_checked, checked_by)
                VALUES (@planId, @name, @quantity, @unit, @isChecked, @checkedBy)
                RETURNING id, weekly_plan_id, ingredient_name, total_quantity, unit, is_checked, checked_by
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

    public async Task<bool> ToggleItemAsync(Guid itemId, bool isChecked, string userId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            UPDATE shopping_list_items
            SET is_checked = @isChecked, checked_by = CASE WHEN @isChecked THEN @userId ELSE NULL END
            WHERE id = @itemId
            """, conn);
        cmd.Parameters.AddWithValue("itemId", itemId);
        cmd.Parameters.AddWithValue("isChecked", isChecked);
        cmd.Parameters.AddWithValue("userId", userId);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    private static async Task<List<AggregatedIngredient>> AggregateIngredientsAsync(
        NpgsqlConnection conn, NpgsqlTransaction tx, Guid planId)
    {
        await using var cmd = new NpgsqlCommand(
            """
            SELECT ri.name, SUM(ri.quantity), ri.unit
            FROM planned_meals pm
            JOIN recipe_ingredients ri ON ri.recipe_id = pm.recipe_id
            WHERE pm.weekly_plan_id = @planId
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
        reader.IsDBNull(6) ? null : reader.GetString(6));
}
