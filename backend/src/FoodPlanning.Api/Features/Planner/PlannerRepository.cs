using FoodPlanning.Api.Shared.Database;
using Npgsql;

namespace FoodPlanning.Api.Features.Planner;

public record WeeklyPlan(
    Guid Id,
    Guid FamilyId,
    DateOnly WeekStartDate,
    string CreatedBy,
    DateTime CreatedAt,
    string? AssignedTo,
    string? AssignedName);

public record PlannedMeal(
    Guid Id,
    Guid WeeklyPlanId,
    int DayOfWeek,
    string MealType,
    Guid RecipeId,
    string RecipeName,
    bool IsShadow);

public record WeeklyPlanWithMeals(WeeklyPlan Plan, List<PlannedMeal> Meals);

public interface IPlannerRepository
{
    Task<WeeklyPlanWithMeals> GetOrCreateAsync(Guid familyId, DateOnly weekStart, string userId);
    Task<PlannedMeal> AddMealAsync(Guid planId, int dayOfWeek, string mealType, Guid recipeId, bool isShadow);
    Task<bool> RemoveMealAsync(Guid planId, Guid mealId);
    Task<Guid?> GetPlanFamilyIdAsync(Guid planId);
    Task<PlannedMeal> ScheduleMealAsync(Guid familyId, string userId, DateOnly date, string mealType, Guid recipeId, bool isShadow);
    Task<WeeklyPlan> AssignPlanAsync(Guid planId, string? assignedTo, string? assignedName);
}

public class PlannerRepository : IPlannerRepository
{
    private readonly DbConnectionFactory _db;

    public PlannerRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<WeeklyPlanWithMeals> GetOrCreateAsync(Guid familyId, DateOnly weekStart, string userId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        // Try to find existing plan.
        await using var findCmd = new NpgsqlCommand(
            """
            SELECT id, family_id, week_start_date, created_by, created_at, assigned_to, assigned_name
            FROM weekly_plans
            WHERE family_id = @familyId AND week_start_date = @weekStart
            """, conn);
        findCmd.Parameters.AddWithValue("familyId", familyId);
        findCmd.Parameters.AddWithValue("weekStart", weekStart);

        WeeklyPlan? plan = null;
        await using (var reader = await findCmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
                plan = ReadPlan(reader);
        }

        // Auto-create if not exists.
        if (plan is null)
        {
            await using var createCmd = new NpgsqlCommand(
                """
                INSERT INTO weekly_plans (family_id, week_start_date, created_by)
                VALUES (@familyId, @weekStart, @userId)
                RETURNING id, family_id, week_start_date, created_by, created_at, assigned_to, assigned_name
                """, conn);
            createCmd.Parameters.AddWithValue("familyId", familyId);
            createCmd.Parameters.AddWithValue("weekStart", weekStart);
            createCmd.Parameters.AddWithValue("userId", userId);

            await using var reader = await createCmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
                plan = ReadPlan(reader);
        }

        if (plan is null)
            throw new InvalidOperationException("Failed to get or create weekly plan.");

        var meals = await GetMealsAsync(conn, plan.Id);
        return new WeeklyPlanWithMeals(plan, meals);
    }

