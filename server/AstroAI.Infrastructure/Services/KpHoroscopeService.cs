using AstroAI.Core.Services;
using SwissEphNet;

namespace AstroAI.Infrastructure.Services;

public sealed class KpHoroscopeService : IKpHoroscopeService
{
    private readonly IGptLocationService _gpt;
    private readonly IEphemerisService _ephemeris;
    private readonly IGptAstrologyService _gptAstrology;
    private readonly IVimshottariDashaService _vimshottari;

    public KpHoroscopeService(IGptLocationService gpt, IEphemerisService ephemeris, IGptAstrologyService gptAstrology, IVimshottariDashaService vimshottari)
    {
        _gpt = gpt;
        _ephemeris = ephemeris;
        _gptAstrology = gptAstrology;
        _vimshottari = vimshottari;
    }

    public async Task<SouthIndianChart> GenerateSouthIndianChartAsync(BirthChartRequest req, CancellationToken ct)
    {
        var lat = req.Latitude;
        var lon = req.Longitude;
        if (lat is null || lon is null)
        {
            (lat, lon) = await _gpt.GetCoordinatesAsync(req.City, req.State, req.Country, ct);
        }

        // Construct local birth DateTime and convert to UTC using provided or inferred timezone
        var dtLocal = new DateTime(req.BirthDate.Year, req.BirthDate.Month, req.BirthDate.Day,
            req.BirthTime.Hour, req.BirthTime.Minute, req.BirthTime.Second, DateTimeKind.Unspecified);

        // Determine the Windows timezone ID to use for this birth chart.
        // Preference order:
        // 1. Explicit TimeZoneId supplied by client (normalized and alias-mapped).
        // 2. Timezone inferred from coordinates (if available and lookup succeeds).
        // 3. Country-based default: India -> "India Standard Time", everything else -> "UTC".
        var tzId = !string.IsNullOrWhiteSpace(req.TimeZoneId)
            ? NormalizeTimeZoneId(req.TimeZoneId!, req.Country)
            : await LookupTimeZoneFromCoordinatesAsync(lat, lon, req.Country, ct);
        DateTime dtUtc;
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById(tzId);
            dtUtc = TimeZoneInfo.ConvertTimeToUtc(dtLocal, tz);
        }
        catch
        {
            // Fallback: try country default if an invalid timezone id was supplied
            try
            {
                var defaultTz = req.Country.Equals("India", StringComparison.OrdinalIgnoreCase)
                    ? "India Standard Time"
                    : "UTC";
                var tz = TimeZoneInfo.FindSystemTimeZoneById(defaultTz);
                dtUtc = TimeZoneInfo.ConvertTimeToUtc(dtLocal, tz);
            }
            catch
            {
                dtUtc = DateTime.SpecifyKind(dtLocal, DateTimeKind.Utc); // last resort
            }
        }

        // Compute KP ayanamsha (approx). For accuracy, integrate Swiss Ephemeris.
        var ayanamshaDeg = ComputeKpAyanamshaDegrees(dtUtc);

        // Compute tropical longitudes via ephemeris (placeholder implementation for now)
        var longs = await _ephemeris.GetTropicalLongitudesAsync(dtUtc, ct);
        var planets = new List<PlanetPosition>
        {
            new("Sun", longs["Sun"], 0, "", 0, "", "", "", "", ""),
            new("Moon", longs["Moon"], 0, "", 0, "", "", "", "", ""),
            new("Mars", longs["Mars"], 0, "", 0, "", "", "", "", ""),
            new("Mercury", longs["Mercury"], 0, "", 0, "", "", "", "", ""),
            new("Jupiter", longs["Jupiter"], 0, "", 0, "", "", "", "", ""),
            new("Venus", longs["Venus"], 0, "", 0, "", "", "", "", ""),
            new("Saturn", longs["Saturn"], 0, "", 0, "", "", "", "", ""),
            new("Rahu", longs["Rahu"], 0, "", 0, "", "", "", "", ""),
            new("Ketu", longs["Ketu"], 0, "", 0, "", "", "", "", "")
        };

        // Note: special-case overrides removed. Rely on ephemeris for consistent results across all dates.

        // Compute ascendant: tropical from UTC/lat/lon, then sidereal by subtracting ayanamsha
        if (lat is null || lon is null)
        {
            throw new InvalidOperationException("Latitude/Longitude are required to compute ascendant.");
        }
        // Compute tropical ascendant using Swiss Ephemeris for accuracy
        var swe = new SwissEph();
        double jdUt = swe.swe_julday(dtUtc.Year, dtUtc.Month, dtUtc.Day,
            dtUtc.Hour + (dtUtc.Minute + dtUtc.Second / 60.0) / 60.0,
            SwissEph.SE_GREG_CAL);
        var cusp = new double[13];
        var ascmc = new double[10];
        swe.swe_houses_ex(jdUt, SwissEph.SEFLG_SWIEPH | SwissEph.SEFLG_SPEED, lat.Value, lon.Value, 'W', cusp, ascmc);
        var ascTropical = ascmc[SwissEph.SE_ASC];
        var ascSidereal = NormalizeDegrees(ascTropical - ayanamshaDeg);
        var ascSignIndex = (int)(ascSidereal / 30.0);

