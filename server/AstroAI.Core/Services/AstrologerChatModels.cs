namespace AstroAI.Core.Services;

public sealed record AstrologerChatMessage(string Role, string Content);

public sealed record AstrologerChatRequest(
    IReadOnlyList<AstrologerChatMessage> History,
    string NewMessage,
    string? UserName = null,
    string? ZodiacSign = null,
    string? ChartContext = null);   // compact KP chart summary passed from frontend

public sealed record AstrologerChatResponse(
    string Reply,
    string Tone,
    string? Emoji);

// ── Cast-chart (public, no auth) ────────────────────────────────────────────
public sealed record CastChartRequest(
    string Name,
    DateOnly BirthDate,
    TimeOnly BirthTime,
    string PlaceOfBirth);   // e.g. "Trivandrum, Kerala, India" – parsed server-side

public sealed record CastChartResponse(
    string ChartContext,    // compact string to pass back with every chat call
    string AscendantSign,
    string MoonSign,
    string SunSign,
    string CurrentMahaDasha,
    string CurrentAntarDasha);
