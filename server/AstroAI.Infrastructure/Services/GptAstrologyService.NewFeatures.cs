using System.Text.Json;
using AstroAI.Core.Services;

namespace AstroAI.Infrastructure.Services;

// New feature implementations: Transit Alerts, Muhurat, Gemstone Recommendation
public sealed partial class GptAstrologyService
{
    public async Task<TransitAlertsResponse> GetTransitAlertsAsync(string zodiacSign, CancellationToken ct)
    {
        ValidateConfig();
        var url = BuildUrl();
        var today = DateTime.UtcNow;

        var system = "You are an expert Vedic astrologer. Given a zodiac sign and current date, analyze current planetary transits and their effects. Return STRICT JSON only, no prose outside JSON.";
        var user = $@"Today: {today:yyyy-MM-dd}. Zodiac Sign: {zodiacSign}.

CURRENT VEDIC PLANETARY POSITIONS (verified, use these exactly):
- Saturn: Pisces (transiting Pisces since March 2025, until early 2027)
- Jupiter: Gemini (retrograde back in Gemini, turns direct ~April 2026)
- Rahu (North Node): Aquarius (transiting Aquarius until Oct 2026)
- Ketu (South Node): Leo (always opposite Rahu, until Oct 2026)
- Sun: {GetSunSign(today)} (approximate based on date)
For fast-moving planets (Moon, Mercury, Venus, Mars), compute their approximate position based on today's date {today:MMMM dd, yyyy}.

Using the above confirmed positions, analyze all major planetary transits and their effects on {zodiacSign} moon sign.
Return STRICT JSON:
{{
  ""zodiacSign"": string,
  ""overallTheme"": string (2 sentences summarizing the overall transit influence),
  ""keyOpportunities"": string,
  ""keyChallenges"": string,
  ""transits"": [
    {{
      ""planet"": string,
      ""transitSign"": string,
      ""effect"": string (1-2 sentences),
      ""intensity"": string (one of: High, Medium, Low),
      ""duration"": string (e.g. ""Until March 2026""),
      ""advice"": string (actionable advice, 1 sentence)
    }}
  ]
}}";

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
            throw new HttpRequestException($"Transit alerts failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";
        using var result = JsonDocument.Parse(content);
        var root = result.RootElement;

        var transits = new List<PlanetaryTransit>();
        if (root.TryGetProperty("transits", out var arr) && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var t in arr.EnumerateArray())
            {
                transits.Add(new PlanetaryTransit(
                    Planet: t.GetPropertyOrDefault("planet", ""),
                    TransitSign: t.GetPropertyOrDefault("transitSign", ""),
                    Effect: t.GetPropertyOrDefault("effect", ""),
                    Intensity: t.GetPropertyOrDefault("intensity", "Medium"),
                    Duration: t.GetPropertyOrDefault("duration", ""),
                    Advice: t.GetPropertyOrDefault("advice", "")));
            }
        }

        return new TransitAlertsResponse(
            ZodiacSign: zodiacSign,
            AsOfDate: today,
            OverallTheme: root.GetPropertyOrDefault("overallTheme", ""),
            Transits: transits,
            KeyOpportunities: root.GetPropertyOrDefault("keyOpportunities", ""),
            KeyChallenges: root.GetPropertyOrDefault("keyChallenges", ""));
    }

    public async Task<MuhuratResponse> GetMuhuratTimingsAsync(MuhuratRequest request, CancellationToken ct)
    {
        ValidateConfig();
        var url = BuildUrl();

        var location = string.Join(", ", new[] { request.City, request.State, request.Country }.Where(s => !string.IsNullOrWhiteSpace(s)));
        var system = "You are an expert Vedic astrologer specializing in Muhurat (auspicious timing). Return STRICT JSON only, no prose outside JSON.";
        var user = $@"Activity: {request.ActivityType}
Location: {location}
Date Range: {request.FromDate:yyyy-MM-dd} to {request.ToDate:yyyy-MM-dd}

Identify 3-5 auspicious muhurat windows for the given activity considering: Tithi, Nakshatra, Yoga, Day of week, Hora, Lagna, and avoiding Rahu Kaal, Yamaganda, and Gulika.
Return STRICT JSON:
{{
  ""activityType"": string,
  ""location"": string,
  ""bestDate"": string (YYYY-MM-DD),
  ""bestTime"": string (e.g. ""09:15 AM - 11:00 AM""),
  ""generalAdvice"": string (2-3 sentences of overall guidance for this activity),
  ""windows"": [
    {{
      ""date"": string (YYYY-MM-DD),
      ""startTime"": string (HH:MM AM/PM),
      ""endTime"": string (HH:MM AM/PM),
      ""score"": number (1-10),
      ""planetarySupport"": string (which planets support this window),
      ""auspiciousElements"": string (tithi, nakshatra, yoga that make it auspicious),
      ""reason"": string (1 sentence why this window is good)
    }}
  ]
}}";

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
            throw new HttpRequestException($"Muhurat calculation failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";
        using var result = JsonDocument.Parse(content);
        var root = result.RootElement;

        var windows = new List<MuhuratWindow>();
        if (root.TryGetProperty("windows", out var arr) && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var w in arr.EnumerateArray())
            {
                windows.Add(new MuhuratWindow(
                    Date: w.GetPropertyOrDefault("date", ""),
                    StartTime: w.GetPropertyOrDefault("startTime", ""),
                    EndTime: w.GetPropertyOrDefault("endTime", ""),
                    Score: w.GetPropertyOrDefault("score", 7),
                    PlanetarySupport: w.GetPropertyOrDefault("planetarySupport", ""),
                    AuspiciousElements: w.GetPropertyOrDefault("auspiciousElements", ""),
                    Reason: w.GetPropertyOrDefault("reason", "")));
            }
        }

        return new MuhuratResponse(
            ActivityType: request.ActivityType,
            Location: location,
            BestDate: root.GetPropertyOrDefault("bestDate", ""),
            BestTime: root.GetPropertyOrDefault("bestTime", ""),
            Windows: windows,
            GeneralAdvice: root.GetPropertyOrDefault("generalAdvice", ""));
    }