        for (var i = 0; i < planets.Count; i++)
        {
            var sidereal = NormalizeDegrees(planets[i].Longitude - ayanamshaDeg);
            var signIndex = (int)(sidereal / 30.0);
            var signName = SignNames[signIndex];
            // House number relative to ascendant (whole-sign houses)
            var house = ((signIndex - ascSignIndex + 12) % 12) + 1;

            var rlNlSl = GetRlNlSlData(sidereal);
            planets[i] = planets[i] with
            {
                SiderealLongitude = sidereal,
                Sign = signName,
                House = house,
                RasiLord = rlNlSl.RasiLord,
                Nakshatra = rlNlSl.Nakshatra,
                NakshatraLord = rlNlSl.NakshatraLord,
                SubLord = rlNlSl.SubLord,
                SubSubLord = rlNlSl.SubSubLord
            };
        }

        // South Indian chart: signs are fixed; houses rotate so House 1 is the ascendant sign
        var houses = Enumerable.Range(0, 12)
            .Select(n =>
            {
                var signIdx = (ascSignIndex + n) % 12;
                var signName = SignNames[signIdx];
                var occPlanets = planets.Where(p => (int)(p.SiderealLongitude / 30.0) == signIdx).ToList();
                var occupants = occPlanets.Select(p => p.Name).ToArray();

                // Prefer Moon's nakshatra for the house if Moon is an occupant; otherwise use cusp
                double basisDeg;
                var moonOcc = occPlanets.FirstOrDefault(p => p.Name == "Moon");
                if (moonOcc is not null)
                {
                    basisDeg = moonOcc.SiderealLongitude;
                }
                else
                {
                    // Whole-sign house cusp at start of sign
                    basisDeg = signIdx * 30.0;
                }
                var rlNlSl = GetRlNlSlData(basisDeg);

                return new House(
                    Number: n + 1,
                    Sign: signName,
                    Occupants: occupants,
                    RasiLord: rlNlSl.RasiLord,
                    Nakshatra: rlNlSl.Nakshatra,
                    NakshatraLord: rlNlSl.NakshatraLord,
                    SubLord: rlNlSl.SubLord,
                    SubSubLord: rlNlSl.SubSubLord);
            })
            .ToList();

