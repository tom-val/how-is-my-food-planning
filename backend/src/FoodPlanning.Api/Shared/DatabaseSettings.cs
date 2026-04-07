using System.ComponentModel.DataAnnotations;

namespace FoodPlanning.Api.Shared;

public class DatabaseSettings
{
    public const string SectionName = "Database";

    [Required]
    public required string ConnectionString { get; init; }
}
