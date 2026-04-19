using System.Text.Json;
using AstroAI.Core.Services;

namespace AstroAI.Infrastructure.Services;

// Richer transit endpoints: zodiac grid summaries, detailed per-sign, monthly
public sealed partial class GptAstrologyService
{
    private static readonly string[] ZodiacSigns =
    {
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    };

    private static readonly Dictionary<string, string> ZodiacEmojis = new()
    {
        ["Aries"] = "♈", ["Taurus"] = "♉", ["Gemini"] = "♊", ["Cancer"] = "♋",
        ["Leo"] = "♌", ["Virgo"] = "♍", ["Libra"] = "♎", ["Scorpio"] = "♏",
        ["Sagittarius"] = "♐", ["Capricorn"] = "♑", ["Aquarius"] = "♒", ["Pisces"] = "♓"
    };

    /// <summary>
    /// Returns the approximate Vedic sidereal Sun sign based on the calendar date.
    /// Ingress dates are fixed annual approximations (±1 day).
    /// </summary>
    private static string GetSunSign(DateTime date)
    {
        int m = date.Month, d = date.Day;
        return (m, d) switch
        {
            (4, >= 14) or (5, <= 14) => "Aries",
            (5, >= 15) or (6, <= 14) => "Taurus",
            (6, >= 15) or (7, <= 15) => "Gemini",
            (7, >= 16) or (8, <= 15) => "Cancer",
            (8, >= 16) or (9, <= 15) => "Leo",
            (9, >= 16) or (10, <= 15) => "Virgo",
            (10, >= 16) or (11, <= 14) => "Libra",
            (11, >= 15) or (12, <= 14) => "Scorpio",
            (12, >= 15) or (1, <= 13) => "Sagittarius",
            (1, >= 14) or (2, <= 12) => "Capricorn",
            (2, >= 13) or (3, <= 13) => "Aquarius",
            _ => "Pisces" // Mar 14 – Apr 13
        };
    }

    private static readonly string[] SiderealSignNames =
    {
        "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
        "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
    };

    private static string LonToSign(double siderealDeg)
    {
        siderealDeg = ((siderealDeg % 360) + 360) % 360;
        return SiderealSignNames[(int)(siderealDeg / 30)];
    }

    /// <summary>
    /// Computes real-time Vedic sidereal positions via Swiss Ephemeris + Lahiri ayanamsha
    /// and returns a formatted block for injection into GPT prompts.
    /// </summary>
    private async Task<string> BuildVedicPositionsBlockAsync(DateTime utc, CancellationToken ct)
    {
        var tropical = await _ephemeris.GetTropicalLongitudesAsync(utc, ct);
        double ayanamsha = AyanamshaCalculator.ComputeKpAyanamshaDegrees(utc);
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("CURRENT VEDIC SIDEREAL PLANETARY POSITIONS (computed via Swiss Ephemeris + Lahiri ayanamsha — use these exactly, do NOT override):");
        foreach (var planet in new[] { "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu" })
        {
            if (!tropical.TryGetValue(planet, out double tropLon)) continue;
            double siderealLon = ((tropLon - ayanamsha) % 360 + 360) % 360;
            string sign = LonToSign(siderealLon);
            double degInSign = siderealLon % 30;
            sb.AppendLine($"- {planet}: {sign} ({degInSign:F1}\u00b0 in sign)");
        }
        return sb.ToString().TrimEnd();
    }

