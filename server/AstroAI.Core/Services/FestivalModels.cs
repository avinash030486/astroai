namespace AstroAI.Core.Services;

public sealed record FestivalEvent(
    string Name,
    string Date,          // "YYYY-MM-DD"
    string Type,          // "Festival" | "Vrat" | "Ekadashi" | "Amavasya" | "Purnima"
    string Deity,
    string Significance,
    string Observance,
    bool IsNationalHoliday);

public sealed record FestivalCalendarResponse(
    int Month,
    int Year,
    string MonthName,
    IReadOnlyList<FestivalEvent> Events);
