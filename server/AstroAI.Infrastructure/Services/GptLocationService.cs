using System.Net.Http;
using System.Net.Http.Headers;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json;
using AstroAI.Core.Services;

namespace AstroAI.Infrastructure.Services;

public sealed class GptLocationService : IGptLocationService
{
    private readonly HttpClient _http;
    private readonly string _endpoint;
    private readonly string _apiKey;
    private readonly string _model;

    public GptLocationService(IHttpClientFactory httpFactory, IOptions<AstroAI.Core.Configuration.AstroAiSettings> options)
    {
        _http = httpFactory.CreateClient();
        var s = options.Value ?? throw new InvalidOperationException("AstroAI settings are not configured.");
        _endpoint = s.OpenAIEndpoint;
        _apiKey = s.OpenAIApiKey;
        _model = string.IsNullOrWhiteSpace(s.ModelId) ? "gpt-5.1" : s.ModelId;
    }

    public async Task<(double Latitude, double Longitude)> GetCoordinatesAsync(
        string city, string state, string country, CancellationToken ct)
    {
        // Validate endpoint only when this call is actually needed
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("ASTROAI_OPENAI_ENDPOINT is a placeholder. Set it to a real chat/completions URL (OpenAI or Azure OpenAI).");
        }
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException("ASTROAI_OPENAI_API_KEY is missing. Configure it in appsettings or environment.");
        }

        var request = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = "You convert place names to coordinates. Return strict JSON only." },
                new { role = "user", content = $"City: {city}\nState: {state}\nCountry: {country}\nRespond only with JSON in the form {{\"lat\": 0.0, \"lon\": 0.0}}" }
            },
            response_format = new { type = "json_object" }
        };

        // Allow endpoint to be either a full chat/completions URL or a base host path
        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        // Resilience: retry on 429 Too Many Requests with backoff (respect Retry-After when present)
        HttpResponseMessage res;
        const int maxAttempts = 3;
        for (int attempt = 1; ; attempt++)
        {
            using var req = CreateRequest(url, request);
            res = await _http.SendAsync(req, ct);
            if (res.IsSuccessStatusCode)
                break;

            if (res.StatusCode == System.Net.HttpStatusCode.TooManyRequests && attempt < maxAttempts)
            {
                var delay = TimeSpan.FromSeconds(2 * attempt);
                if (res.Headers.RetryAfter is not null)
                {
                    if (res.Headers.RetryAfter.Delta is TimeSpan d) delay = d;
                }
                await Task.Delay(delay, ct);
                continue;
            }

            // Throw with details for non-retryable status codes
            var err = await res.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException($"GPT coordinates request failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {err}");
        }

        var jsonText = await res.Content.ReadAsStringAsync(ct);
        using var json = JsonDocument.Parse(jsonText);
        var content = json.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        if (string.IsNullOrWhiteSpace(content)) throw new InvalidOperationException("Empty response from GPT coordinates.");

        using var coords = JsonDocument.Parse(content);
        var lat = coords.RootElement.GetProperty("lat").GetDouble();
        var lon = coords.RootElement.GetProperty("lon").GetDouble();
        return (lat, lon);
    }

    public async Task<string?> GetWindowsTimeZoneIdAsync(
        double latitude, double longitude, string country, CancellationToken ct)
    {
        // Validate endpoint only when this call is actually needed
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("ASTROAI_OPENAI_ENDPOINT is a placeholder. Set it to a real chat/completions URL (OpenAI or Azure OpenAI).");
        }
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException("ASTROAI_OPENAI_API_KEY is missing. Configure it in appsettings or environment.");
        }

        var request = new
        {
            model = _model,
            messages = new object[]
            {
                new { role = "system", content = "You map coordinates to Windows time zone IDs. Return strict JSON only." },
                new
                {
                    role = "user",
                    content =
                        $"Latitude: {latitude}\nLongitude: {longitude}\nCountry: {country}\n" +
                        "Respond ONLY with JSON in the form {\"timeZoneId\": \"Eastern Standard Time\"} " +
                        "where timeZoneId is a valid Windows time zone ID for the given location."
                }
            },
            response_format = new { type = "json_object" }
        };

        var url = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        HttpResponseMessage res;
        const int maxAttempts = 3;
        for (int attempt = 1; ; attempt++)
        {
            using var req = CreateRequest(url, request);
            res = await _http.SendAsync(req, ct);
            if (res.IsSuccessStatusCode)
                break;

            if (res.StatusCode == System.Net.HttpStatusCode.TooManyRequests && attempt < maxAttempts)
            {
                var delay = TimeSpan.FromSeconds(2 * attempt);
                if (res.Headers.RetryAfter is not null && res.Headers.RetryAfter.Delta is TimeSpan d)
                {
                    delay = d;
                }
                await Task.Delay(delay, ct);
                continue;
            }

            var err = await res.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException($"GPT timezone request failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {err}");
        }

        var jsonText = await res.Content.ReadAsStringAsync(ct);
        using var json = JsonDocument.Parse(jsonText);
        var content = json.RootElement.GetProperty("choices")[0]
            .GetProperty("message").GetProperty("content").GetString();
        if (string.IsNullOrWhiteSpace(content))
            return null;

        using var parsed = JsonDocument.Parse(content);
        if (!parsed.RootElement.TryGetProperty("timeZoneId", out var tzProp) ||
            tzProp.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return tzProp.GetString();
    }

    private HttpRequestMessage CreateRequest(string url, object payload)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, url);
        // Header scheme: Azure OpenAI uses 'api-key'; OpenAI v1 uses 'Authorization: Bearer'
        if (_endpoint.Contains("api.openai.com", StringComparison.OrdinalIgnoreCase))
        {
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        }
        else
        {
            req.Headers.Add("api-key", _apiKey);
        }
        req.Content = JsonContent.Create(payload);
        return req;
    }
}
