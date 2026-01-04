using System;
using System.Collections.Generic;

namespace AstroAI.Core.Services;

public sealed record DetailedChartPredictionResponse(
    int AgeYears,
    string AscendantSummary,
    string Career,
    string Finance,
    string Relationships,
    string Destiny,
    string JobWindow,
    string MarriageWindow,
    IReadOnlyList<string> GoodYogas,
    IReadOnlyList<string> BadYogas,
    IReadOnlyList<string> Remedies,
    string CurrentDasha,
    string CurrentAntarDasha,
    string DashaEffects,
    string AntarEffects,
    DateTime MahaStartUtc,
    DateTime MahaEndUtc,
    DateTime AntarStartUtc,
    DateTime AntarEndUtc,
    string Narrative);
