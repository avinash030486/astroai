namespace AstroAI.Core.Services;

public interface IPremiumBirthChartStore
{
    Task SaveAsync(PremiumBirthChartSaveRequest request, CancellationToken ct);

    Task<DateTimeOffset?> GetLatestWeeklyPurchaseUtcAsync(string email, CancellationToken ct);

    Task<IReadOnlyList<PremiumBirthChartRecord>> GetByUserIdAsync(string userId, CancellationToken ct);
}

public sealed record PremiumBirthChartSaveRequest(
    string UserId,
    string Email,
    string Name,
    string Plan,
    string SubscriptionType,
    string DateOfBirth,
    string TimeOfBirth,
    string PlaceOfBirth,
    SouthIndianChart? Horoscope,
    string PaymentProvider = "stripe",
    string? StripeCustomerId = null,
    string? StripeSubscriptionId = null);

public sealed record PremiumBirthChartRecord(
    string Id,
    string UserId,
    string Email,
    string Name,
    string Plan,
    string SubscriptionType,
    string PaymentProvider,
    string? StripeCustomerId,
    string? StripeSubscriptionId,
    string DateOfBirth,
    string TimeOfBirth,
    string PlaceOfBirth,
    SouthIndianChart? Horoscope,
    DateTimeOffset CreatedAt);