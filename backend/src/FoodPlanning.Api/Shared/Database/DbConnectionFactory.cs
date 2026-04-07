using Microsoft.Extensions.Options;
using Npgsql;

namespace FoodPlanning.Api.Shared.Database;

public class DbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(IOptions<DatabaseSettings> settings)
    {
        _connectionString = settings.Value.ConnectionString;
    }

    public NpgsqlConnection CreateConnection()
    {
        return new NpgsqlConnection(_connectionString);
    }
}
