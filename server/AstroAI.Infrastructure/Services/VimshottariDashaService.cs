using AstroAI.Core.Services;

namespace AstroAI.Infrastructure.Services;

public sealed class VimshottariDashaService : IVimshottariDashaService
{
    // Vimshottari durations in years
    private static readonly (string Lord, double Years)[] Order = new (string, double)[]
    {
        ("Ketu", 7), ("Venus", 20), ("Sun", 6), ("Moon", 10), ("Mars", 7), ("Rahu", 18), ("Jupiter", 16), ("Saturn", 19), ("Mercury", 17)
    };

    private const double TotalYears = 120.0;
    private const double NakshatraSpanDeg = 13.3333333333; // 13°20'

    // Map Nakshatra name to its lord as per classic order
    private static readonly Dictionary<string, string> NakshatraLord = new(StringComparer.OrdinalIgnoreCase)
    {
        {"Ashwini", "Ketu"}, {"Bharani", "Venus"}, {"Krittika", "Sun"}, {"Rohini", "Moon"}, {"Mrigashirsha", "Mars"}, {"Ardra", "Rahu"},
        {"Punarvasu", "Jupiter"}, {"Pushya", "Saturn"}, {"Ashlesha", "Mercury"}, {"Magha", "Ketu"}, {"Purva Phalguni", "Venus"}, {"Uttara Phalguni", "Sun"},
        {"Hasta", "Moon"}, {"Chitra", "Mars"}, {"Swati", "Rahu"}, {"Vishakha", "Jupiter"}, {"Anuradha", "Saturn"}, {"Jyeshtha", "Mercury"},
        {"Mula", "Ketu"}, {"Purva Ashadha", "Venus"}, {"Uttara Ashadha", "Sun"}, {"Shravana", "Moon"}, {"Dhanishta", "Mars"}, {"Shatabhisha", "Rahu"},
        {"Purva Bhadrapada", "Jupiter"}, {"Uttara Bhadrapada", "Saturn"}, {"Revati", "Mercury"}
    };

    public DashaStatus ComputeCurrent(DateTime birthUtc, DateTime currentUtc, double moonSiderealLongitudeDeg, string moonNakshatra)
    {
        var startLord = NakshatraLord.TryGetValue(moonNakshatra, out var lord) ? lord : GetLordFromLongitude(moonSiderealLongitudeDeg);
        // Balance of first dasha
        var fracRemaining = 1.0 - (moonSiderealLongitudeDeg % NakshatraSpanDeg) / NakshatraSpanDeg;
        var firstYears = GetYears(startLord) * fracRemaining;
        var cursor = birthUtc;

        // Find current Maha dasha
        string mahaLord = startLord;
        DateTime mahaStart = cursor;
        DateTime mahaEnd = cursor.AddYearsPrecise(firstYears);

        if (currentUtc > mahaEnd)
        {
            cursor = mahaEnd;
            foreach (var (L, Y) in CycleFrom(startLord, skipFirst:true))
            {
                var end = cursor.AddYearsPrecise(Y);
                if (currentUtc <= end)
                {
                    mahaLord = L;
                    mahaStart = cursor;
                    mahaEnd = end;
                    break;
                }
                cursor = end;
            }
        }

        // Build antar sequence within current maha
        var mahaYears = GetYears(mahaLord);
        var mahaDurationYears = (mahaEnd - mahaStart).TotalDays / 365.25; // actual remaining for first dasha else full
        DateTime antarStart = mahaStart;
        string antarLord = Order[0].Lord; // default

        foreach (var (subLord, subYears) in CycleFrom(mahaLord, skipFirst:false))
        {
            var antarYears = mahaDurationYears * (subYears / TotalYears);
            var antarEnd = antarStart.AddYearsPrecise(antarYears);
            if (currentUtc <= antarEnd)
            {
                antarLord = subLord;
                return new DashaStatus(
                    mahaLord,
                    new DashaPeriod(mahaLord, mahaStart, mahaEnd),
                    antarLord,
                    new DashaPeriod(antarLord, antarStart, antarEnd));
            }
            antarStart = antarEnd;
        }

        // Fallback: last antar
        return new DashaStatus(
            mahaLord,
            new DashaPeriod(mahaLord, mahaStart, mahaEnd),
            antarLord,
            new DashaPeriod(antarLord, antarStart, mahaEnd));
    }

    private static IEnumerable<(string Lord, double Years)> CycleFrom(string startLord, bool skipFirst)
    {
        int startIdx = Array.FindIndex(Order, o => o.Lord.Equals(startLord, StringComparison.OrdinalIgnoreCase));
        if (startIdx < 0) startIdx = 0;
        for (int i = 0; i < Order.Length * 2; i++) // plenty
        {
            var idx = (startIdx + i) % Order.Length;
            if (skipFirst && i == 0) continue;
            yield return Order[idx];
        }
    }

    private static double GetYears(string lord)
        => Order.First(o => o.Lord.Equals(lord, StringComparison.OrdinalIgnoreCase)).Years;

    private static string GetLordFromLongitude(double moonSiderealLongitudeDeg)
    {
        // Determine nakshatra index (0..26) then lord by repeating order
        int idx = (int)Math.Floor((moonSiderealLongitudeDeg % 360.0) / NakshatraSpanDeg);
        // Lords repeat every 9; mapping per nakshatra order already above, but as a fallback use cycle by index
        var cyc = new[] { "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury" };
        return cyc[idx % cyc.Length];
    }
}

internal static class DateTimeExtensions
{
    public static DateTime AddYearsPrecise(this DateTime dt, double years)
    {
        // Approximate: convert years to days using tropical year length
        var days = years * 365.25;
        return dt.AddDays(days);
    }
}
