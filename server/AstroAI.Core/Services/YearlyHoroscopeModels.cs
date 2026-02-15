namespace AstroAI.Core.Services;

public sealed record YearlyHoroscopeRequest(
    DateOnly BirthDate,
    TimeOnly BirthTime,
    string City,
    string State,
    string Country,
    int Year,
    double? Latitude = null,
    double? Longitude = null,
    string? TimeZoneId = null);

public sealed record YearlyHoroscopeResponse(
    int Year,
    string OverallTheme,
    IReadOnlyList<LifeAreaPrediction> LifeAreas,
    IReadOnlyList<MonthlyHighlight> MonthlyHighlights,
    IReadOnlyList<KeyDate> ImportantDates,
    IReadOnlyList<string> YearlyRemedies,
    string DashaTransitions);

public sealed record LifeAreaPrediction(
    string Area,
    int Score,
    string Overview,
    IReadOnlyList<string> KeyPoints);

public sealed record MonthlyHighlight(
    int Month,
    string MonthName,
    string CareerOutlook,
    string FinanceOutlook,
    string RelationshipOutlook,
    string HealthOutlook,
    string LuckyDays);

public sealed record KeyDate(
    DateTime DateUtc,
    string Event,
    string Significance,
    string Recommendation);
