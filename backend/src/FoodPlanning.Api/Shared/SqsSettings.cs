namespace FoodPlanning.Api.Shared;

public class SqsSettings
{
    public const string SectionName = "Sqs";

    public string AiRecipeQueueUrl { get; init; } = "";
}
