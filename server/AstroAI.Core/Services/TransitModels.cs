namespace AstroAI.Core.Services;

public sealed record TransitAlertsRequest(string ZodiacSign);

public sealed record PlanetaryTransit(
    string Planet,
    string TransitSign,
    string Effect,
    string Intensity,   // "High" | "Medium" | "Low"
    string Duration,
    string Advice);

public sealed record TransitAlertsResponse(
    string ZodiacSign,
    DateTime AsOfDate,
    string OverallTheme,
    IReadOnlyList<PlanetaryTransit> Transits,
    string KeyOpportunities,
    string KeyChallenges);
