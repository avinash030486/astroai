namespace AstroAI.Core.Services;

public sealed record PersonalizedRemediesRequest(
    DateOnly BirthDate,
    TimeOnly BirthTime,
    string City,
    string State,
    string Country,
    IReadOnlyList<string> AreasOfConcern,
    double? Latitude = null,
    double? Longitude = null,
    string? TimeZoneId = null);

public sealed record PersonalizedRemediesResponse(
    string ChartSummary,
    IReadOnlyList<Remedy> Mantras,
    IReadOnlyList<Remedy> Gemstones,
    IReadOnlyList<Remedy> FastingDays,
    IReadOnlyList<Remedy> Rituals,
    IReadOnlyList<Remedy> Donations,
    IReadOnlyList<Remedy> LifestyleAdjustments,
    string PlanetaryRemedyPriority,
    IReadOnlyList<string> ImmediateActions);

public sealed record Remedy(
    string Name,
    string Description,
    string Benefit,
    string HowToPractice,
    string Frequency,
    string BestTime,
    int EffectivenessScore);