    public async Task<GemstoneResponse> GetGemstoneRecommendationAsync(
        SouthIndianChart chart,
        DashaStatus dasha,
        CancellationToken ct)
    {
        ValidateConfig();
        var url = BuildUrl();

        var planets = string.Join("; ", chart.Planets.Select(p => $"{p.Name} {p.Sign} H{p.House} Nak:{p.Nakshatra}"));
        var system = "You are a Vedic gemstone expert. Based on the birth chart, recommend gemstones that strengthen benefic planets and protect from malefic influences. Return STRICT JSON only, no prose outside JSON.";
        var user = $@"Ascendant: {chart.AscendantSign}
Planets: {planets}
Current Dasha: {dasha.MahaDashaLord}/{dasha.AntarDashaLord}

Recommend 3-5 gemstones based on this Vedic chart. Consider: lagna lord, dasha lord, yogakarakas, and planets needing strength.
Return STRICT JSON:
{{
  ""chartSummary"": string (2 sentences about key chart features relevant to gemstones),
  ""primaryGemstone"": string (name of the most important gemstone),
  ""generalAdvice"": string (2-3 sentences of overall gemstone guidance),
  ""recommendations"": [
    {{
      ""gemstoneName"": string,
      ""planet"": string (planet it strengthens),
      ""metal"": string (e.g. Gold, Silver, Panchdhatu),
      ""finger"": string (e.g. Ring finger, Index finger),
      ""weight"": string (e.g. 3-5 carats),
      ""benefits"": string (main benefits, 1-2 sentences),
      ""howToWear"": string (day, time, mantra to wear),
      ""bestDay"": string (day of the week to start wearing),
      ""cautions"": string (who should avoid it or precautions),
      ""priority"": number (1 = most important, higher = lower priority)
    }}
  ]
}}";

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
            throw new HttpRequestException($"Gemstone recommendation failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";
        using var result = JsonDocument.Parse(content);
        var root = result.RootElement;

        var recommendations = new List<GemstoneRecommendation>();
        if (root.TryGetProperty("recommendations", out var arr) && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var g in arr.EnumerateArray())
            {
                recommendations.Add(new GemstoneRecommendation(
                    GemstoneName: g.GetPropertyOrDefault("gemstoneName", ""),
                    Planet: g.GetPropertyOrDefault("planet", ""),
                    Metal: g.GetPropertyOrDefault("metal", ""),
                    Finger: g.GetPropertyOrDefault("finger", ""),
                    Weight: g.GetPropertyOrDefault("weight", ""),
                    Benefits: g.GetPropertyOrDefault("benefits", ""),
                    HowToWear: g.GetPropertyOrDefault("howToWear", ""),
                    BestDay: g.GetPropertyOrDefault("bestDay", ""),
                    Cautions: g.GetPropertyOrDefault("cautions", ""),
                    Priority: g.GetPropertyOrDefault("priority", 1)));
            }
        }

        return new GemstoneResponse(
            ChartSummary: root.GetPropertyOrDefault("chartSummary", ""),
            PrimaryGemstone: root.GetPropertyOrDefault("primaryGemstone", ""),
            Recommendations: recommendations.OrderBy(r => r.Priority).ToList(),
            GeneralAdvice: root.GetPropertyOrDefault("generalAdvice", ""));
    }

    // ── helpers ──────────────────────────────────────────────────────────────
    private void ValidateConfig()
    {
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ASTROAI OpenAI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("ASTROAI OpenAI API key is missing.");
    }

    private string BuildUrl() =>
        _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";
}