    public async Task<IReadOnlyList<ZodiacTransitSummary>> GetAllZodiacSummariesAsync(CancellationToken ct)
    {
        ValidateConfig();
        var url = BuildUrl();
        var today = DateTime.UtcNow;

        var system = "You are an expert Vedic astrologer. Return STRICT JSON only, no prose outside JSON.";
        var vedicPositions = await BuildVedicPositionsBlockAsync(today, ct);
        var user = $@"Today is {today:MMMM dd, yyyy}.

{vedicPositions}

For each of the 12 Vedic zodiac signs, provide a brief 1-sentence transit summary based on the above computed planetary positions (treated as moon signs).
Return STRICT JSON:
{{
  ""summaries"": [
    {{
      ""sign"": string,
      ""summary"": string (1 concise sentence),
      ""dominantPlanet"": string (most influential planet now),
      ""energy"": string (exactly one of: Favorable, Neutral, Challenging)
    }}
  ]
}}
Include all 12 signs in order: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces.";

        var payload = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = system },
                new { role = "user", content = user }
            },
            temperature = 0.3,
        };

        using var req = CreateRequest(url, payload);
        var res = await _http.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"Zodiac summaries failed: {(int)res.StatusCode}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";
        using var result = JsonDocument.Parse(content);
        var root = result.RootElement;

        var list = new List<ZodiacTransitSummary>();
        if (root.TryGetProperty("summaries", out var arr) && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var s in arr.EnumerateArray())
            {
                var sign = s.GetPropertyOrDefault("sign", "");
                list.Add(new ZodiacTransitSummary(
                    Sign: sign,
                    Emoji: ZodiacEmojis.TryGetValue(sign, out var em) ? em : "",
                    Summary: s.GetPropertyOrDefault("summary", ""),
                    DominantPlanet: s.GetPropertyOrDefault("dominantPlanet", ""),
                    Energy: s.GetPropertyOrDefault("energy", "Neutral")));
            }
        }

        return list;
    }

    public async Task<DetailedTransitResponse> GetDetailedTransitAsync(string zodiacSign, CancellationToken ct)
    {
        ValidateConfig();
        var url = BuildUrl();
        var today = DateTime.UtcNow;

        var system = "You are an expert Vedic astrologer. Return STRICT JSON only, no prose outside JSON.";
        var vedicPositions = await BuildVedicPositionsBlockAsync(today, ct);
        var user = $@"Today is {today:MMMM dd, yyyy}. Provide a comprehensive Vedic transit report for {zodiacSign} moon sign.

{vedicPositions}
All 'transitSign' fields in currentTransits MUST exactly match the above computed positions.

Return STRICT JSON exactly matching this structure:
{{
  ""overallEnergy"": string (one of: Favorable, Neutral, Challenging),
  ""energyScore"": number (1-10),
  ""headline"": string (1 compelling line summarizing the period),
  ""currentTransits"": [
    {{
      ""planet"": string,
      ""transitSign"": string (sign it is transiting through),
      ""effect"": string (1-2 sentences on impact for {zodiacSign}),
      ""intensity"": string (one of: High, Medium, Low),
      ""duration"": string (e.g. Until April 2026),
      ""advice"": string (1 actionable sentence)
    }}
  ],
  ""career"": {{""score"": number, ""summary"": string, ""advice"": string}},
  ""love"": {{""score"": number, ""summary"": string, ""advice"": string}},
  ""finance"": {{""score"": number, ""summary"": string, ""advice"": string}},
  ""health"": {{""score"": number, ""summary"": string, ""advice"": string}},
  ""spirituality"": {{""score"": number, ""summary"": string, ""advice"": string}},
  ""weeklyForecast"": [
    {{""day"": string, ""date"": string (MM/DD), ""energy"": string (Good|Neutral|Caution), ""tip"": string}}
  ],
  ""keyPlanets"": [{{""planet"": string, ""role"": string, ""effect"": string}}],
  ""luckyNumbers"": [number, number, number],
  ""luckyColors"": [string, string],
  ""luckyGemstone"": string,
  ""remedies"": [string, string, string],
  ""opportunities"": [string, string, string],
  ""cautionAreas"": [string, string]
}}
weeklyForecast must have exactly 7 entries (Monday through Sunday for the current week).";

        var payload = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = system },
                new { role = "user", content = user }
            },
            temperature = 0.3,
        };

        using var req = CreateRequest(url, payload);
        var res = await _http.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"Detailed transit failed: {(int)res.StatusCode}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";
        using var result = JsonDocument.Parse(content);
        var root = result.RootElement;

        // Parse transits
        var transits = new List<PlanetaryTransit>();
        if (root.TryGetProperty("currentTransits", out var ta) && ta.ValueKind == JsonValueKind.Array)
            foreach (var t in ta.EnumerateArray())
                transits.Add(new PlanetaryTransit(
                    Planet: t.GetPropertyOrDefault("planet", ""),
                    TransitSign: t.GetPropertyOrDefault("transitSign", ""),
                    Effect: t.GetPropertyOrDefault("effect", ""),
                    Intensity: t.GetPropertyOrDefault("intensity", "Medium"),
                    Duration: t.GetPropertyOrDefault("duration", ""),
                    Advice: t.GetPropertyOrDefault("advice", "")));

        // Parse life areas
        static LifeAreaDetail ParseArea(JsonElement r, string key)
        {
            if (!r.TryGetProperty(key, out var a)) return new LifeAreaDetail(5, "", "");
            return new LifeAreaDetail(
                Score: a.GetPropertyOrDefault("score", 5),
                Summary: a.GetPropertyOrDefault("summary", ""),
                Advice: a.GetPropertyOrDefault("advice", ""));
        }

        // Parse weekly forecast
        var weekly = new List<WeekDayForecast>();
        if (root.TryGetProperty("weeklyForecast", out var wf) && wf.ValueKind == JsonValueKind.Array)
            foreach (var d in wf.EnumerateArray())
                weekly.Add(new WeekDayForecast(
                    Day: d.GetPropertyOrDefault("day", ""),
                    Date: d.GetPropertyOrDefault("date", ""),
                    Energy: d.GetPropertyOrDefault("energy", "Neutral"),
                    Tip: d.GetPropertyOrDefault("tip", "")));

        // Parse key planets
        var keyPlanets = new List<KeyPlanetInfo>();
        if (root.TryGetProperty("keyPlanets", out var kp) && kp.ValueKind == JsonValueKind.Array)
            foreach (var p in kp.EnumerateArray())
                keyPlanets.Add(new KeyPlanetInfo(
                    Planet: p.GetPropertyOrDefault("planet", ""),
                    Role: p.GetPropertyOrDefault("role", ""),
                    Effect: p.GetPropertyOrDefault("effect", "")));

        // Parse lucky numbers
        var luckyNums = new List<int>();
        if (root.TryGetProperty("luckyNumbers", out var ln) && ln.ValueKind == JsonValueKind.Array)
            foreach (var n in ln.EnumerateArray())
                if (n.TryGetInt32(out var num)) luckyNums.Add(num);

        // Parse lucky colors
        var luckyColors = new List<string>();
        if (root.TryGetProperty("luckyColors", out var lc) && lc.ValueKind == JsonValueKind.Array)
            foreach (var c in lc.EnumerateArray())
                luckyColors.Add(c.GetString() ?? "");

        static IReadOnlyList<string> ParseStringArray(JsonElement r, string key)
        {
            var list = new List<string>();
            if (r.TryGetProperty(key, out var arr) && arr.ValueKind == JsonValueKind.Array)
                foreach (var item in arr.EnumerateArray())
                    list.Add(item.GetString() ?? "");
            return list;
        }

        return new DetailedTransitResponse(
            Sign: zodiacSign,
            Emoji: ZodiacEmojis.TryGetValue(zodiacSign, out var emoji) ? emoji : "",
            Date: today.ToString("MMMM dd, yyyy"),
            OverallEnergy: root.GetPropertyOrDefault("overallEnergy", "Neutral"),
            EnergyScore: root.GetPropertyOrDefault("energyScore", 5),
            Headline: root.GetPropertyOrDefault("headline", ""),
            CurrentTransits: transits,
            Career: ParseArea(root, "career"),
            Love: ParseArea(root, "love"),
            Finance: ParseArea(root, "finance"),
            Health: ParseArea(root, "health"),
            Spirituality: ParseArea(root, "spirituality"),
            WeeklyForecast: weekly,
            KeyPlanets: keyPlanets,
            LuckyNumbers: luckyNums,
            LuckyColors: luckyColors,
            LuckyGemstone: root.GetPropertyOrDefault("luckyGemstone", ""),
            Remedies: ParseStringArray(root, "remedies"),
            Opportunities: ParseStringArray(root, "opportunities"),
            CautionAreas: ParseStringArray(root, "cautionAreas"));
    }

    public async Task<MonthlyTransitResponse> GetMonthlyTransitAsync(string zodiacSign, CancellationToken ct)
    {
        ValidateConfig();
        var url = BuildUrl();
        var today = DateTime.UtcNow;

        var system = "You are an expert Vedic astrologer. Return STRICT JSON only, no prose outside JSON.";
        var vedicPositions = await BuildVedicPositionsBlockAsync(today, ct);
        var user = $@"Today is {today:MMMM dd, yyyy}. Provide a monthly Vedic transit forecast for {zodiacSign} moon sign for {today:MMMM yyyy}.

{vedicPositions}
For Moon, Mercury, Venus, Mars — use the above computed start-of-day positions and estimate their movement through the month.

Return STRICT JSON:
{{
  ""monthlyTheme"": string,
  ""overallScore"": number (1-10),
  ""weeks"": [
    {{
      ""weekNumber"": number,
      ""dateRange"": string (e.g. Mar 1-7),
      ""theme"": string (1-2 sentences),
      ""highlights"": [string],
      ""challenges"": [string],
      ""energy"": string (one of: Favorable, Neutral, Challenging)
    }}
  ],
  ""importantDates"": [
    {{""date"": string (e.g. Mar 15), ""significance"": string}}
  ],
  ""monthlyAdvice"": string (2-3 sentences)
}}
Include 4 weeks. Include 3-5 important dates.";

        var payload = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = system },
                new { role = "user", content = user }
            },
            temperature = 0.3,
        };

        using var req = CreateRequest(url, payload);
        var res = await _http.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"Monthly transit failed: {(int)res.StatusCode}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";
        using var result = JsonDocument.Parse(content);
        var root = result.RootElement;

        var weeks = new List<MonthlyWeek>();
        if (root.TryGetProperty("weeks", out var wa) && wa.ValueKind == JsonValueKind.Array)
        {
            foreach (var w in wa.EnumerateArray())
            {
                var highlights = new List<string>();
                var challenges = new List<string>();
                if (w.TryGetProperty("highlights", out var ha) && ha.ValueKind == JsonValueKind.Array)
                    foreach (var h in ha.EnumerateArray()) highlights.Add(h.GetString() ?? "");
                if (w.TryGetProperty("challenges", out var ca) && ca.ValueKind == JsonValueKind.Array)
                    foreach (var c in ca.EnumerateArray()) challenges.Add(c.GetString() ?? "");
                weeks.Add(new MonthlyWeek(
                    WeekNumber: w.GetPropertyOrDefault("weekNumber", 1),
                    DateRange: w.GetPropertyOrDefault("dateRange", ""),
                    Theme: w.GetPropertyOrDefault("theme", ""),
                    Highlights: highlights,
                    Challenges: challenges,
                    Energy: w.GetPropertyOrDefault("energy", "Neutral")));
            }
        }

        var importantDates = new List<ImportantDate>();
        if (root.TryGetProperty("importantDates", out var ida) && ida.ValueKind == JsonValueKind.Array)
            foreach (var d in ida.EnumerateArray())
                importantDates.Add(new ImportantDate(
                    Date: d.GetPropertyOrDefault("date", ""),
                    Significance: d.GetPropertyOrDefault("significance", "")));

        return new MonthlyTransitResponse(
            Sign: zodiacSign,
            Month: today.ToString("MMMM yyyy"),
            MonthlyTheme: root.GetPropertyOrDefault("monthlyTheme", ""),
            OverallScore: root.GetPropertyOrDefault("overallScore", 5),
            Weeks: weeks,
            ImportantDates: importantDates,
            MonthlyAdvice: root.GetPropertyOrDefault("monthlyAdvice", ""));
    }
}
