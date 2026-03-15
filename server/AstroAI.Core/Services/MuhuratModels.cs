namespace AstroAI.Core.Services;

public sealed record MuhuratRequest(
    string ActivityType,
    string City,
    string State,
    string Country,
    DateOnly FromDate,
    DateOnly ToDate);

public sealed record MuhuratWindow(
    string Date,
    string StartTime,
    string EndTime,
    int Score,
    string PlanetarySupport,
    string AuspiciousElements,
    string Reason);

public sealed record MuhuratResponse(
    string ActivityType,
    string Location,
    string BestDate,
    string BestTime,
    IReadOnlyList<MuhuratWindow> Windows,
    string GeneralAdvice);
