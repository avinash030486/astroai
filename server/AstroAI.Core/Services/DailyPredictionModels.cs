using System;
using System.Collections.Generic;

namespace AstroAI.Core.Services;

// Per-sign daily predictions across categories
public sealed record DailyPrediction(
    string Sign,
    string Career,
    string Money,
    string Love);

public sealed record DailyPredictionsResponse(
    DateTime DateUtc,
    IReadOnlyList<DailyPrediction> Predictions);
