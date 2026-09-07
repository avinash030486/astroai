using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Net;
using Microsoft.Extensions.Options;
using AstroAI.Core.Services;
using AstroAI.Core.Configuration;

namespace AstroAI.Infrastructure.Services;

public sealed partial class GptAstrologyService : IGptAstrologyService
{
    private readonly HttpClient _http;
    private readonly string _endpoint;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly string _imageModel;
    private readonly string _geminiApiKey;
    private readonly IEphemerisService _ephemeris;

    public GptAstrologyService(IHttpClientFactory httpFactory, IOptions<AstroAiSettings> options, IEphemerisService ephemeris)
    {
        _http = httpFactory.CreateClient("AstroAI.Default");
        // Premium detailed predictions may run longer; lift timeout to 240 seconds
        _http.Timeout = TimeSpan.FromSeconds(240);
        var s = options.Value ?? throw new InvalidOperationException("AstroAI settings are not configured.");
        _endpoint = s.OpenAIEndpoint;
        _apiKey = s.OpenAIApiKey;
        _model = string.IsNullOrWhiteSpace(s.ModelId) ? "gpt-5.1" : s.ModelId;
        _imageModel = string.IsNullOrWhiteSpace(s.ImageModelId) ? "gpt-image-2" : s.ImageModelId;
        _geminiApiKey = s.GeminiApiKey;
        _ephemeris = ephemeris;
    }

    public Task<string> GenerateNatalReadingAsync(string fullName, DateOnly birthDate, TimeOnly birthTime, string birthPlace, string focusArea, CancellationToken ct)
        => SendTextAsync($"Create a friendly natal reading for {fullName} born {birthDate} {birthTime} in {birthPlace}, focusing on {focusArea}. Include disclaimers.", ct);

    public Task<string> GenerateHoroscopeAsync(string zodiacSign, string period, CancellationToken ct)
        => SendTextAsync($"Generate a {period} horoscope for {zodiacSign} with practical tips and a short summary.", ct);

