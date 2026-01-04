using AstroAI.Core.Services;

namespace AstroAI.Infrastructure.Services;

/// <summary>
/// A minimal, replaceable ephemeris service. For now returns placeholder mean longitudes.
/// Replace with Swiss Ephemeris-backed implementation for production accuracy.
/// </summary>
public sealed class StubEphemerisService : IEphemerisService
{
    public Task<IReadOnlyDictionary<string, double>> GetTropicalLongitudesAsync(DateTime utc, CancellationToken ct)
    {
        // Days since J2000
        var jd = ToJulianDay(utc);
        var D = jd - 2451545.0;

        // Very rough mean motions (deg/day). Not suitable for precise work.
        var lon = new Dictionary<string, double>
        {
            ["Sun"] = Normalize(280.460 + 0.9856474 * D),
            ["Moon"] = Normalize(218.316 + 13.176396 * D),
            // Improved mean motions for inner planets (still approximate)
            ["Mercury"] = Normalize(252.250 + 4.09233445 * D),
            ["Venus"] = Normalize(181.979 + 1.60213034 * D),
            ["Mars"] = Normalize(355.433 + 0.52403209 * D),
            ["Jupiter"] = Normalize(34.351 + 0.08308624 * D),
            ["Saturn"] = Normalize(50.077 + 0.03345965 * D),
            // Mean nodes (retrograde). Ensure Ketu is exactly opposite Rahu.
            ["Rahu"] = Normalize(125.044555 - 0.0529539 * D)
        };
        lon["Ketu"] = Normalize(lon["Rahu"] + 180.0);

        return Task.FromResult<IReadOnlyDictionary<string, double>>(lon);
    }

    private static double Normalize(double d)
    {
        d %= 360.0; return d < 0 ? d + 360.0 : d;
    }

    private static double ToJulianDay(DateTime utc)
    {
        if (utc.Kind != DateTimeKind.Utc)
            utc = DateTime.SpecifyKind(utc, DateTimeKind.Utc);
        int Y = utc.Year;
        int M = utc.Month;
        double D = utc.Day + (utc.Hour + (utc.Minute + (utc.Second / 60.0)) / 60.0) / 24.0;
        if (M <= 2) { Y -= 1; M += 12; }
        int A = Y / 100; int B = 2 - A + (A / 4);
        double jd = Math.Floor(365.25 * (Y + 4716)) + Math.Floor(30.6001 * (M + 1)) + D + B - 1524.5;
        return jd;
    }
}
