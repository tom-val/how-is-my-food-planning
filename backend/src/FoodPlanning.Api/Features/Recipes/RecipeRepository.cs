using FoodPlanning.Api.Shared.Database;
using Npgsql;

namespace FoodPlanning.Api.Features.Recipes;

public record Recipe(
    Guid Id,
    Guid FamilyId,
    string Name,
    string? Instructions,
    string[] Categories,
    string CreatedBy,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record RecipeIngredient(
    Guid Id,
    Guid RecipeId,
    string Name,
    decimal? Quantity,
    string? Unit);

public record RecipeWithIngredients(Recipe Recipe, List<RecipeIngredient> Ingredients);

public interface IRecipeRepository
{
    Task<List<RecipeWithIngredients>> GetAllByFamilyAsync(Guid familyId);
    Task<RecipeWithIngredients?> GetByIdAsync(Guid id, Guid familyId);
    Task<RecipeWithIngredients> CreateAsync(Guid familyId, string userId, string name, string? instructions, string[] categories, List<IngredientInput> ingredients);
    Task<RecipeWithIngredients?> UpdateAsync(Guid id, Guid familyId, string name, string? instructions, string[] categories, List<IngredientInput> ingredients);
    Task<bool> DeleteAsync(Guid id, Guid familyId);
    Task<List<string>> GetDistinctIngredientNamesAsync(Guid familyId);
}

public record IngredientInput(string Name, decimal? Quantity, string? Unit);

public class RecipeRepository : IRecipeRepository
{
    private readonly DbConnectionFactory _db;

    public RecipeRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<List<RecipeWithIngredients>> GetAllByFamilyAsync(Guid familyId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        // Fetch all recipes for the family.
        await using var recipeCmd = new NpgsqlCommand(
            """
            SELECT id, family_id, name, instructions, categories, created_by, created_at, updated_at
            FROM recipes
            WHERE family_id = @familyId
            ORDER BY name
            """, conn);
        recipeCmd.Parameters.AddWithValue("familyId", familyId);

        var recipes = new List<Recipe>();
        await using (var reader = await recipeCmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
                recipes.Add(ReadRecipe(reader));
        }

        if (recipes.Count == 0)
            return [];

        // Fetch all ingredients for these recipes in one query.
        var recipeIds = recipes.Select(r => r.Id).ToArray();
        await using var ingredientCmd = new NpgsqlCommand(
            """
            SELECT id, recipe_id, name, quantity, unit
            FROM recipe_ingredients
            WHERE recipe_id = ANY(@ids)
            ORDER BY id
            """, conn);
        ingredientCmd.Parameters.AddWithValue("ids", recipeIds);

        var ingredientsByRecipe = new Dictionary<Guid, List<RecipeIngredient>>();
        await using (var reader = await ingredientCmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                var ingredient = ReadIngredient(reader);
                if (!ingredientsByRecipe.TryGetValue(ingredient.RecipeId, out var list))
                {
                    list = [];
                    ingredientsByRecipe[ingredient.RecipeId] = list;
                }
                list.Add(ingredient);
            }
        }

        return recipes.Select(r => new RecipeWithIngredients(
            r,
            ingredientsByRecipe.GetValueOrDefault(r.Id, [])
        )).ToList();
    }

    public async Task<RecipeWithIngredients?> GetByIdAsync(Guid id, Guid familyId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var recipeCmd = new NpgsqlCommand(
            """
            SELECT id, family_id, name, instructions, categories, created_by, created_at, updated_at
            FROM recipes
            WHERE id = @id AND family_id = @familyId
            """, conn);
        recipeCmd.Parameters.AddWithValue("id", id);
        recipeCmd.Parameters.AddWithValue("familyId", familyId);

        Recipe? recipe = null;
        await using (var reader = await recipeCmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
                recipe = ReadRecipe(reader);
        }

        if (recipe is null)
            return null;

        var ingredients = await GetIngredientsAsync(conn, id);
        return new RecipeWithIngredients(recipe, ingredients);
    }

    public async Task<RecipeWithIngredients> CreateAsync(
        Guid familyId, string userId, string name, string? instructions, string[] categories, List<IngredientInput> ingredients)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();

        await using var recipeCmd = new NpgsqlCommand(
            """
            INSERT INTO recipes (family_id, name, instructions, categories, created_by)
            VALUES (@familyId, @name, @instructions, @categories, @userId)
            RETURNING id, family_id, name, instructions, categories, created_by, created_at, updated_at
            """, conn, tx);
        recipeCmd.Parameters.AddWithValue("familyId", familyId);
        recipeCmd.Parameters.AddWithValue("name", name);
        recipeCmd.Parameters.AddWithValue("instructions", (object?)instructions ?? DBNull.Value);
        recipeCmd.Parameters.AddWithValue("categories", categories);
        recipeCmd.Parameters.AddWithValue("userId", userId);

        Recipe? recipe = null;
        await using (var reader = await recipeCmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
                recipe = ReadRecipe(reader);
        }

        if (recipe is null)
            throw new InvalidOperationException("Failed to create recipe.");

        var savedIngredients = await InsertIngredientsAsync(conn, tx, recipe.Id, ingredients);
        await tx.CommitAsync();

        return new RecipeWithIngredients(recipe, savedIngredients);
    }

    public async Task<RecipeWithIngredients?> UpdateAsync(
        Guid id, Guid familyId, string name, string? instructions, string[] categories, List<IngredientInput> ingredients)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();

        await using var recipeCmd = new NpgsqlCommand(
            """
            UPDATE recipes
            SET name = @name, instructions = @instructions, categories = @categories, updated_at = now()
            WHERE id = @id AND family_id = @familyId
            RETURNING id, family_id, name, instructions, categories, created_by, created_at, updated_at
            """, conn, tx);
        recipeCmd.Parameters.AddWithValue("id", id);
        recipeCmd.Parameters.AddWithValue("familyId", familyId);
        recipeCmd.Parameters.AddWithValue("name", name);
        recipeCmd.Parameters.AddWithValue("instructions", (object?)instructions ?? DBNull.Value);
        recipeCmd.Parameters.AddWithValue("categories", categories);

        Recipe? recipe = null;
        await using (var reader = await recipeCmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
                recipe = ReadRecipe(reader);
        }

        if (recipe is null)
            return null;

        // Replace all ingredients.
        await using var deleteCmd = new NpgsqlCommand(
            "DELETE FROM recipe_ingredients WHERE recipe_id = @recipeId", conn, tx);
        deleteCmd.Parameters.AddWithValue("recipeId", id);
        await deleteCmd.ExecuteNonQueryAsync();

        var savedIngredients = await InsertIngredientsAsync(conn, tx, id, ingredients);
        await tx.CommitAsync();

        return new RecipeWithIngredients(recipe, savedIngredients);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid familyId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "DELETE FROM recipes WHERE id = @id AND family_id = @familyId", conn);
        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("familyId", familyId);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    private static async Task<List<RecipeIngredient>> InsertIngredientsAsync(
        NpgsqlConnection conn, NpgsqlTransaction tx, Guid recipeId, List<IngredientInput> ingredients)
    {
        var result = new List<RecipeIngredient>();

        foreach (var input in ingredients)
        {
            await using var cmd = new NpgsqlCommand(
                """
                INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit)
                VALUES (@recipeId, @name, @quantity, @unit)
                RETURNING id, recipe_id, name, quantity, unit
                """, conn, tx);
            cmd.Parameters.AddWithValue("recipeId", recipeId);
            cmd.Parameters.AddWithValue("name", input.Name);
            cmd.Parameters.AddWithValue("quantity", (object?)input.Quantity ?? DBNull.Value);
            cmd.Parameters.AddWithValue("unit", (object?)input.Unit ?? DBNull.Value);

            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
                result.Add(ReadIngredient(reader));
        }

        return result;
    }

    public async Task<List<string>> GetDistinctIngredientNamesAsync(Guid familyId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            SELECT DISTINCT ri.name
            FROM recipe_ingredients ri
            JOIN recipes r ON r.id = ri.recipe_id
            WHERE r.family_id = @familyId
            ORDER BY ri.name
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);

        var names = new List<string>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            names.Add(reader.GetString(0));

        return names;
    }

    private static async Task<List<RecipeIngredient>> GetIngredientsAsync(NpgsqlConnection conn, Guid recipeId)
    {
        await using var cmd = new NpgsqlCommand(
            """
            SELECT id, recipe_id, name, quantity, unit
            FROM recipe_ingredients
            WHERE recipe_id = @recipeId
            ORDER BY id
            """, conn);
        cmd.Parameters.AddWithValue("recipeId", recipeId);

        var list = new List<RecipeIngredient>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            list.Add(ReadIngredient(reader));

        return list;
    }

    private static Recipe ReadRecipe(NpgsqlDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        reader.GetString(2),
        reader.IsDBNull(3) ? null : reader.GetString(3),
        reader.IsDBNull(4) ? [] : reader.GetFieldValue<string[]>(4),
        reader.GetString(5),
        reader.GetDateTime(6),
        reader.GetDateTime(7));

    private static RecipeIngredient ReadIngredient(NpgsqlDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        reader.GetString(2),
        reader.IsDBNull(3) ? null : reader.GetDecimal(3),
        reader.IsDBNull(4) ? null : reader.GetString(4));
}
