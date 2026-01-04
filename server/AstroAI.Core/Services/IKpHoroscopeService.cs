namespace AstroAI.Core.Services;

public interface IKpHoroscopeService
{
    Task<SouthIndianChart> GenerateSouthIndianChartAsync(BirthChartRequest req, CancellationToken ct);

    Task<AskQuestionResponse> AskQuestionAsync(AskQuestionRequest req, CancellationToken ct);
}

public sealed record BirthChartRequest(
    string City, string State, string Country,
    DateOnly BirthDate, TimeOnly BirthTime,
    double? Latitude = null, double? Longitude = null, string? TimeZoneId = null);

public sealed record SouthIndianChart(
    string AyanamshaName,
    double AyanamshaDegrees,
    double AscendantSiderealLongitude,
    string AscendantSign,
    DateTime BirthDateTimeUtc,
    DateTime CurrentDateTimeUtc,
    IReadOnlyList<House> Houses,
    IReadOnlyList<PlanetPosition> Planets);

public sealed record House(
    int Number,
    string Sign,
    IReadOnlyList<string> Occupants,
    string RasiLord,
    string Nakshatra,
    string NakshatraLord,
    string SubLord,
    string SubSubLord);

public sealed record PlanetPosition(
    string Name,
    double Longitude,
    double SiderealLongitude,
    string Sign,
    int House,
    string RasiLord,
    string Nakshatra,
    string NakshatraLord,
    string SubLord,
    string SubSubLord);
