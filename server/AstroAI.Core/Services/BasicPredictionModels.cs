using System.Collections.Generic;

namespace AstroAI.Core.Services;

public sealed record BasicChartPredictionRequest(
    string AyanamshaName,
    double AyanamshaDegrees,
    double AscendantSiderealLongitude,
    string AscendantSign,
    IReadOnlyList<House> Houses,
    IReadOnlyList<PlanetPosition> Planets,
    DateTime? BirthDateTimeUtc,
    DateTime? CurrentDateTimeUtc);

public sealed record BasicChartPredictionResponse(
    int AgeYears,
    string AscendantSummary,
    IReadOnlyList<string> PlanetaryHighlights,
    string CurrentDasha,
    string CurrentAntarDasha,
    string DashaEffects,
    string AntarEffects,
    DateTime MahaStartUtc,
    DateTime MahaEndUtc,
    DateTime AntarStartUtc,
    DateTime AntarEndUtc,
    string Narrative);