    public async Task<PlannedMeal> AddMealAsync(Guid planId, int dayOfWeek, string mealType, Guid recipeId, bool isShadow)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            INSERT INTO planned_meals (weekly_plan_id, day_of_week, meal_type, recipe_id, is_shadow)
            VALUES (@planId, @dayOfWeek, @mealType, @recipeId, @isShadow)
            RETURNING id
            """, conn);
        cmd.Parameters.AddWithValue("planId", planId);
        cmd.Parameters.AddWithValue("dayOfWeek", (short)dayOfWeek);
        cmd.Parameters.AddWithValue("mealType", mealType);
        cmd.Parameters.AddWithValue("recipeId", recipeId);
        cmd.Parameters.AddWithValue("isShadow", isShadow);

        var mealId = (Guid)(await cmd.ExecuteScalarAsync())!;

        // Fetch with recipe name.
        await using var fetchCmd = new NpgsqlCommand(
            """
            SELECT pm.id, pm.weekly_plan_id, pm.day_of_week, pm.meal_type, pm.recipe_id, r.name, pm.is_shadow
            FROM planned_meals pm
            JOIN recipes r ON r.id = pm.recipe_id
            WHERE pm.id = @mealId
            """, conn);
        fetchCmd.Parameters.AddWithValue("mealId", mealId);

        await using var reader = await fetchCmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            throw new InvalidOperationException("Failed to fetch created meal.");

        return ReadMeal(reader);
    }

    public async Task<bool> RemoveMealAsync(Guid planId, Guid mealId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "DELETE FROM planned_meals WHERE id = @mealId AND weekly_plan_id = @planId",
            conn);
        cmd.Parameters.AddWithValue("mealId", mealId);
        cmd.Parameters.AddWithValue("planId", planId);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task<Guid?> GetPlanFamilyIdAsync(Guid planId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "SELECT family_id FROM weekly_plans WHERE id = @planId", conn);
        cmd.Parameters.AddWithValue("planId", planId);

        var result = await cmd.ExecuteScalarAsync();
        return result is Guid familyId ? familyId : null;
    }

    public async Task<PlannedMeal> ScheduleMealAsync(
        Guid familyId, string userId, DateOnly date, string mealType, Guid recipeId, bool isShadow)
    {
        // Calculate the Monday of the target week and the day index (0=Mon).
        var dayOfWeekIndex = ((int)date.DayOfWeek + 6) % 7; // Convert Sun=0 to Mon=0
        var monday = date.AddDays(-dayOfWeekIndex);

        // Get or create the plan for that week.
        var planWithMeals = await GetOrCreateAsync(familyId, monday, userId);

        // Add the meal.
        return await AddMealAsync(planWithMeals.Plan.Id, dayOfWeekIndex, mealType, recipeId, isShadow);
    }

    public async Task<WeeklyPlan> AssignPlanAsync(Guid planId, string? assignedTo, string? assignedName)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            UPDATE weekly_plans
            SET assigned_to = @assignedTo, assigned_name = @assignedName
            WHERE id = @planId
            RETURNING id, family_id, week_start_date, created_by, created_at, assigned_to, assigned_name
            """, conn);
        cmd.Parameters.AddWithValue("planId", planId);
        cmd.Parameters.AddWithValue("assignedTo", (object?)assignedTo ?? DBNull.Value);
        cmd.Parameters.AddWithValue("assignedName", (object?)assignedName ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            throw new InvalidOperationException("Plan not found.");

        return ReadPlan(reader);
    }

    private static async Task<List<PlannedMeal>> GetMealsAsync(NpgsqlConnection conn, Guid planId)
    {
        await using var cmd = new NpgsqlCommand(
            """
            SELECT pm.id, pm.weekly_plan_id, pm.day_of_week, pm.meal_type, pm.recipe_id, r.name, pm.is_shadow
            FROM planned_meals pm
            JOIN recipes r ON r.id = pm.recipe_id
            WHERE pm.weekly_plan_id = @planId
            ORDER BY pm.day_of_week, pm.meal_type, r.name
            """, conn);
        cmd.Parameters.AddWithValue("planId", planId);

        var meals = new List<PlannedMeal>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            meals.Add(ReadMeal(reader));

        return meals;
    }

    private static WeeklyPlan ReadPlan(NpgsqlDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        DateOnly.FromDateTime(reader.GetDateTime(2)),
        reader.GetString(3),
        reader.GetDateTime(4),
        reader.IsDBNull(5) ? null : reader.GetString(5),
        reader.IsDBNull(6) ? null : reader.GetString(6));

    private static PlannedMeal ReadMeal(NpgsqlDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        reader.GetInt16(2),
        reader.GetString(3),
        reader.GetGuid(4),
        reader.GetString(5),
        reader.GetBoolean(6));
}
