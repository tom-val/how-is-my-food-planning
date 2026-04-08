using FoodPlanning.Api.Shared.Database;
using Npgsql;

namespace FoodPlanning.Api.Features.Families;

public record Family(
    Guid Id,
    string Name,
    string InviteCode,
    string CreatedBy,
    DateTime CreatedAt);

public record FamilyMember(
    Guid Id,
    Guid FamilyId,
    string UserId,
    string DisplayName,
    string Role,
    DateTime JoinedAt);

public record FamilyWithMembers(Family Family, List<FamilyMember> Members);

public interface IFamilyRepository
{
    Task<Family> CreateAsync(string name, string userId, string displayName);
    Task<FamilyWithMembers?> GetByUserIdAsync(string userId);
    Task<Family?> GetByInviteCodeAsync(string inviteCode);
    Task<FamilyMember?> GetMembershipAsync(string userId);
    Task<FamilyMember> JoinAsync(Guid familyId, string userId, string displayName);
    Task<List<FamilyMember>> GetMembersAsync(Guid familyId);
    Task<string> RegenerateInviteCodeAsync(Guid familyId);
    Task<bool> RemoveMemberAsync(Guid familyId, string userId);
    Task LeaveAsync(Guid familyId, string userId);
}

public class FamilyRepository : IFamilyRepository
{
    private readonly DbConnectionFactory _db;

    public FamilyRepository(DbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<Family> CreateAsync(string name, string userId, string displayName)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();

        await using var familyCmd = new NpgsqlCommand(
            """
            INSERT INTO families (name, created_by)
            VALUES (@name, @userId)
            RETURNING id, name, invite_code, created_by, created_at
            """, conn, tx);
        familyCmd.Parameters.AddWithValue("name", name);
        familyCmd.Parameters.AddWithValue("userId", userId);

        Family? family = null;
        await using (var reader = await familyCmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                family = ReadFamily(reader);
            }
        }

        if (family is null)
            throw new InvalidOperationException("Failed to create family.");

        await using var memberCmd = new NpgsqlCommand(
            """
            INSERT INTO family_members (family_id, user_id, display_name, role)
            VALUES (@familyId, @userId, @displayName, 'owner')
            """, conn, tx);
        memberCmd.Parameters.AddWithValue("familyId", family.Id);
        memberCmd.Parameters.AddWithValue("userId", userId);
        memberCmd.Parameters.AddWithValue("displayName", displayName);
        await memberCmd.ExecuteNonQueryAsync();

        await tx.CommitAsync();
        return family;
    }

    public async Task<FamilyWithMembers?> GetByUserIdAsync(string userId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        // Find user's family.
        await using var familyCmd = new NpgsqlCommand(
            """
            SELECT f.id, f.name, f.invite_code, f.created_by, f.created_at
            FROM families f
            JOIN family_members fm ON fm.family_id = f.id
            WHERE fm.user_id = @userId
            LIMIT 1
            """, conn);
        familyCmd.Parameters.AddWithValue("userId", userId);

        Family? family = null;
        await using (var reader = await familyCmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                family = ReadFamily(reader);
            }
        }

        if (family is null)
            return null;

        var members = await GetMembersInternalAsync(conn, family.Id);
        return new FamilyWithMembers(family, members);
    }

    public async Task<Family?> GetByInviteCodeAsync(string inviteCode)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            SELECT id, name, invite_code, created_by, created_at
            FROM families
            WHERE invite_code = @code
            """, conn);
        cmd.Parameters.AddWithValue("code", inviteCode);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? ReadFamily(reader) : null;
    }

    public async Task<FamilyMember?> GetMembershipAsync(string userId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            SELECT id, family_id, user_id, display_name, role, joined_at
            FROM family_members
            WHERE user_id = @userId
            LIMIT 1
            """, conn);
        cmd.Parameters.AddWithValue("userId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? ReadMember(reader) : null;
    }

    public async Task<FamilyMember> JoinAsync(Guid familyId, string userId, string displayName)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            INSERT INTO family_members (family_id, user_id, display_name, role)
            VALUES (@familyId, @userId, @displayName, 'member')
            RETURNING id, family_id, user_id, display_name, role, joined_at
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("displayName", displayName);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            throw new InvalidOperationException("Failed to join family.");

        return ReadMember(reader);
    }

    public async Task<List<FamilyMember>> GetMembersAsync(Guid familyId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        return await GetMembersInternalAsync(conn, familyId);
    }

    public async Task<string> RegenerateInviteCodeAsync(Guid familyId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            UPDATE families
            SET invite_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
            WHERE id = @familyId
            RETURNING invite_code
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);

        var result = await cmd.ExecuteScalarAsync();
        return result?.ToString() ?? throw new InvalidOperationException("Failed to regenerate code.");
    }

    public async Task<bool> RemoveMemberAsync(Guid familyId, string userId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            """
            DELETE FROM family_members
            WHERE family_id = @familyId AND user_id = @userId AND role != 'owner'
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);
        cmd.Parameters.AddWithValue("userId", userId);

        return await cmd.ExecuteNonQueryAsync() > 0;
    }

    public async Task LeaveAsync(Guid familyId, string userId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var tx = await conn.BeginTransactionAsync();

        // Remove the member.
        await using var deleteCmd = new NpgsqlCommand(
            "DELETE FROM family_members WHERE family_id = @familyId AND user_id = @userId",
            conn, tx);
        deleteCmd.Parameters.AddWithValue("familyId", familyId);
        deleteCmd.Parameters.AddWithValue("userId", userId);
        await deleteCmd.ExecuteNonQueryAsync();

        // If no members remain, delete the family.
        await using var countCmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM family_members WHERE family_id = @familyId",
            conn, tx);
        countCmd.Parameters.AddWithValue("familyId", familyId);
        var remaining = (long)(await countCmd.ExecuteScalarAsync())!;

        if (remaining == 0)
        {
            await using var deleteFamilyCmd = new NpgsqlCommand(
                "DELETE FROM families WHERE id = @familyId",
                conn, tx);
            deleteFamilyCmd.Parameters.AddWithValue("familyId", familyId);
            await deleteFamilyCmd.ExecuteNonQueryAsync();
        }

        await tx.CommitAsync();
    }

    private static async Task<List<FamilyMember>> GetMembersInternalAsync(NpgsqlConnection conn, Guid familyId)
    {
        await using var cmd = new NpgsqlCommand(
            """
            SELECT id, family_id, user_id, display_name, role, joined_at
            FROM family_members
            WHERE family_id = @familyId
            ORDER BY joined_at
            """, conn);
        cmd.Parameters.AddWithValue("familyId", familyId);

        var members = new List<FamilyMember>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            members.Add(ReadMember(reader));
        }
        return members;
    }

    private static Family ReadFamily(NpgsqlDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetString(1),
        reader.GetString(2),
        reader.GetString(3),
        reader.GetDateTime(4));

    private static FamilyMember ReadMember(NpgsqlDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetGuid(1),
        reader.GetString(2),
        reader.GetString(3),
        reader.GetString(4),
        reader.GetDateTime(5));
}
