using AstroAI.Core.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AstroAI.Infrastructure.Services;

public sealed class SupabasePremiumBirthChartStore : IPremiumBirthChartStore
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SupabasePremiumBirthChartStore> _logger;

    public SupabasePremiumBirthChartStore(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<SupabasePremiumBirthChartStore> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SaveAsync(PremiumBirthChartSaveRequest request, CancellationToken ct)
    {
        var (tableName, serviceRoleKey) = GetSupabaseSettings();

        using var message = new HttpRequestMessage(HttpMethod.Post, tableName)
        {
            Content = JsonContent.Create(new
            {
                user_id = request.UserId,
                email = request.Email,
                name = request.Name,
                plan = request.Plan,
                subscription_type = request.SubscriptionType,
                payment_provider = request.PaymentProvider,
                stripe_customer_id = request.StripeCustomerId,
                stripe_subscription_id = request.StripeSubscriptionId,
                date_of_birth = request.DateOfBirth,
                time_of_birth = request.TimeOfBirth,
                place_of_birth = request.PlaceOfBirth,
                horoscope = request.Horoscope
            })
        };

        AddAuthHeaders(message, serviceRoleKey);
        message.Headers.TryAddWithoutValidation("Prefer", "return=minimal");

        using var response = await _httpClient.SendAsync(message, ct);
        if (response.IsSuccessStatusCode)
        {
            _logger.LogInformation("Saved premium birth chart to Supabase for UserId={UserId}, Email={Email}, Plan={Plan}",
                request.UserId,
                request.Email,
                request.Plan);
            return;
        }

        var body = await response.Content.ReadAsStringAsync(ct);
        _logger.LogError("Failed to save premium birth chart to Supabase. StatusCode={StatusCode}, Body={Body}",
            response.StatusCode,
            body);
        throw new InvalidOperationException($"Supabase premium birth chart save failed with status {(int)response.StatusCode}.");
    }

    public async Task<DateTimeOffset?> GetLatestWeeklyPurchaseUtcAsync(string email, CancellationToken ct)
    {
        var (tableName, serviceRoleKey) = GetSupabaseSettings();
        var query =
            $"{tableName}?select=created_at" +
            $"&email=eq.{Uri.EscapeDataString(email)}" +
            "&subscription_type=eq.W" +
            "&order=created_at.desc" +
            "&limit=1";

        using var message = new HttpRequestMessage(HttpMethod.Get, query);
        AddAuthHeaders(message, serviceRoleKey);
        message.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using var response = await _httpClient.SendAsync(message, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Failed to query latest weekly premium purchase from Supabase. StatusCode={StatusCode}, Body={Body}",
                response.StatusCode,
                body);
            throw new InvalidOperationException($"Supabase weekly premium lookup failed with status {(int)response.StatusCode}.");
        }

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var rows = await JsonSerializer.DeserializeAsync<List<LatestWeeklyPurchaseRow>>(stream, cancellationToken: ct);
        return rows?.FirstOrDefault()?.CreatedAt;
    }

    public async Task<IReadOnlyList<PremiumBirthChartRecord>> GetByUserIdAsync(string userId, CancellationToken ct)
    {
        var (tableName, serviceRoleKey) = GetSupabaseSettings();
        var query =
            $"{tableName}?select=*" +
            $"&user_id=eq.{Uri.EscapeDataString(userId)}" +
            "&order=created_at.desc";

        using var message = new HttpRequestMessage(HttpMethod.Get, query);
        AddAuthHeaders(message, serviceRoleKey);
        message.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using var response = await _httpClient.SendAsync(message, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Failed to query premium birth charts from Supabase. StatusCode={StatusCode}, Body={Body}",
                response.StatusCode,
                body);
            throw new InvalidOperationException($"Supabase premium birth chart query failed with status {(int)response.StatusCode}.");
        }

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        var rows = await JsonSerializer.DeserializeAsync<List<PremiumBirthChartRow>>(stream, cancellationToken: ct)
            ?? [];

        return rows
            .Select(row => new PremiumBirthChartRecord(
                row.Id,
                row.UserId,
                row.Email,
                row.Name,
                row.Plan,
                row.SubscriptionType,
                row.PaymentProvider,
                row.StripeCustomerId,
                row.StripeSubscriptionId,
                row.DateOfBirth,
                row.TimeOfBirth,
                row.PlaceOfBirth,
                row.Horoscope,
                row.CreatedAt))
            .ToList();
    }

    private (string TableName, string ServiceRoleKey) GetSupabaseSettings()
    {
        var tableName = _configuration["Supabase:PremiumBirthChartsTable"];
        if (string.IsNullOrWhiteSpace(tableName))
        {
            tableName = "premium_birth_charts";
        }

        var serviceRoleKey = _configuration["Supabase:ServiceRoleKey"];
        if (string.IsNullOrWhiteSpace(serviceRoleKey))
        {
            throw new InvalidOperationException("Supabase:ServiceRoleKey is not configured.");
        }

        return (tableName, serviceRoleKey);
    }

    private static void AddAuthHeaders(HttpRequestMessage message, string serviceRoleKey)
    {
        message.Headers.TryAddWithoutValidation("apikey", serviceRoleKey);

        // New Supabase secret keys (sb_secret_...) are not JWTs and should be sent via apikey.
        // Legacy service_role keys are JWTs and still use Authorization for compatibility.
        if (!serviceRoleKey.StartsWith("sb_", StringComparison.OrdinalIgnoreCase))
        {
            message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
        }
    }

    private sealed record LatestWeeklyPurchaseRow(
        [property: JsonPropertyName("created_at")] DateTimeOffset CreatedAt);

    private sealed record PremiumBirthChartRow(
        [property: JsonPropertyName("id")] string Id,
        [property: JsonPropertyName("user_id")] string UserId,
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("plan")] string Plan,
        [property: JsonPropertyName("subscription_type")] string SubscriptionType,
        [property: JsonPropertyName("payment_provider")] string PaymentProvider,
        [property: JsonPropertyName("stripe_customer_id")] string? StripeCustomerId,
        [property: JsonPropertyName("stripe_subscription_id")] string? StripeSubscriptionId,
        [property: JsonPropertyName("date_of_birth")] string DateOfBirth,
        [property: JsonPropertyName("time_of_birth")] string TimeOfBirth,
        [property: JsonPropertyName("place_of_birth")] string PlaceOfBirth,
        [property: JsonPropertyName("horoscope")] SouthIndianChart? Horoscope,
        [property: JsonPropertyName("created_at")] DateTimeOffset CreatedAt);
}