    public async Task<BasicChartPredictionResponse> GenerateBasicChartPredictionAsync(BasicChartPredictionRequest chart, DashaStatus dasha, int ageYears, CancellationToken ct)
    {
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ASTROAI OpenAI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("ASTROAI OpenAI API key is missing.");

        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        var payload = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = "You are an expert Vedic astrologer. Analyze the chart and dasha details and return STRICT JSON only. Keep language crisp; narrative must be <= 350 characters. No emojis, no headings, no extra prose outside JSON." },
                new { role = "user", content = BuildChartPrompt(chart, dasha, ageYears) }
            },
        };

        var res = await SendWithRetryAsync(() => CreateRequest(url, payload), ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode) throw new HttpRequestException($"GPT prediction failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";

        using var result = JsonDocument.Parse(content);
        var root = result.RootElement;
        // Parse with tolerances
        var resp = new BasicChartPredictionResponse(
            AgeYears: ageYears,
            AscendantSummary: root.GetPropertyOrDefault("ascendantSummary", ""),
            PlanetaryHighlights: root.GetArrayOrDefault("planetaryHighlights"),
            CurrentDasha: root.GetPropertyOrDefault("currentDasha", dasha.MahaDashaLord),
            CurrentAntarDasha: root.GetPropertyOrDefault("currentAntarDasha", dasha.AntarDashaLord),
            DashaEffects: root.GetPropertyOrDefault("dashaEffects", ""),
            AntarEffects: root.GetPropertyOrDefault("antarEffects", ""),
            MahaStartUtc: dasha.MahaPeriod.StartUtc,
            MahaEndUtc: dasha.MahaPeriod.EndUtc,
            AntarStartUtc: dasha.AntarPeriod.StartUtc,
            AntarEndUtc: dasha.AntarPeriod.EndUtc,
            Narrative: root.GetPropertyOrDefault("narrative", ""));

        // Ensure concise narrative: cap at 350 characters
        if (string.IsNullOrWhiteSpace(resp.Narrative) || resp.Narrative.Length > 350)
        {
            var compact = await SendTextAsync(
                $"Rewrite the following analysis into one concise narrative of at most 350 characters. No emojis, no headings, no line breaks. Text: {resp.Narrative}",
                ct);
            var cleaned = (compact ?? string.Empty).Replace('\n', ' ').Trim();
            if (cleaned.Length > 350) cleaned = cleaned[..350].TrimEnd();
            if (!string.IsNullOrWhiteSpace(cleaned))
                resp = resp with { Narrative = cleaned };
        }
        return resp;
    }

    public async Task<DetailedChartPredictionResponse> GenerateDetailedPredictionAsync(BasicChartPredictionRequest chart, DashaStatus dasha, int ageYears, CancellationToken ct)
    {
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ASTROAI OpenAI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("ASTROAI OpenAI API key is missing.");

        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        var payload = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = "You are an expert Vedic astrologer. Produce a DETAILED prediction in STRICT JSON only, including Career, Finance, Relationships (with marriage timing), Destiny, all good/bad Yogas, and remedies for bad Yogas. Base analysis on chart and Vimshottari periods." },
                new { role = "user", content = BuildDetailedPrompt(chart, dasha, ageYears) }
            },
        };

        var res = await SendWithRetryAsync(() => CreateRequest(url, payload), ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode) throw new HttpRequestException($"GPT detailed prediction failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";

        using var result = JsonDocument.Parse(content);
        var root = result.RootElement;

        var resp = new DetailedChartPredictionResponse(
            AgeYears: ageYears,
            AscendantSummary: root.GetPropertyOrDefault("ascendantSummary", ""),
            Career: root.GetPropertyOrDefault("career", ""),
            Finance: root.GetPropertyOrDefault("finance", ""),
            Relationships: root.GetPropertyOrDefault("relationships", ""),
            Destiny: root.GetPropertyOrDefault("destiny", ""),
            JobWindow: root.GetPropertyOrDefault("jobWindow", ""),
            MarriageWindow: root.GetPropertyOrDefault("marriageWindow", ""),
            GoodYogas: root.GetArrayOrDefault("goodYogas"),
            BadYogas: root.GetArrayOrDefault("badYogas"),
            Remedies: root.GetArrayOrDefault("remedies"),
            CurrentDasha: root.GetPropertyOrDefault("currentDasha", dasha.MahaDashaLord),
            CurrentAntarDasha: root.GetPropertyOrDefault("currentAntarDasha", dasha.AntarDashaLord),
            DashaEffects: root.GetPropertyOrDefault("dashaEffects", ""),
            AntarEffects: root.GetPropertyOrDefault("antarEffects", ""),
            MahaStartUtc: dasha.MahaPeriod.StartUtc,
            MahaEndUtc: dasha.MahaPeriod.EndUtc,
            AntarStartUtc: dasha.AntarPeriod.StartUtc,
            AntarEndUtc: dasha.AntarPeriod.EndUtc,
            Narrative: root.GetPropertyOrDefault("narrative", ""));

        return resp;
    }

    public async Task<AskQuestionResponse> AnswerQuestionAsync(AskQuestionPayload payload, CancellationToken ct)
    {
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ASTROAI OpenAI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("ASTROAI OpenAI API key is missing.");

        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        var systemPrompt =
            "You are an experienced Vedic astrologer. You receive a structured KP-style chart summary, current Vimshottari dasha " +
            "information, and ONE specific question from the native. You must answer ONLY that question using Vedic logic. " +
            "You NEVER give medical, legal, or lottery advice. Be encouraging but realistic. Respond as STRICT JSON only with this schema: " +
            "{\\\"summary\\\": string, \\\"answer\\\": string, \\\"cautions\\\": string}. No prose outside JSON.";

        var userPayload = new
        {
            chart = new
            {
                payload.AyanamshaName,
                payload.AyanamshaDegrees,
                payload.AscendantSign,
                payload.AscendantSiderealLongitude,
                payload.BirthDateTimeUtc,
                payload.CurrentDateTimeUtc,
                Houses = payload.Houses,
                Planets = payload.Planets,
                Dasha = payload.Dasha,
                AgeYears = payload.AgeYears
            },
            question = payload.Question
        };

        var request = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = JsonSerializer.Serialize(userPayload) }
            },
        };

        var res = await SendWithRetryAsync(() => CreateRequest(url, request), ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"GPT ask-question failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";

        using var parsed = JsonDocument.Parse(content);
        var root = parsed.RootElement;

        static string S(JsonElement e, string name, string fallback)
            => e.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.String ? (p.GetString() ?? fallback) : fallback;

        return new AskQuestionResponse(
            Summary: S(root, "summary", ""),
            Answer: S(root, "answer", ""),
            Cautions: S(root, "cautions", ""));
    }

    private async Task<string> SendTextAsync(string prompt, CancellationToken ct)
    {
        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";
        var payload = new
        {
            model = _model,
            messages = new object[] {
                new { role = "system", content = "You are a helpful astrology assistant." },
                new { role = "user", content = prompt }
            }
        };
        var res = await SendWithRetryAsync(() => CreateRequest(url, payload), ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode) throw new HttpRequestException($"GPT request failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");
        using var doc = JsonDocument.Parse(body);
        return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? string.Empty;
    }

    public async Task<DailyPredictionsResponse> GetDailyPredictionsAsync(CancellationToken ct)
    {
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ASTROAI OpenAI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("ASTROAI OpenAI API key is missing.");

        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        var today = DateTime.UtcNow;
    var schema = "Return STRICT JSON: {\"dateUtc\": string ISO-8601, \"predictions\": [{\"sign\": string, \"career\": string, \"money\": string, \"love\": string}]} including all 12 signs from Aries through Pisces. Each field must be max two short lines, crisp, no emojis, no headings.";

        var payload = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = "You are an expert Vedic astrologer. Generate DAILY predictions as STRICT JSON only for each sign, with three categories: Career, Money, Love. Keep each category to max two short lines, based on current date, general planetary positions and Moon sign tendencies. No prose outside JSON." },
                new { role = "user", content = $"Date: {today:yyyy-MM-dd}. Produce daily predictions for all 12 zodiac signs (Aries..Pisces) considering typical Moon transit influences and planetary positions for the day, grouped under Career, Money, Love. {schema}" }
            },
        };

        var res = await SendWithRetryAsync(() => CreateRequest(url, payload), ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode) throw new HttpRequestException($"GPT daily predictions failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";

        using var result = JsonDocument.Parse(content);
        var root = result.RootElement;

        var list = new List<DailyPrediction>();
        if (root.TryGetProperty("predictions", out var arr) && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in arr.EnumerateArray())
            {
                var sign = item.TryGetProperty("sign", out var s) && s.ValueKind == JsonValueKind.String ? s.GetString() ?? string.Empty : string.Empty;
                var career = item.TryGetProperty("career", out var c) && c.ValueKind == JsonValueKind.String ? c.GetString() ?? string.Empty : string.Empty;
                var money = item.TryGetProperty("money", out var m) && m.ValueKind == JsonValueKind.String ? m.GetString() ?? string.Empty : string.Empty;
                var love = item.TryGetProperty("love", out var l) && l.ValueKind == JsonValueKind.String ? l.GetString() ?? string.Empty : string.Empty;
                if (!string.IsNullOrWhiteSpace(sign))
                    list.Add(new DailyPrediction(sign, career, money, love));
            }
        }

        var dateUtc = today;
        if (root.TryGetProperty("dateUtc", out var d) && d.ValueKind == JsonValueKind.String)
        {
            if (DateTime.TryParse(d.GetString() ?? string.Empty, out var parsed))
                dateUtc = DateTime.SpecifyKind(parsed, DateTimeKind.Utc);
        }

        return new DailyPredictionsResponse(dateUtc, list);
    }

    // Helper: ask the model for STRICT JSON content
    private async Task<JsonDocument> AskJsonAsync(string system, string user, CancellationToken ct)
    {
        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        var payload = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = system },
                new { role = "user", content = user }
            },
            temperature = 0.2
        };

        var res = await SendWithRetryAsync(() => CreateRequest(url, payload), ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"GPT JSON request failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";
        return JsonDocument.Parse(content);
    }

    public async Task<DailyPanchangResponse> GetDailyPanchangAsync(string location, DateTime? dateUtc, CancellationToken ct)
    {
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ASTROAI OpenAI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("ASTROAI OpenAI API key is missing.");

        var date = (dateUtc ?? DateTime.UtcNow.Date);

    // 1) Geocode via model
    var geoSystem = "You convert a place string to precise WGS84 coordinates. Respond ONLY strict JSON: {\"latitude\": number, \"longitude\": number, \"resolvedLocation\": string}. The resolvedLocation must be a HUMAN-READABLE place label (city/region/country), not raw coordinates. No prose outside JSON.";
    var geoUser = $"Place: \"{location}\". Return coordinates with 4+ decimal precision and a friendly resolvedLocation like 'Harrisburg, PA, USA'.";
        using var geo = await AskJsonAsync(geoSystem, geoUser, ct);
        var geoRoot = geo.RootElement;
        double lat = geoRoot.TryGetProperty("latitude", out var la) && la.ValueKind==JsonValueKind.Number ? la.GetDouble() : 0;
        double lon = geoRoot.TryGetProperty("longitude", out var lo) && lo.ValueKind==JsonValueKind.Number ? lo.GetDouble() : 0;
        var label = geoRoot.TryGetProperty("resolvedLocation", out var rl) ? (rl.GetString() ?? location) : location;

        // 2) Panchang JSON via model
        var panSystem =
            "You are a Vedic Panchang generator. Given date (UTC) and geo coordinates, return STRICT JSON: {\"dateUtc\": string ISO, \"weekday\": string, \"tithi\": string, \"nakshatra\": string, \"yoga\": string, \"karana\": string, \"moonSign\": string, \"sunSign\": string, \"locationLabel\": string, \"times\": {\"sunrise\": string, \"sunset\": string, \"moonrise\": string, \"moonset\": string, \"rahuKaal\": string, \"yamaganda\": string, \"gulika\": string, \"abhijitMuhurta\": string}, \"notes\": string}. The locationLabel must be a concise HUMAN-READABLE place (city/region/country), not raw coordinates or timezone offsets. Use civil approximations if exact almanac data is unavailable; keep values concise. No prose outside JSON.";
        var panUser = $"Compute Panchang for {{ \"dateUtc\": \"{date:O}\", \"latitude\": {lat}, \"longitude\": {lon}, \"location\": \"{label}\" }}. Times in local clock (HH:mm). Return locationLabel as a friendly place like 'Harrisburg, PA, USA'.";
        using var pan = await AskJsonAsync(panSystem, panUser, ct);
        var root = pan.RootElement;

        static string S(JsonElement e, string k) => e.TryGetProperty(k, out var v) ? (v.GetString() ?? string.Empty) : string.Empty;
        var timesEl = root.TryGetProperty("times", out var tEl) ? tEl : default;
        static string TS(JsonElement e, string k) => e.ValueKind==JsonValueKind.Object && e.TryGetProperty(k, out var v) ? (v.GetString() ?? string.Empty) : string.Empty;

        var outDate = date;
        if (root.TryGetProperty("dateUtc", out var dEl) && DateTime.TryParse(dEl.GetString(), out var parsed)) outDate = parsed;

        // Prefer Panchang model's own resolved location label when available,
        // but fall back to geocoder label if it looks like raw coordinates.
        string NormalizeLabel(string candidate, string fallback)
        {
            candidate = candidate?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(candidate)) return fallback;

            // Heuristic: if it matches a lat,lon pattern or starts with a digit and comma,
            // treat it as coordinates rather than a human-readable label.
            var coordPattern = System.Text.RegularExpressions.Regex.Match(candidate, @"^\s*-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?");
            if (coordPattern.Success) return fallback;

            return candidate;
        }

        var rawLocationLabel = root.TryGetProperty("locationLabel", out var locEl) && locEl.ValueKind == JsonValueKind.String
            ? locEl.GetString() ?? string.Empty
            : string.Empty;

        var locationLabel = NormalizeLabel(rawLocationLabel, label);

        return new DailyPanchangResponse(
            DateUtc: outDate,
            Coordinates: new GeoPoint(lat, lon, locationLabel),
            Weekday: S(root, "weekday"),
            Tithi: S(root, "tithi"),
            Nakshatra: S(root, "nakshatra"),
            Yoga: S(root, "yoga"),
            Karana: S(root, "karana"),
            MoonSign: S(root, "moonSign"),
            SunSign: S(root, "sunSign"),
            Times: new PanchangTimes(
                Sunrise: TS(timesEl, "sunrise"),
                Sunset: TS(timesEl, "sunset"),
                Moonrise: TS(timesEl, "moonrise"),
                Moonset: TS(timesEl, "moonset"),
                RahuKaal: TS(timesEl, "rahuKaal"),
                Yamaganda: TS(timesEl, "yamaganda"),
                Gulika: TS(timesEl, "gulika"),
                AbhijitMuhurta: TS(timesEl, "abhijitMuhurta")
            ),
            Notes: S(root, "notes")
        );
    }

    private static string BuildChartPrompt(BasicChartPredictionRequest chart, DashaStatus dasha, int ageYears)
    {
    // Provide structured data and ask for strict JSON response schema
    var schema = "Return STRICT JSON: {\"ascendantSummary\": string, \"planetaryHighlights\": string[], \"currentDasha\": string, \"currentAntarDasha\": string, \"dashaEffects\": string, \"antarEffects\": string, \"narrative\": string (<=350 chars)}. No prose outside JSON.";
        var houses = string.Join("; ", chart.Houses.Select(h => $"House {h.Number} {h.Sign} occ: [{string.Join(",", h.Occupants)}] RL:{h.RasiLord} Nak:{h.Nakshatra} NL:{h.NakshatraLord} SL:{h.SubLord}"));
        var planets = string.Join("; ", chart.Planets.Select(p => $"{p.Name} {p.Sign} H{p.House} Sid:{p.SiderealLongitude:F2} Nak:{p.Nakshatra} SL:{p.SubLord}"));
        return $"Age:{ageYears}. Asc:{chart.AscendantSign}({chart.AscendantSiderealLongitude:F2}) Ayanamsha:{chart.AyanamshaName}({chart.AyanamshaDegrees:F4}). Houses: {houses}. Planets: {planets}. Current Maha:{dasha.MahaDashaLord} [{dasha.MahaPeriod.StartUtc:yyyy-MM-dd}..{dasha.MahaPeriod.EndUtc:yyyy-MM-dd}], Antar:{dasha.AntarDashaLord} [{dasha.AntarPeriod.StartUtc:yyyy-MM-dd}..{dasha.AntarPeriod.EndUtc:yyyy-MM-dd}]. {schema}";
    }

    private static string BuildDetailedPrompt(BasicChartPredictionRequest chart, DashaStatus dasha, int ageYears)
    {
        var schema = "Return STRICT JSON: {\"ascendantSummary\": string, \"career\": string, \"finance\": string, \"relationships\": string, \"destiny\": string, \"jobWindow\": string, \"marriageWindow\": string, \"goodYogas\": string[], \"badYogas\": string[], \"remedies\": string[], \"currentDasha\": string, \"currentAntarDasha\": string, \"dashaEffects\": string, \"antarEffects\": string, \"narrative\": string}. No prose outside JSON.";
        var houses = string.Join("; ", chart.Houses.Select(h => $"H{h.Number} {h.Sign} occ:[{string.Join(",", h.Occupants)}] RL:{h.RasiLord} Nak:{h.Nakshatra} NL:{h.NakshatraLord} SL:{h.SubLord}"));
        var planets = string.Join("; ", chart.Planets.Select(p => $"{p.Name} {p.Sign} H{p.House} Sid:{p.SiderealLongitude:F2} Nak:{p.Nakshatra} SL:{p.SubLord}"));
        return $"Age:{ageYears}. Asc:{chart.AscendantSign}({chart.AscendantSiderealLongitude:F2}) Ayanamsha:{chart.AyanamshaName}({chart.AyanamshaDegrees:F4}). Houses:{houses}. Planets:{planets}. Current Maha:{dasha.MahaDashaLord} [{dasha.MahaPeriod.StartUtc:yyyy-MM-dd}..{dasha.MahaPeriod.EndUtc:yyyy-MM-dd}], Antar:{dasha.AntarDashaLord} [{dasha.AntarPeriod.StartUtc:yyyy-MM-dd}..{dasha.AntarPeriod.EndUtc:yyyy-MM-dd}]. {schema}";
    }

    private HttpRequestMessage CreateRequest(string url, object payload)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, url);
        if (_endpoint.Contains("api.openai.com", StringComparison.OrdinalIgnoreCase))
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        else
            req.Headers.Add("api-key", _apiKey);
        req.Content = JsonContent.Create(payload);
        return req;
    }

    private static bool IsTransientStatusCode(HttpStatusCode statusCode)
    {
        return statusCode is HttpStatusCode.RequestTimeout
            or HttpStatusCode.TooManyRequests
            or HttpStatusCode.InternalServerError
            or HttpStatusCode.BadGateway
            or HttpStatusCode.ServiceUnavailable
            or HttpStatusCode.GatewayTimeout;
    }

    private async Task<HttpResponseMessage> SendWithRetryAsync(
        Func<HttpRequestMessage> requestFactory,
        CancellationToken ct,
        int maxAttempts = 3,
        int initialDelayMs = 300)
    {
        var delayMs = initialDelayMs;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                using var req = requestFactory();
                var res = await _http.SendAsync(req, ct);

                if (IsTransientStatusCode(res.StatusCode) && attempt < maxAttempts)
                {
                    var delay = res.Headers.RetryAfter?.Delta ?? TimeSpan.FromMilliseconds(delayMs);
                    res.Dispose();
                    await Task.Delay(delay, ct);
                    delayMs *= 2;
                    continue;
                }

                return res;
            }
            catch (TaskCanceledException) when (!ct.IsCancellationRequested && attempt < maxAttempts)
            {
                await Task.Delay(delayMs, ct);
                delayMs *= 2;
            }
            catch (HttpRequestException) when (attempt < maxAttempts)
            {
                await Task.Delay(delayMs, ct);
                delayMs *= 2;
            }
        }

        using var lastReq = requestFactory();
        return await _http.SendAsync(lastReq, ct);
    }
}

