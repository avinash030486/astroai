namespace AstroAI.Core.Services;

public sealed record MatchmakingRequest(
    string Person1Name,
    DateOnly Person1BirthDate,
    TimeOnly Person1BirthTime,
    string Person1City,
    string Person1State,
    string Person1Country,
    double? Person1Latitude,
    double? Person1Longitude,
    string? Person1TimeZoneId,
    
    string Person2Name,
    DateOnly Person2BirthDate,
    TimeOnly Person2BirthTime,
    string Person2City,
    string Person2State,
    string Person2Country,
    double? Person2Latitude,
    double? Person2Longitude,
    string? Person2TimeZoneId);

public sealed record MatchmakingResponse(
    int OverallScore,
    string CompatibilityLevel,
    string SynastryAnalysis,
    IReadOnlyList<CompatibilityArea> AreasOfCompatibility,
    IReadOnlyList<string> Strengths,
    IReadOnlyList<string> Challenges,
    IReadOnlyList<string> Recommendations,
    string NextSteps,
    string KutaScore,
    IReadOnlyList<KutaDetail> KutaBreakdown);

public sealed record CompatibilityArea(
    string Name,
    int Score,
    string Analysis);

public sealed record KutaDetail(
    string Name,
    int Points,
    int MaxPoints,
    string Description);
