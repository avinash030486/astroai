namespace AstroAI.Core.Services;

public sealed record GemstoneRequest(
    DateOnly BirthDate,
    TimeOnly BirthTime,
    string City,
    string State,
    string Country);

public sealed record GemstoneRecommendation(
    string GemstoneName,
    string Planet,
    string Metal,
    string Finger,
    string Weight,
    string Benefits,
    string HowToWear,
    string BestDay,
    string Cautions,
    int Priority);

public sealed record GemstoneResponse(
    string ChartSummary,
    string PrimaryGemstone,
    IReadOnlyList<GemstoneRecommendation> Recommendations,
    string GeneralAdvice);