internal static class JsonHelpers
{
    public static string GetPropertyOrDefault(this JsonElement e, string name, string fallback)
        => e.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.String ? p.GetString() ?? fallback : fallback;
    
    public static int GetPropertyOrDefault(this JsonElement e, string name, int fallback)
        => e.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.Number && p.TryGetInt32(out var val) ? val : fallback;
    
    public static List<string> GetArrayOrDefault(this JsonElement e, string name)
    {
        if (e.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.Array)
        {
            var list = new List<string>();
            foreach (var item in p.EnumerateArray())
            {
                if (item.ValueKind == JsonValueKind.String) list.Add(item.GetString() ?? string.Empty);
            }
            return list;
        }
        return new List<string>();
    }
}

// Extended methods for new features
public sealed partial class GptAstrologyService
{
    public async Task<MatchmakingResponse> GenerateMatchmakingAnalysisAsync(
        SouthIndianChart person1Chart,
        SouthIndianChart person2Chart,
        DashaStatus person1Dasha,
        DashaStatus person2Dasha,
        string person1Name,
        string person2Name,
        CancellationToken ct)
    {
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ASTROAI OpenAI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("ASTROAI OpenAI API key is missing.");

        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        var systemPrompt = @"You are an expert Vedic astrology matchmaking analyst. Analyze two birth charts for marriage compatibility using:
1. Kuta/Guna Milan system (36 points total)
2. Synastry analysis (planetary interactions between charts)
3. Dasha compatibility (timing of life periods)
4. Manglik dosha considerations
5. 7th house and Venus analysis

Provide practical, encouraging guidance. Return STRICT JSON with schema:
{
  ""overallScore"": number (0-100),
  ""compatibilityLevel"": string (Excellent/Very Good/Good/Fair/Challenging),
  ""synastryAnalysis"": string (2-3 sentences),
  ""areasOfCompatibility"": [{""name"": string, ""score"": number, ""analysis"": string}],
  ""strengths"": [string],
  ""challenges"": [string],
  ""recommendations"": [string],
  ""nextSteps"": string,
  ""kutaScore"": string (e.g. ""28/36""),
  ""kutaBreakdown"": [{""name"": string, ""points"": number, ""maxPoints"": number, ""description"": string}]
}";

        var person1Summary = BuildChartSummaryForMatching(person1Chart, person1Dasha, person1Name);
        var person2Summary = BuildChartSummaryForMatching(person2Chart, person2Dasha, person2Name);

        var payload = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = $"Person 1:\n{person1Summary}\n\nPerson 2:\n{person2Summary}\n\nAnalyze marriage compatibility." }
            },
            temperature = 0.3,
        };

        var res = await SendWithRetryAsync(() => CreateRequest(url, payload), ct);
        var body = await res.Content.ReadAsStringAsync(ct);

        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"Matchmaking analysis failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";

        using var result = JsonDocument.Parse(content);
        var root = result.RootElement;

        return new MatchmakingResponse(
            OverallScore: root.GetPropertyOrDefault("overallScore", 0),
            CompatibilityLevel: root.GetPropertyOrDefault("compatibilityLevel", "Good"),
            SynastryAnalysis: root.GetPropertyOrDefault("synastryAnalysis", ""),
            AreasOfCompatibility: ParseCompatibilityAreas(root),
            Strengths: root.GetArrayOrDefault("strengths"),
            Challenges: root.GetArrayOrDefault("challenges"),
            Recommendations: root.GetArrayOrDefault("recommendations"),
            NextSteps: root.GetPropertyOrDefault("nextSteps", ""),
            KutaScore: root.GetPropertyOrDefault("kutaScore", ""),
            KutaBreakdown: ParseKutaBreakdown(root));
    }

    public async Task<YearlyHoroscopeResponse> GenerateYearlyHoroscopeAsync(
        SouthIndianChart chart,
        DashaStatus currentDasha,
        int targetYear,
        CancellationToken ct)
    {
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ASTROAI OpenAI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("ASTROAI OpenAI API key is missing.");

        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        var systemPrompt = @"You are a Vedic astrology expert creating comprehensive yearly horoscopes. Analyze:
1. Natal chart with current transits for the target year
2. Vimshottari Dasha periods active during the year
3. Major transits (Jupiter, Saturn, Rahu/Ketu)
4. Month-by-month predictions

Provide structured, actionable insights. Return STRICT JSON with schema:
{
  ""year"": number,
  ""overallTheme"": string (2-3 sentences summarizing the year),
  ""lifeAreas"": [{""area"": string (Career/Finance/Love/Health/Spiritual), ""score"": number (1-10), ""overview"": string, ""keyPoints"": [string]}],
  ""monthlyHighlights"": [{""month"": number, ""monthName"": string, ""careerOutlook"": string, ""financeOutlook"": string, ""relationshipOutlook"": string, ""healthOutlook"": string, ""luckyDays"": string}],
  ""importantDates"": [{""dateUtc"": string ISO, ""event"": string, ""significance"": string, ""recommendation"": string}],
  ""yearlyRemedies"": [string],
  ""dashaTransitions"": string
}";

        var chartSummary = BuildYearlyChartPrompt(chart, currentDasha, targetYear);

        var payload = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = chartSummary }
            },
            temperature = 0.4,
        };

        var res = await SendWithRetryAsync(() => CreateRequest(url, payload), ct);
        var body = await res.Content.ReadAsStringAsync(ct);

        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"Yearly horoscope failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";

        using var result = JsonDocument.Parse(content);
        var root = result.RootElement;

        return new YearlyHoroscopeResponse(
            Year: targetYear,
            OverallTheme: root.GetPropertyOrDefault("overallTheme", ""),
            LifeAreas: ParseLifeAreas(root),
            MonthlyHighlights: ParseMonthlyHighlights(root),
            ImportantDates: ParseKeyDates(root),
            YearlyRemedies: root.GetArrayOrDefault("yearlyRemedies"),
            DashaTransitions: root.GetPropertyOrDefault("dashaTransitions", ""));
    }

    public async Task<PersonalizedRemediesResponse> GeneratePersonalizedRemediesAsync(
        SouthIndianChart chart,
        DashaStatus dasha,
        IReadOnlyList<string> areasOfConcern,
        CancellationToken ct)
    {
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ASTROAI OpenAI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("ASTROAI OpenAI API key is missing.");

        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        var systemPrompt = @"You are a Vedic astrology remedial expert. Provide gentle, grounded, traditional remedies based on:
1. Planetary positions and afflictions in the birth chart
2. Current Dasha period challenges
3. Specific areas of concern mentioned by the native

Focus on: mantras, gemstones, fasting, simple puja/rituals, donations, and lifestyle adjustments.
Be practical, affordable, and respectful of modern life constraints.

Return STRICT JSON with schema:
{
  ""chartSummary"": string (2 sentences about key chart features),
  ""mantras"": [{""name"": string, ""description"": string, ""benefit"": string, ""howToPractice"": string, ""frequency"": string, ""bestTime"": string, ""effectivenessScore"": number}],
  ""gemstones"": [{same structure}],
  ""fastingDays"": [{same structure}],
  ""rituals"": [{same structure}],
  ""donations"": [{same structure}],
  ""lifestyleAdjustments"": [{same structure}],
  ""planetaryRemedyPriority"": string (which planet needs most attention),
  ""immediateActions"": [string] (3-5 actions to start immediately)
}";

        var concerns = string.Join(", ", areasOfConcern);
        var chartPrompt = BuildRemediesChartPrompt(chart, dasha, concerns);

        var payload = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = chartPrompt }
            },
            temperature = 0.3,
        };

        var res = await SendWithRetryAsync(() => CreateRequest(url, payload), ct);
        var body = await res.Content.ReadAsStringAsync(ct);

        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"Personalized remedies failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";

        using var result = JsonDocument.Parse(content);
        var root = result.RootElement;

        return new PersonalizedRemediesResponse(
            ChartSummary: root.GetPropertyOrDefault("chartSummary", ""),
            Mantras: ParseRemedies(root, "mantras"),
            Gemstones: ParseRemedies(root, "gemstones"),
            FastingDays: ParseRemedies(root, "fastingDays"),
            Rituals: ParseRemedies(root, "rituals"),
            Donations: ParseRemedies(root, "donations"),
            LifestyleAdjustments: ParseRemedies(root, "lifestyleAdjustments"),
            PlanetaryRemedyPriority: root.GetPropertyOrDefault("planetaryRemedyPriority", ""),
            ImmediateActions: root.GetArrayOrDefault("immediateActions"));
    }

    // Helper methods
    private static string BuildChartSummaryForMatching(SouthIndianChart chart, DashaStatus dasha, string name)
    {
        var houses = string.Join("; ", chart.Houses.Select(h => 
            $"H{h.Number} {h.Sign} [{string.Join(",", h.Occupants)}] RL:{h.RasiLord}"));
        var planets = string.Join("; ", chart.Planets.Select(p => 
            $"{p.Name} {p.Sign} H{p.House} Nak:{p.Nakshatra}"));
        
        return $"Name: {name}\n" +
               $"Asc: {chart.AscendantSign} ({chart.AscendantSiderealLongitude:F2}°)\n" +
               $"Houses: {houses}\n" +
               $"Planets: {planets}\n" +
               $"Current Dasha: {dasha.MahaDashaLord}/{dasha.AntarDashaLord}\n" +
               $"Birth: {chart.BirthDateTimeUtc:yyyy-MM-dd}";
    }

    private static string BuildYearlyChartPrompt(SouthIndianChart chart, DashaStatus dasha, int year)
    {
        var houses = string.Join("; ", chart.Houses.Select(h => 
            $"H{h.Number} {h.Sign} [{string.Join(",", h.Occupants)}]"));
        var planets = string.Join("; ", chart.Planets.Select(p => 
            $"{p.Name} {p.Sign} H{p.House}"));
        
        return $"Target Year: {year}\n" +
               $"Ascendant: {chart.AscendantSign}\n" +
               $"Houses: {houses}\n" +
               $"Planets: {planets}\n" +
               $"Current Dasha: {dasha.MahaDashaLord}/{dasha.AntarDashaLord} " +
               $"[Maha: {dasha.MahaPeriod.StartUtc:yyyy-MM-dd} to {dasha.MahaPeriod.EndUtc:yyyy-MM-dd}]\n" +
               $"Birth: {chart.BirthDateTimeUtc:yyyy-MM-dd}\n" +
               $"Generate comprehensive {year} yearly horoscope with month-by-month breakdown.";
    }

    private static string BuildRemediesChartPrompt(SouthIndianChart chart, DashaStatus dasha, string concerns)
    {
        var planets = string.Join("; ", chart.Planets.Select(p => 
            $"{p.Name} {p.Sign} H{p.House} Nak:{p.Nakshatra}"));
        
        return $"Areas of Concern: {concerns}\n" +
               $"Ascendant: {chart.AscendantSign}\n" +
               $"Planets: {planets}\n" +
               $"Current Dasha: {dasha.MahaDashaLord}/{dasha.AntarDashaLord}\n" +
               $"Generate personalized Vedic remedies focusing on the stated concerns.";
    }

    private static IReadOnlyList<CompatibilityArea> ParseCompatibilityAreas(JsonElement root)
    {
        if (!root.TryGetProperty("areasOfCompatibility", out var areas) || areas.ValueKind != JsonValueKind.Array)
            return Array.Empty<CompatibilityArea>();

        return areas.EnumerateArray()
            .Select(a => new CompatibilityArea(
                Name: a.GetPropertyOrDefault("name", ""),
                Score: a.GetPropertyOrDefault("score", 0),
                Analysis: a.GetPropertyOrDefault("analysis", "")))
            .ToList();
    }

    private static IReadOnlyList<KutaDetail> ParseKutaBreakdown(JsonElement root)
    {
        if (!root.TryGetProperty("kutaBreakdown", out var kutas) || kutas.ValueKind != JsonValueKind.Array)
            return Array.Empty<KutaDetail>();

        return kutas.EnumerateArray()
            .Select(k => new KutaDetail(
                Name: k.GetPropertyOrDefault("name", ""),
                Points: k.GetPropertyOrDefault("points", 0),
                MaxPoints: k.GetPropertyOrDefault("maxPoints", 0),
                Description: k.GetPropertyOrDefault("description", "")))
            .ToList();
    }

    private static IReadOnlyList<LifeAreaPrediction> ParseLifeAreas(JsonElement root)
    {
        if (!root.TryGetProperty("lifeAreas", out var areas) || areas.ValueKind != JsonValueKind.Array)
            return Array.Empty<LifeAreaPrediction>();

        return areas.EnumerateArray()
            .Select(a => new LifeAreaPrediction(
                Area: a.GetPropertyOrDefault("area", ""),
                Score: a.GetPropertyOrDefault("score", 5),
                Overview: a.GetPropertyOrDefault("overview", ""),
                KeyPoints: ParseStringArray(a, "keyPoints")))
            .ToList();
    }

    private static IReadOnlyList<MonthlyHighlight> ParseMonthlyHighlights(JsonElement root)
    {
        if (!root.TryGetProperty("monthlyHighlights", out var months) || months.ValueKind != JsonValueKind.Array)
            return Array.Empty<MonthlyHighlight>();

        return months.EnumerateArray()
            .Select(m => new MonthlyHighlight(
                Month: m.GetPropertyOrDefault("month", 1),
                MonthName: m.GetPropertyOrDefault("monthName", ""),
                CareerOutlook: m.GetPropertyOrDefault("careerOutlook", ""),
                FinanceOutlook: m.GetPropertyOrDefault("financeOutlook", ""),
                RelationshipOutlook: m.GetPropertyOrDefault("relationshipOutlook", ""),
                HealthOutlook: m.GetPropertyOrDefault("healthOutlook", ""),
                LuckyDays: m.GetPropertyOrDefault("luckyDays", "")))
            .ToList();
    }

    private static IReadOnlyList<KeyDate> ParseKeyDates(JsonElement root)
    {
        if (!root.TryGetProperty("importantDates", out var dates) || dates.ValueKind != JsonValueKind.Array)
            return Array.Empty<KeyDate>();

        return dates.EnumerateArray()
            .Select(d => new KeyDate(
                DateUtc: DateTime.TryParse(d.GetPropertyOrDefault("dateUtc", ""), out var dt) ? dt : DateTime.UtcNow,
                Event: d.GetPropertyOrDefault("event", ""),
                Significance: d.GetPropertyOrDefault("significance", ""),
                Recommendation: d.GetPropertyOrDefault("recommendation", "")))
            .ToList();
    }

    private static IReadOnlyList<Remedy> ParseRemedies(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var remedies) || remedies.ValueKind != JsonValueKind.Array)
            return Array.Empty<Remedy>();

        return remedies.EnumerateArray()
            .Select(r => new Remedy(
                Name: r.GetPropertyOrDefault("name", ""),
                Description: r.GetPropertyOrDefault("description", ""),
                Benefit: r.GetPropertyOrDefault("benefit", ""),
                HowToPractice: r.GetPropertyOrDefault("howToPractice", ""),
                Frequency: r.GetPropertyOrDefault("frequency", ""),
                BestTime: r.GetPropertyOrDefault("bestTime", ""),
                EffectivenessScore: r.GetPropertyOrDefault("effectivenessScore", 5)))
            .ToList();
    }

    private static IReadOnlyList<string> ParseStringArray(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var arr) || arr.ValueKind != JsonValueKind.Array)
            return Array.Empty<string>();

        return arr.EnumerateArray()
            .Where(e => e.ValueKind == JsonValueKind.String)
            .Select(e => e.GetString() ?? "")
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToList();
    }
}

