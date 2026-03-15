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

// ── Zodiac Grid Summaries ─────────────────────────────────────────────────────
public sealed record ZodiacTransitSummary(
    string Sign,
    string Emoji,
    string Summary,
    string DominantPlanet,
    string Energy);   // "Favorable" | "Neutral" | "Challenging"

// ── Detailed Transit (per sign) ───────────────────────────────────────────────
public sealed record LifeAreaDetail(int Score, string Summary, string Advice);

public sealed record WeekDayForecast(
    string Day,
    string Date,
    string Energy,   // "Good" | "Neutral" | "Caution"
    string Tip);

public sealed record KeyPlanetInfo(string Planet, string Role, string Effect);

public sealed record DetailedTransitResponse(
    string Sign,
    string Emoji,
    string Date,
    string OverallEnergy,   // "Favorable" | "Neutral" | "Challenging"
    int EnergyScore,
    string Headline,
    IReadOnlyList<PlanetaryTransit> CurrentTransits,
    LifeAreaDetail Career,
    LifeAreaDetail Love,
    LifeAreaDetail Finance,
    LifeAreaDetail Health,
    LifeAreaDetail Spirituality,
    IReadOnlyList<WeekDayForecast> WeeklyForecast,
    IReadOnlyList<KeyPlanetInfo> KeyPlanets,
    IReadOnlyList<int> LuckyNumbers,
    IReadOnlyList<string> LuckyColors,
    string LuckyGemstone,
    IReadOnlyList<string> Remedies,
    IReadOnlyList<string> Opportunities,
    IReadOnlyList<string> CautionAreas);

// ── Monthly Transit ───────────────────────────────────────────────────────────
public sealed record MonthlyWeek(
    int WeekNumber,
    string DateRange,
    string Theme,
    IReadOnlyList<string> Highlights,
    IReadOnlyList<string> Challenges,
    string Energy);   // "Favorable" | "Neutral" | "Challenging"

public sealed record ImportantDate(string Date, string Significance);

public sealed record MonthlyTransitResponse(
    string Sign,
    string Month,
    string MonthlyTheme,
    int OverallScore,
    IReadOnlyList<MonthlyWeek> Weeks,
    IReadOnlyList<ImportantDate> ImportantDates,
    string MonthlyAdvice);
