namespace AstroAI.Core.Services;

public sealed record AskQuestionRequest(
    string City,
    string State,
    string Country,
    DateOnly BirthDate,
    TimeOnly BirthTime,
    double? Latitude = null,
    double? Longitude = null,
    string? TimeZoneId = null,
    string Question = "");

/// <summary>
/// Compact chart summary and context we send to GPT for answering a specific question.
/// Built from the full KP chart and dasha status.
/// </summary>
public sealed record AskQuestionPayload(
    string AyanamshaName,
    double AyanamshaDegrees,
    string AscendantSign,
    double AscendantSiderealLongitude,
    DateTime BirthDateTimeUtc,
    DateTime CurrentDateTimeUtc,
    IReadOnlyList<House> Houses,
    IReadOnlyList<PlanetPosition> Planets,
    DashaStatus Dasha,
    int AgeYears,
    string Question);

public sealed record AskQuestionResponse(
    string Summary,
    string Answer,
    string Cautions);