        return new SouthIndianChart(
            AyanamshaName: "Krishnamurthi (KP)",
            AyanamshaDegrees: ayanamshaDeg,
            AscendantSiderealLongitude: ascSidereal,
            AscendantSign: SignNames[ascSignIndex],
            BirthDateTimeUtc: dtUtc,
            CurrentDateTimeUtc: DateTime.UtcNow,
            Houses: houses,
            Planets: planets
        );
    }

    public async Task<AskQuestionResponse> AskQuestionAsync(AskQuestionRequest req, CancellationToken ct)
    {
        // Reuse the same birth time, coordinate, and timezone logic as GenerateSouthIndianChartAsync
        var chart = await GenerateSouthIndianChartAsync(
            new BirthChartRequest(
                City: req.City,
                State: req.State,
                Country: req.Country,
                BirthDate: req.BirthDate,
                BirthTime: req.BirthTime,
                Latitude: req.Latitude,
                Longitude: req.Longitude,
                TimeZoneId: req.TimeZoneId),
            ct);

        // For now, approximate age in years based on birth vs current UTC
        var nowUtc = chart.CurrentDateTimeUtc;
        var ageYears = nowUtc.Year - chart.BirthDateTimeUtc.Year;
        if (nowUtc < chart.BirthDateTimeUtc.AddYears(ageYears)) ageYears--;

    // Use real Vimshottari dasha service to compute current dasha status based on Moon position.
    var moon = chart.Planets.FirstOrDefault(p => p.Name == "Moon");
    var moonLon = moon?.SiderealLongitude ?? 0;
    var moonNak = moon?.Nakshatra ?? "";
    var dasha = _vimshottari.ComputeCurrent(chart.BirthDateTimeUtc, chart.CurrentDateTimeUtc, moonLon, moonNak);

        var payload = new AskQuestionPayload(
            AyanamshaName: chart.AyanamshaName,
            AyanamshaDegrees: chart.AyanamshaDegrees,
            AscendantSign: chart.AscendantSign,
            AscendantSiderealLongitude: chart.AscendantSiderealLongitude,
            BirthDateTimeUtc: chart.BirthDateTimeUtc,
            CurrentDateTimeUtc: chart.CurrentDateTimeUtc,
            Houses: chart.Houses,
            Planets: chart.Planets,
            Dasha: dasha,
            AgeYears: ageYears,
            Question: req.Question);

        return await _gptAstrology.AnswerQuestionAsync(payload, ct);
    }

    private static double ComputeKpAyanamshaDegrees(DateTime utc)
    {
        // Compute ayanamsha using polynomial approximation aligned with Lahiri (KP practice).
        return AyanamshaCalculator.ComputeKpAyanamshaDegrees(utc);
    }

    private static int SouthIndianHouseFromSign(int signIndex) => signIndex + 1; // placeholder

    private static double NormalizeDegrees(double deg)
    {
        deg %= 360.0;
        return deg < 0 ? deg + 360.0 : deg;
    }

    private static readonly string[] SignNames =
    {
        "Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra",
        "Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
    };

    private static string NormalizeTimeZoneId(string tzId, string country)
    {
        if (string.IsNullOrWhiteSpace(tzId))
            return country.Equals("India", StringComparison.OrdinalIgnoreCase) ? "India Standard Time" : "UTC";

        // Common aliases and typos -> Windows TZ IDs
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "Indian Standard Time", "India Standard Time" },
            { "IST", "India Standard Time" },
            { "US/Eastern", "Eastern Standard Time" },
            { "US/Pacific", "Pacific Standard Time" },
            { "US/Central", "Central Standard Time" },
            { "EST", "Eastern Standard Time" },
            { "PST", "Pacific Standard Time" },
            { "CST", "Central Standard Time" }
        };
        if (map.TryGetValue(tzId, out var winId)) return winId;
        return tzId;
    }

    /// <summary>
    /// Best-effort inference of a Windows timezone ID based on coordinates using IGptLocationService.
    ///
    /// If coordinates are missing or the GPT call fails/returns nothing, falls back to the
    /// previous country-based default behavior: India -> "India Standard Time", everything else -> "UTC".
    /// </summary>
    private async Task<string> LookupTimeZoneFromCoordinatesAsync(double? lat, double? lon, string country, CancellationToken ct)
    {
        // If coordinates are missing we cannot do better than the country default.
        if (lat is null || lon is null)
        {
            return country.Equals("India", StringComparison.OrdinalIgnoreCase)
                ? "India Standard Time"
                : "UTC";
        }

        try
        {
            var tz = await _gpt.GetWindowsTimeZoneIdAsync(lat.Value, lon.Value, country, ct);
            if (!string.IsNullOrWhiteSpace(tz))
            {
                // Normalize any aliases or typos the model might return.
                return NormalizeTimeZoneId(tz!, country);
            }
        }
        catch
        {
            // Ignore GPT-related failures and fall back below.
        }

        return country.Equals("India", StringComparison.OrdinalIgnoreCase)
            ? "India Standard Time"
            : "UTC";
    }

    // RL/NL/SL computation helpers based on provided Python logic
    private sealed record RlNlSl(string RasiLord, string Nakshatra, string NakshatraLord, string SubLord, string SubSubLord);

    private static RlNlSl GetRlNlSlData(double siderealDeg)
    {
        // Work in 0..360 sidereal degrees
        var deg = NormalizeDegrees(siderealDeg);

        // Sign index and Rasi lord
        var signIndex = (int)(deg / 30.0);
        var rasiLord = SignLords[signIndex];

        // Nakshatra index and pada
        const double nakSize = 13.333333333333334; // 13°20'
        var nakIndex = (int)(deg / nakSize) % Nakshatras.Length;
        var nakshatra = Nakshatras[nakIndex];

        // Nakshatra lords pattern (9-sequence repeated across 27)
        var starLords = NineLordsRepeated;
        var nakshatraLord = starLords[nakIndex];

        // Sub-lord and sub-sub computation using durations
        var dur = NineDurations; // [7,20,6,10,7,18,16,19,17]

        // Normalize deg to 0..120 for the SL/SSL computation loop
        var deg120 = deg - 120.0 * (int)(deg / 120.0);
        double degcum = 0.0;
        for (int i = 0; i < 9; i++)
        {
            var deg_nl = 360.0 / 27.0; // 13°20'
            int j = i;
            while (true)
            {
                var deg_sl = deg_nl * dur[j] / 120.0;
                int k = j;
                while (true)
                {
                    var deg_ss = deg_sl * dur[k] / 120.0;
                    degcum += deg_ss;
                    if (degcum >= deg120)
                    {
                        var subLord = NineLords[j];
                        var subSubLord = NineLords[k];
                        return new RlNlSl(rasiLord, nakshatra, nakshatraLord, subLord, subSubLord);
                    }
                    k = (k + 1) % 9;
                    if (k == j) break;
                }
                j = (j + 1) % 9;
                if (j == i) break;
            }
        }
        // Fallback
        return new RlNlSl(rasiLord, nakshatra, nakshatraLord, NineLords[0], NineLords[0]);
    }

    private static readonly string[] SignLords =
    {
        "Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"
    };
    private static readonly string[] Nakshatras =
    {
        "Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra","Punarvasu","Pushya","Ashlesha",
        "Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
        "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"
    };
    private static readonly int[] NineDurations = { 7, 20, 6, 10, 7, 18, 16, 19, 17 };
    private static readonly string[] NineLords = { "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury" };
    private static readonly string[] NineLordsRepeated = RepeatLords(NineLords, 3);

    private static string[] RepeatLords(string[] arr, int times)
    {
        var list = new List<string>(arr.Length * times);
        for (int t = 0; t < times; t++) list.AddRange(arr);
        return list.ToArray();
    }
}
