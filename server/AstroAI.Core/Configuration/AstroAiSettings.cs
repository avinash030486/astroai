namespace AstroAI.Core.Configuration;

public sealed class AstroAiSettings
{
    public string OpenAIEndpoint { get; set; } = string.Empty;
    public string OpenAIApiKey { get; set; } = string.Empty;
    public string ModelId { get; set; } = "gpt-5.2";
}
