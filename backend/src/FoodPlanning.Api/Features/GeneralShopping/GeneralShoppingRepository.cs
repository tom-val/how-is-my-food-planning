using FoodPlanning.Api.Shared.Database;
using Npgsql;

namespace FoodPlanning.Api.Features.GeneralShopping;

public record GeneralShoppingItem(
    Guid Id,
    Guid FamilyId,
    string ItemName,
    decimal? Quantity,
    string? Unit,
    bool IsChecked,
    string? CheckedBy);

public interface IGeneralShoppingRepository
{
    Task<List<GeneralShoppingItem>> GetByFamilyIdAsync(Guid familyId);
    Task<GeneralShoppingItem> AddItemAsync(Guid familyId, string itemName, decimal? quantity, string? unit, string createdBy);
    Task<bool> ToggleItemAsync(Guid itemId, Guid familyId, bool isChecked, string userId);
    Task<bool> DeleteItemAsync(Guid itemId, Guid familyId);
}

public class GeneralShoppingRepository : IGeneralShoppingRepository
{
    private readonly DbConnectionFactory _db;

    public GeneralShoppingRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<List<GeneralShoppingItem>> GetByFamilyIdAsync(Guid familyId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            SELECT id, family_id, item_name, quantity, unit, is_checked, checked_by
            FROM general_shopping_items
            WHERE family_id = @familyId
            ORDER BY is_checked, item_name
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);

        var items = new List<GeneralShoppingItem>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            items.Add(ReadItem(reader));

        return items;
    }

    public async Task<GeneralShoppingItem> AddItemAsync(Guid familyId, string itemName, decimal? quantity, string? unit, string createdBy)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            INSERT INTO general_shopping_items (family_id, item_name, quantity, unit, created_by)
            VALUES (@familyId, @name, @quantity, @unit, @createdBy)
            RETURNING id, family_id, item_name, quantity, unit, is_checked, checked_by
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);
        cmd.Parameters.AddWithValue("name", itemName);
        cmd.Parameters.AddWithValue("quantity", (object?)quantity ?? DBNull.Value);
        cmd.Parameters.AddWithValue("unit", (object?)unit ?? DBNull.Value);
        cmd.Parameters.AddWithValue("createdBy", createdBy);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            throw new InvalidOperationException("Failed to add general shopping item.");

        return ReadItem(reader);
    }

    public async Task<bool> ToggleItemAsync(Guid itemId, Guid familyId, bool isChecked, string userId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            UPDATE general_shopping_items
            SET is_checked = @isChecked, checked_by = CASE WHEN @isChecked THEN @userId ELSE NULL END
            WHERE id = @itemId AND family_id = @familyId
            """, conn);
        cmd.Parameters.AddWithValue("itemId", itemId);
        cmd.Parameters.AddWithValue("familyId", familyId);
        cmd.Parameters.AddWithValue("isChecked", isChecked);
        cmd.Parameters.AddWithValue("userId", userId);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> DeleteItemAsync(Guid itemId, Guid familyId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "DELETE FROM general_shopping_items WHERE id = @itemId AND family_id = @familyId", conn);
        cmd.Parameters.AddWithValue("itemId", itemId);
        cmd.Parameters.AddWithValue("familyId", familyId);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    private static GeneralShoppingItem ReadItem(NpgsqlDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        reader.GetString(2),
        reader.IsDBNull(3) ? null : reader.GetDecimal(3),
        reader.IsDBNull(4) ? null : reader.GetString(4),
        reader.GetBoolean(5),
        reader.IsDBNull(6) ? null : reader.GetString(6));
}