// ── Palmistry + Face Reading + Past Life Analysis ────────────────────────────
public sealed partial class GptAstrologyService
{
    public async Task<FaceReadingResponse> AnalyzeFaceAsync(FaceReadingRequest request, CancellationToken ct)
    {
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ASTROAI OpenAI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("ASTROAI OpenAI API key is missing.");

        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        var base64 = request.ImageBase64.Contains(',')
            ? request.ImageBase64.Split(',')[1]
            : request.ImageBase64;

        var systemPrompt = $$"""
            You are a master of Vedic Samudrika Shastra (face reading) with 30 years of practice.
            The user's Moon Nakshatra is {{request.NakshatraName}}, ruled by {{request.NakshatraPlanet}}.
            Analyse the face photograph and cross-reference your observations with this Nakshatra energy.
            If the image is clearly NOT a face selfie, return {"error": "Please provide a clear face selfie."}.
            Return STRICT JSON only — no prose outside the JSON block.

            JSON schema:
            {
              "cosmicSummary": string (3-4 sentences tying face features to the {{request.NakshatraName}} energy),
              "faceShape": string (shape + Ayurvedic dosha type, e.g. "Oval – Pitta"),
              "dominantElement": string (Fire/Earth/Air/Water),
              "energyType": string (e.g. "Solar – radiant, commanding presence"),
              "eyes": {"feature":"Eyes","observation":string,"vedicMeaning":string,"prediction":string},
              "nose": {"feature":"Nose","observation":string,"vedicMeaning":string,"prediction":string},
              "lips": {"feature":"Lips","observation":string,"vedicMeaning":string,"prediction":string},
              "forehead": {"feature":"Forehead","observation":string,"vedicMeaning":string,"prediction":string},
              "jawline": {"feature":"Jawline","observation":string,"vedicMeaning":string,"prediction":string},
              "nakshatraMatch": {
                "nakshatra": "{{request.NakshatraName}}",
                "alignmentLevel": "Strong"|"Moderate"|"Developing",
                "alignmentMessage": string (how face features reflect/complement the Nakshatra energy)
              },
              "strengths": [string] (3-4 core strengths revealed by the face),
              "challenges": [string] (2-3 challenges to be mindful of),
              "lifeGuidance": [string] (3 practical cosmic guidance points),
              "luckyColor": string,
              "powerDay": string (best day of week for this person),
              "mantra": string (Sanskrit mantra for this Nakshatra combination),
              "disclaimer": "This reading is for spiritual and entertainment purposes only."
            }
            """;

        var payload = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new
                {
                    role = "user",
                    content = new object[]
                    {
                        new { type = "text", text = $"Please analyse this face and provide a complete Vedic Samudrika Shastra reading, cross-referenced with my {request.NakshatraName} Nakshatra energy." },
                        new { type = "image_url", image_url = new { url = $"data:image/jpeg;base64,{base64}", detail = "high" } }
                    }
                }
            },
            max_completion_tokens = 2000,
            temperature = 0.35
        };

        var res = await SendWithRetryAsync(() => CreateRequest(url, payload), ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"GPT Vision face analysis failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";

        if (content.Contains("```"))
        {
            var start = content.IndexOf('{');
            var end   = content.LastIndexOf('}');
            if (start >= 0 && end > start) content = content[start..(end + 1)];
        }

        using var parsed = JsonDocument.Parse(content);
        var root = parsed.RootElement;

        if (root.TryGetProperty("error", out var errProp))
            throw new InvalidOperationException(errProp.GetString() ?? "Invalid image.");

        static FaceFeatureReading ParseFeature(JsonElement r, string key)
        {
            if (!r.TryGetProperty(key, out var f)) return new FaceFeatureReading(key, "", "", "");
            return new FaceFeatureReading(
                f.GetPropertyOrDefault("feature", key),
                f.GetPropertyOrDefault("observation", ""),
                f.GetPropertyOrDefault("vedicMeaning", ""),
                f.GetPropertyOrDefault("prediction", ""));
        }

        NakshatraAlignment nakshatraMatch = new(request.NakshatraName, "Moderate", "");
        if (root.TryGetProperty("nakshatraMatch", out var nm))
            nakshatraMatch = new NakshatraAlignment(
                nm.GetPropertyOrDefault("nakshatra", request.NakshatraName),
                nm.GetPropertyOrDefault("alignmentLevel", "Moderate"),
                nm.GetPropertyOrDefault("alignmentMessage", ""));

        return new FaceReadingResponse(
            CosmicSummary:   root.GetPropertyOrDefault("cosmicSummary", ""),
            FaceShape:       root.GetPropertyOrDefault("faceShape", ""),
            DominantElement: root.GetPropertyOrDefault("dominantElement", ""),
            EnergyType:      root.GetPropertyOrDefault("energyType", ""),
            Eyes:            ParseFeature(root, "eyes"),
            Nose:            ParseFeature(root, "nose"),
            Lips:            ParseFeature(root, "lips"),
            Forehead:        ParseFeature(root, "forehead"),
            Jawline:         ParseFeature(root, "jawline"),
            NakshatraMatch:  nakshatraMatch,
            Strengths:       root.GetArrayOrDefault("strengths").ToArray(),
            Challenges:      root.GetArrayOrDefault("challenges").ToArray(),
            LifeGuidance:    root.GetArrayOrDefault("lifeGuidance").ToArray(),
            LuckyColor:      root.GetPropertyOrDefault("luckyColor", ""),
            PowerDay:        root.GetPropertyOrDefault("powerDay", ""),
            Mantra:          root.GetPropertyOrDefault("mantra", ""),
            Disclaimer:      root.GetPropertyOrDefault("disclaimer", "This reading is for spiritual and entertainment purposes only."));
    }

    public async Task<PalmistryResponse> AnalyzePalmAsync(PalmistryRequest request, CancellationToken ct)
    {
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ASTROAI OpenAI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("ASTROAI OpenAI API key is missing.");

        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        // Strip the data URI prefix if present
        var base64 = request.ImageBase64.Contains(',')
            ? request.ImageBase64.Split(',')[1]
            : request.ImageBase64;

        const string systemPrompt = """
            You are an expert Vedic palmist (Hasta Samudrika Shastra) with 30 years of practice.
            Analyse the palm photograph carefully and produce a STRICT JSON reading.
            If the image is not of a palm, return {"error": "Please provide a clear palm photograph."}.
            For the lifePredictions section, carefully examine the marriage line(s), fate line depth, 
            life line branches, health line, and sun line to give age-range predictions.
            All age fields should be concise ranges like "26–30" or "around 32".

            JSON schema:
            {
              "overallReading": string (3-4 sentence holistic reading),
              "dominantHand": "Left" | "Right" | "Both visible",
              "lifeLine": {"name": "Life Line", "condition": string, "interpretation": string, "prediction": string},
              "heartLine": {"name": "Heart Line", "condition": string, "interpretation": string, "prediction": string},
              "headLine":  {"name": "Head Line",  "condition": string, "interpretation": string, "prediction": string},
              "fateLine":  {"name": "Fate Line",  "condition": string, "interpretation": string, "prediction": string},
              "mounts": [{"name": string, "development": "Prominent"|"Average"|"Weak", "meaning": string}],
              "specialMarks": [string],
              "personality": {
                "element": string, "temperament": string,
                "strengths": string, "weaknesses": string,
                "careerSuggestions": string, "relationshipNature": string
              },
              "lifePredictions": {
                "marriageAge": string (age range from marriage line, e.g. "26–29"),
                "marriageNature": string (brief quality description of the marriage),
                "careerBreakAge": string (age range of major career breakthrough or shift),
                "careerField": string (most suitable career domain based on mounts + head line),
                "healthCrisisAge": string (age range where health needs extra care),
                "healthAdvice": string (what organ or system to watch, based on life/health line),
                "propertyAge": string (age range for acquiring first major property),
                "wealthPeak": string (age range of peak financial prosperity from sun/fate line),
                "childrenCount": string (indication of number of children from children lines),
                "spiritualAwakening": string (age range or event triggering spiritual growth),
                "keyLifeEvents": [string] (3-4 major milestone predictions with approximate ages)
              },
              "luckyColor": string,
              "luckyNumber": string,
              "suggestedGemstone": string,
              "remedies": [string],
              "disclaimer": "This reading is for spiritual and entertainment purposes only."
            }
            """;

        var payload = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new
                {
                    role = "user",
                    content = new object[]
                    {
                        new
                        {
                            type = "text",
                            text = request.UserName is not null
                                ? $"Please analyse the palm of {request.UserName} and provide a complete Vedic palmistry reading."
                                : "Please analyse this palm and provide a complete Vedic palmistry reading."
                        },
                        new
                        {
                            type = "image_url",
                            image_url = new { url = $"data:image/jpeg;base64,{base64}", detail = "high" }
                        }
                    }
                }
            },
            max_completion_tokens = 2000,
            temperature = 0.3
        };

        var res = await SendWithRetryAsync(() => CreateRequest(url, payload), ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"GPT Vision palm analysis failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";

        // Strip markdown code fences if the model wrapped it
        if (content.Contains("```"))
        {
            var start = content.IndexOf('{');
            var end   = content.LastIndexOf('}');
            if (start >= 0 && end > start) content = content[start..(end + 1)];
        }

        using var parsed = JsonDocument.Parse(content);
        var root = parsed.RootElement;

        // If model signalled an error (not a palm image)
        if (root.TryGetProperty("error", out var errProp))
            throw new InvalidOperationException(errProp.GetString() ?? "Invalid image.");

        static PalmLine ParseLine(JsonElement r, string key)
        {
            if (!r.TryGetProperty(key, out var l)) return new PalmLine(key, "", "", "");
            return new PalmLine(
                l.GetPropertyOrDefault("name", key),
                l.GetPropertyOrDefault("condition", ""),
                l.GetPropertyOrDefault("interpretation", ""),
                l.GetPropertyOrDefault("prediction", ""));
        }

        var mounts = new List<PalmMount>();
        if (root.TryGetProperty("mounts", out var ma) && ma.ValueKind == JsonValueKind.Array)
            foreach (var m in ma.EnumerateArray())
                mounts.Add(new PalmMount(
                    m.GetPropertyOrDefault("name", ""),
                    m.GetPropertyOrDefault("development", "Average"),
                    m.GetPropertyOrDefault("meaning", "")));

        PalmPersonality personality = new("", "", "", "", "", "");
        if (root.TryGetProperty("personality", out var pp))
            personality = new PalmPersonality(
                pp.GetPropertyOrDefault("element", ""),
                pp.GetPropertyOrDefault("temperament", ""),
                pp.GetPropertyOrDefault("strengths", ""),
                pp.GetPropertyOrDefault("weaknesses", ""),
                pp.GetPropertyOrDefault("careerSuggestions", ""),
                pp.GetPropertyOrDefault("relationshipNature", ""));

        LifePredictions lifeMilestones = new("", "", "", "", "", "", "", "", "", "", []);
        if (root.TryGetProperty("lifePredictions", out var lp))
            lifeMilestones = new LifePredictions(
                MarriageAge:        lp.GetPropertyOrDefault("marriageAge", ""),
                MarriageNature:     lp.GetPropertyOrDefault("marriageNature", ""),
                CareerBreakAge:     lp.GetPropertyOrDefault("careerBreakAge", ""),
                CareerField:        lp.GetPropertyOrDefault("careerField", ""),
                HealthCrisisAge:    lp.GetPropertyOrDefault("healthCrisisAge", ""),
                HealthAdvice:       lp.GetPropertyOrDefault("healthAdvice", ""),
                PropertyAge:        lp.GetPropertyOrDefault("propertyAge", ""),
                WealthPeak:         lp.GetPropertyOrDefault("wealthPeak", ""),
                ChildrenCount:      lp.GetPropertyOrDefault("childrenCount", ""),
                SpiritualAwakening: lp.GetPropertyOrDefault("spiritualAwakening", ""),
                KeyLifeEvents:      lp.GetArrayOrDefault("keyLifeEvents"));

        return new PalmistryResponse(
            OverallReading:    root.GetPropertyOrDefault("overallReading", ""),
            DominantHand:      root.GetPropertyOrDefault("dominantHand", ""),
            LifeLine:          ParseLine(root, "lifeLine"),
            HeartLine:         ParseLine(root, "heartLine"),
            HeadLine:          ParseLine(root, "headLine"),
            FateLine:          ParseLine(root, "fateLine"),
            Mounts:            mounts,
            SpecialMarks:      root.GetArrayOrDefault("specialMarks"),
            Personality:       personality,
            LuckyColor:        root.GetPropertyOrDefault("luckyColor", ""),
            LuckyNumber:       root.GetPropertyOrDefault("luckyNumber", ""),
            SuggestedGemstone: root.GetPropertyOrDefault("suggestedGemstone", ""),
            Remedies:          root.GetArrayOrDefault("remedies"),
            LifeMilestones:    lifeMilestones,
            Disclaimer:        root.GetPropertyOrDefault("disclaimer", "This reading is for spiritual and entertainment purposes only."));
    }

    public async Task<PastLifeResponse> GeneratePastLifeAnalysisAsync(
        SouthIndianChart chart, DashaStatus dasha, CancellationToken ct)
    {
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ASTROAI OpenAI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("ASTROAI OpenAI API key is missing.");

        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        const string systemPrompt = """
            You are a master Nadi Jyotisha astrologer with expertise in karmic astrology and past-life analysis.
            Analyse the Vedic birth chart using these classical Nadi and karmic principles:
            
            1. RAHU-KETU AXIS — karmic direction; Ketu = past life mastery, Rahu = current life destiny
            2. SATURN — karmic accountant; house/sign shows area of past-life debt
            3. 12th HOUSE — past-life karma, moksha, hidden matters, foreign/spiritual connections
            4. ATMAKARAKA — planet with highest sidereal longitude = soul indicator
            5. 5th HOUSE (Putra Bhava) — past merit / purva punya
            6. JUPITER — guru blessings accumulated over lifetimes
            7. PLANETARY CONJUNCTIONS — Nadi-specific karmic triggers
            
            Produce a vivid, spiritually grounded, narrative-rich analysis. This should feel like an authentic
            Nadi leaf reading — specific, insightful, and deeply personal. Be encouraging and dharmic.
            
            Return STRICT JSON only:
            {
              "karmicSignature": string (2-3 sentences synthesising the chart's core karmic theme),
              "soulLesson": string (the single most important lesson of this lifetime),
              "previousLife": {
                "era": string (approximate historical era and region),
                "role": string (occupation/social role in that life),
                "region": string (geographical region),
                "keyExperiences": [string] (2-3 key experiences or situations as array),
                "unfinishedBusiness": string (what was left incomplete, driving rebirth)
              },
              "karmicDebts": [
                {"planet": string, "house": string, "description": string, "resolution": string}
              ],
              "inheritedGifts": [string] (talents/abilities brought from past lives),
              "karmicRelationships": [
                {"type": string, "planetIndicator": string, "description": string, "lesson": string}
              ],
              "currentLifePurpose": string (mission of this lifetime),
              "spiritualPath": string (suggested sadhana/path),
              "nadiIndicators": [string] (specific chart combinations that indicate past-life themes),
              "karmicRemedies": [string] (5-7 remedies to clear karmic debts),
              "disclaimer": "This analysis is based on classical Vedic/Nadi astrological interpretation and is for spiritual guidance only."
            }
            """;

        var houses  = string.Join("; ", chart.Houses.Select(h => $"H{h.Number} {h.Sign} [{string.Join(",", h.Occupants)}] RL:{h.RasiLord} Nak:{h.Nakshatra} NL:{h.NakshatraLord}"));
        var planets = string.Join("; ", chart.Planets.Select(p => $"{p.Name} {p.Sign} H{p.House} Sid:{p.SiderealLongitude:F2} Nak:{p.Nakshatra}"));
        var userMsg = $"Asc:{chart.AscendantSign}({chart.AscendantSiderealLongitude:F2}) Ayanamsha:{chart.AyanamshaName}. Houses:{houses}. Planets:{planets}. Current Maha:{dasha.MahaDashaLord}/{dasha.AntarDashaLord}. Birth:{chart.BirthDateTimeUtc:yyyy-MM-dd}. Produce a complete Nadi past-life analysis.";

        var payload = new
        {
            model    = _model,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user",   content = userMsg }
            },
            temperature = 0.5,
            max_completion_tokens = 4096
        };

        var res  = await SendWithRetryAsync(() => CreateRequest(url, payload), ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"GPT past-life analysis failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc     = JsonDocument.Parse(body);
        var content = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";
        // Strip markdown code fences and extract JSON object
        var firstBrace = content.IndexOf('{');
        var lastBrace  = content.LastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace)
            content = content[firstBrace..(lastBrace + 1)];
        else if (firstBrace >= 0)
        {
            // Truncated JSON — attempt to close any open arrays/objects
            content = content[firstBrace..];
            var stack = new System.Collections.Generic.Stack<char>();
            var inStr = false; var esc = false;
            foreach (var ch in content) {
                if (esc) { esc = false; continue; }
                if (ch == '\\') { esc = true; continue; }
                if (ch == '"') { inStr = !inStr; continue; }
                if (!inStr) {
                    if (ch == '{') stack.Push('}');
                    else if (ch == '[') stack.Push(']');
                    else if ((ch == '}' || ch == ']') && stack.Count > 0) stack.Pop();
                }
            }
            // Close unclosed strings/arrays/objects with correct closing character
            if (inStr) content += "\"";
            while (stack.Count > 0) content += stack.Pop();
        }

        JsonDocument parsed;
        try { parsed = JsonDocument.Parse(content); }
        catch (JsonException je)
        {
            throw new InvalidOperationException(
                $"GPT past-life JSON could not be parsed (response may have been truncated). " +
                $"Parse error: {je.Message}. Content start: {content[..Math.Min(300, content.Length)]}");
        }
        using (parsed)
        {
        var root = parsed.RootElement;

        PastLifeNarrative prev = new("", "", "", "", "");
        if (root.TryGetProperty("previousLife", out var pl))
            prev = new PastLifeNarrative(
                pl.GetPropertyOrDefault("era", ""),
                pl.GetPropertyOrDefault("role", ""),
                pl.GetPropertyOrDefault("region", ""),
                pl.GetPropertyOrDefault("keyExperiences", ""),
                pl.GetPropertyOrDefault("unfinishedBusiness", ""));

        var debts = new List<KarmicDebt>();
        if (root.TryGetProperty("karmicDebts", out var da) && da.ValueKind == JsonValueKind.Array)
            foreach (var d in da.EnumerateArray())
                debts.Add(new KarmicDebt(
                    d.GetPropertyOrDefault("planet", ""),
                    d.GetPropertyOrDefault("house", ""),
                    d.GetPropertyOrDefault("description", ""),
                    d.GetPropertyOrDefault("resolution", "")));

        var rels = new List<KarmicRelationship>();
        if (root.TryGetProperty("karmicRelationships", out var ra) && ra.ValueKind == JsonValueKind.Array)
            foreach (var r in ra.EnumerateArray())
                rels.Add(new KarmicRelationship(
                    r.GetPropertyOrDefault("type", ""),
                    r.GetPropertyOrDefault("planetIndicator", ""),
                    r.GetPropertyOrDefault("description", ""),
                    r.GetPropertyOrDefault("lesson", "")));

        return new PastLifeResponse(
            KarmicSignature:      root.GetPropertyOrDefault("karmicSignature", ""),
            SoulLesson:           root.GetPropertyOrDefault("soulLesson", ""),
            PreviousLife:         prev,
            KarmicDebts:          debts,
            InheritedGifts:       root.GetArrayOrDefault("inheritedGifts"),
            KarmicRelationships:  rels,
            CurrentLifePurpose:   root.GetPropertyOrDefault("currentLifePurpose", ""),
            SpiritualPath:        root.GetPropertyOrDefault("spiritualPath", ""),
            NadiIndicators:       root.GetArrayOrDefault("nadiIndicators"),
            KarmicRemedies:       root.GetArrayOrDefault("karmicRemedies"),
            Disclaimer:           root.GetPropertyOrDefault("disclaimer", "This analysis is for spiritual guidance only."));
        } // end using parsed
    }
}
