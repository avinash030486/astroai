using AstroAI.Api.Models;
using AstroAI.Core.Services;
using Google.Apis.AndroidPublisher.v3;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.JsonWebTokens;
using Stripe;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace AstroAI.Api.Controllers
{
    public record PaymentRequestDto(
        string Plan,
        decimal AmountUsd,
        string Name,
        string Email,
        string PaymentMethodId,
        string DateOfBirth,
        string TimeOfBirth,
        string PlaceOfBirth);

    public record QnaPaymentRequestDto(
        string Plan,
        decimal AmountUsd,
        string Name,
        string Email,
        string PaymentMethodId);

    public record MatchmakingPaymentRequestDto(
        decimal AmountUsd,
        string Name,
        string Email,
        string PaymentMethodId,
        string Person1Name,
        string Person1BirthDate,
        string Person1BirthTime,
        string Person1BirthPlace,
        string Person2Name,
        string Person2BirthDate,
        string Person2BirthTime,
        string Person2BirthPlace);

    public record NumerologyPaymentRequestDto(
        decimal AmountUsd,
        string Name,
        string Email,
        string PaymentMethodId,
        string BirthDate);

    public record GemstonePaymentRequestDto(
        decimal AmountUsd,
        string Name,
        string Email,
        string PaymentMethodId,
        string BirthDate,
        string BirthPlace);

    public record FeaturePaymentRequestDto(
        string Feature,
        decimal AmountUsd,
        string Name,
        string Email,
        string PaymentMethodId);

    // Dedicated DTO for Pandit Arjun consultation payment
    public record AstrologerPaymentRequestDto(
        decimal AmountUsd,
        string Name,
        string Email,
        string PaymentMethodId,
        string PlaceOfBirth);

    public record PaymentResultDto(
        bool Success,
        string? Error,
        string? SubscriptionId = null,
        string? CustomerId = null,
        bool RequiresAction = false,
        string? ClientSecret = null,
        string? PaymentIntentId = null,
        string? PaymentStatus = null);

    public record PremiumBirthChartDto(
        string Id,
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

    public record GooglePlayValidationDto(string ProductId, string PurchaseToken);


    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly Container _subscriptions;
        private readonly IKpHoroscopeService _kpHoroscope;
        private readonly IPremiumBirthChartStore _premiumBirthChartStore;
        private readonly ILogger<PaymentsController> _logger;
        private readonly IConfiguration _configuration;

        private static readonly HashSet<string> KnownGooglePlayProducts = new(StringComparer.OrdinalIgnoreCase)
        {
            "premium_birth_chart",
            "matchmaking_analysis",
            "numerology_reading",
            "gemstone_report",
            "palmistry_reading",
            "nakshatra_aura_ar",
            "gemstone_tryon_ar",
            "soul_sketch",
            "past_life_reading",
            "yearly_horoscope",
            "qna_10_questions",
            "astrologer_session",
            "seeker_monthly",
            "rhythm_monthly"
        };

        private static readonly HashSet<string> GooglePlaySubscriptionProducts = new(StringComparer.OrdinalIgnoreCase)
        {
            "seeker_monthly",
            "rhythm_monthly"
        };

        public PaymentsController(
            CosmosClient cosmosClient, 
            IKpHoroscopeService kpHoroscope,
            IPremiumBirthChartStore premiumBirthChartStore,
            IConfiguration configuration,
            ILogger<PaymentsController> logger)
        {
            _logger = logger;
            _logger.LogInformation("💳 PaymentsController initialized");
            // database: vedicastro, container: vedicastroai
            _subscriptions = cosmosClient.GetContainer("vedicastro", "vedicastroai");
            _kpHoroscope = kpHoroscope;
            _premiumBirthChartStore = premiumBirthChartStore;
            _configuration = configuration;
        }

        private async Task<(bool Verified, string Status, string? Error)> VerifyGooglePlayPurchaseAsync(
            string productId,
            string purchaseToken,
            CancellationToken ct)
        {
            var packageName = _configuration["GooglePlay:PackageName"];
            var serviceAccountJsonPath = _configuration["GooglePlay:ServiceAccountJsonPath"];
            var serviceAccountJson = _configuration["GooglePlay:ServiceAccountJson"];

            if (string.IsNullOrWhiteSpace(packageName))
            {
                return (false, "not_configured", "GooglePlay:PackageName is missing.");
            }

            try
            {
                GoogleCredential credential;
                if (!string.IsNullOrWhiteSpace(serviceAccountJsonPath) && System.IO.File.Exists(serviceAccountJsonPath))
                {
                    credential = GoogleCredential.FromFile(serviceAccountJsonPath);
                }
                else if (!string.IsNullOrWhiteSpace(serviceAccountJson))
                {
                    credential = GoogleCredential.FromJson(serviceAccountJson);
                }
                else
                {
                    return (false, "not_configured", "Google Play service account credentials are missing.");
                }

                var scopedCredential = credential.CreateScoped(AndroidPublisherService.Scope.Androidpublisher);
                using var publisher = new AndroidPublisherService(new BaseClientService.Initializer
                {
                    HttpClientInitializer = scopedCredential,
                    ApplicationName = "AstroAI Google Play Validation"
                });

                if (GooglePlaySubscriptionProducts.Contains(productId))
                {
                    var sub = await publisher.Purchases.Subscriptions
                        .Get(packageName, productId, purchaseToken)
                        .ExecuteAsync(ct);

                    if (sub is null)
                    {
                        return (false, "not_found", "Subscription purchase not found.");
                    }

                    var isPaidState = sub.PaymentState is 1 or 2;
                    var expiryUtc = DateTimeOffset.MinValue;
                    if (sub.ExpiryTimeMillis.HasValue)
                    {
                        expiryUtc = DateTimeOffset.FromUnixTimeMilliseconds(sub.ExpiryTimeMillis.Value);
                    }

                    var isActive = expiryUtc > DateTimeOffset.UtcNow;
                    if (isPaidState && isActive)
                    {
                        return (true, "verified", null);
                    }

                    return (false, "not_active", "Subscription is not active.");
                }

                var product = await publisher.Purchases.Products
                    .Get(packageName, productId, purchaseToken)
                    .ExecuteAsync(ct);

                if (product is null)
                {
                    return (false, "not_found", "In-app purchase not found.");
                }

                if (product.PurchaseState == 0)
                {
                    return (true, "verified", null);
                }

                return (false, "invalid_state", $"In-app purchase state is {product.PurchaseState}.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Google Play verification exception for ProductId={ProductId}", productId);
                return (false, "verification_error", ex.Message);
            }
        }

        private async Task<DateTimeOffset?> GetLatestWeeklyPremiumPurchaseUtcAsync(string email, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return null;
            }

            return await _premiumBirthChartStore.GetLatestWeeklyPurchaseUtcAsync(email, ct);
        }

        private static string MapPlanToCode(string plan) =>
            plan switch
            {
                "one-time" => "O",
                "weekly"   => "W",
                "monthly"  => "M",
                _           => "O"
            };

        private static bool IsActionRequiredStatus(string? status) =>
            status is "requires_action" or "requires_source_action";

        private string? TryGetUserId()
        {
            var userId = User.FindFirst("sub")?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value
                ?? User.FindFirst("user_id")?.Value
                ?? User.Identity?.Name;

            if (string.IsNullOrWhiteSpace(userId))
            {
                var bearerToken = Request.Headers.Authorization.FirstOrDefault();
                var rawToken = bearerToken?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true
                    ? bearerToken.Substring("Bearer ".Length).Trim()
                    : bearerToken;

                if (!string.IsNullOrWhiteSpace(rawToken))
                {
                    try
                    {
                        var jwt = new JsonWebToken(rawToken);
                        userId = jwt.Claims.FirstOrDefault(claim => claim.Type == "sub")?.Value;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to parse bearer token for user id fallback.");
                    }
                }
            }

            return userId;
        }

        private async Task<string> ResolveUserIdOrThrowAsync(string? email, CancellationToken ct)
        {
            var userId = TryGetUserId();

            if (string.IsNullOrWhiteSpace(userId) && !string.IsNullOrWhiteSpace(email))
            {
                userId = await _premiumBirthChartStore.GetProfileUserIdByEmailAsync(email, ct);
            }

            if (string.IsNullOrWhiteSpace(userId))
            {
                var claimTypes = string.Join(", ", User.Claims.Select(claim => claim.Type).Distinct().OrderBy(type => type));
                _logger.LogError("Authenticated user id is missing from the token. Available claims: {ClaimTypes}", claimTypes);
                throw new InvalidOperationException("Authenticated user id is missing from the token.");
            }

            return userId;
        }

        private static PremiumBirthChartSaveRequest BuildPremiumBirthChartSaveRequest(
            string userId,
            PaymentRequestDto request,
            SouthIndianChart? horoscopeChart,
            string? customerId,
            string? subscriptionId)
        {
            return new PremiumBirthChartSaveRequest(
                UserId: userId,
                Email: request.Email,
                Name: request.Name,
                Plan: request.Plan,
                SubscriptionType: MapPlanToCode(request.Plan),
                DateOfBirth: request.DateOfBirth,
                TimeOfBirth: request.TimeOfBirth,
                PlaceOfBirth: request.PlaceOfBirth,
                Horoscope: horoscopeChart,
                StripeCustomerId: customerId,
                StripeSubscriptionId: subscriptionId);
        }

            private static PremiumBirthChartDto MapPremiumBirthChartDto(PremiumBirthChartRecord record)
            {
                return new PremiumBirthChartDto(
                record.Id,
                record.Email,
                record.Name,
                record.Plan,
                record.SubscriptionType,
                record.PaymentProvider,
                record.StripeCustomerId,
                record.StripeSubscriptionId,
                record.DateOfBirth,
                record.TimeOfBirth,
                record.PlaceOfBirth,
                record.Horoscope,
                record.CreatedAt);
            }

        private static PaymentResultDto BuildPaymentResultFromIntent(PaymentIntent intent)
        {
            var status = intent.Status ?? "unknown";
            if (status == "succeeded")
            {
                return new PaymentResultDto(
                    Success: true,
                    Error: null,
                    RequiresAction: false,
                    ClientSecret: intent.ClientSecret,
                    PaymentIntentId: intent.Id,
                    PaymentStatus: status);
            }

            if (IsActionRequiredStatus(status))
            {
                return new PaymentResultDto(
                    Success: false,
                    Error: "Additional authentication is required to complete this payment.",
                    RequiresAction: true,
                    ClientSecret: intent.ClientSecret,
                    PaymentIntentId: intent.Id,
                    PaymentStatus: status);
            }

            return new PaymentResultDto(
                Success: false,
                Error: $"Payment not completed. Stripe status: {status}.",
                RequiresAction: false,
                ClientSecret: intent.ClientSecret,
                PaymentIntentId: intent.Id,
                PaymentStatus: status);
        }

        private static PaymentResultDto BuildPaymentResultFromSubscription(
            Subscription subscription,
            string? customerId)
        {
            var status = subscription.Status ?? "unknown";
            if (status is "active" or "trialing")
            {
                return new PaymentResultDto(
                    Success: true,
                    Error: null,
                    SubscriptionId: subscription.Id,
                    CustomerId: customerId,
                    PaymentStatus: status);
            }

            return new PaymentResultDto(
                Success: false,
                Error: $"Subscription not active. Stripe status: {status}.",
                SubscriptionId: subscription.Id,
                CustomerId: customerId,
                RequiresAction: false,
                PaymentStatus: status);
        }

        private static bool IsTransientException(Exception ex)
        {
            if (ex is TimeoutException)
            {
                return true;
            }

            if (ex is TaskCanceledException)
            {
                return true;
            }

            if (ex is CosmosException cosmosEx)
            {
                return cosmosEx.StatusCode is HttpStatusCode.RequestTimeout
                    or HttpStatusCode.TooManyRequests
                    or HttpStatusCode.InternalServerError
                    or HttpStatusCode.BadGateway
                    or HttpStatusCode.ServiceUnavailable
                    or HttpStatusCode.GatewayTimeout;
            }

            if (ex is StripeException stripeEx)
            {
                var code = stripeEx.StripeError?.Type;
                var status = stripeEx.HttpStatusCode;

                if (code is "api_connection_error" or "api_error" or "rate_limit_error")
                {
                    return true;
                }

                return status is HttpStatusCode.RequestTimeout
                    or HttpStatusCode.TooManyRequests
                    or HttpStatusCode.InternalServerError
                    or HttpStatusCode.BadGateway
                    or HttpStatusCode.ServiceUnavailable
                    or HttpStatusCode.GatewayTimeout;
            }

            return false;
        }

        private async Task<T> ExecuteWithRetryAsync<T>(
            Func<CancellationToken, Task<T>> operation,
            CancellationToken ct,
            string operationName,
            int maxAttempts = 3,
            int initialDelayMs = 300)
        {
            var delayMs = initialDelayMs;

            for (var attempt = 1; attempt <= maxAttempts; attempt++)
            {
                try
                {
                    return await operation(ct);
                }
                catch (Exception ex) when (IsTransientException(ex) && attempt < maxAttempts && !ct.IsCancellationRequested)
                {
                    _logger.LogWarning(ex,
                        "⏳ Transient failure during {Operation}. Attempt {Attempt}/{MaxAttempts}. Retrying in {DelayMs}ms.",
                        operationName,
                        attempt,
                        maxAttempts,
                        delayMs);

                    await Task.Delay(delayMs, ct);
                    delayMs *= 2;
                }
            }

            return await operation(ct);
        }

        [HttpPost("charge")]
        public async Task<ActionResult<PaymentResultDto>> Charge(
            [FromBody] PaymentRequestDto request,
            CancellationToken ct)
        {
            _logger.LogInformation("📥 Charge request received: Plan={Plan}, Amount={Amount}, Email={Email}", 
                request.Plan, request.AmountUsd, request.Email);

            if (request.AmountUsd <= 0)
            {
                _logger.LogWarning("❌ Invalid payment amount: {Amount}", request.AmountUsd);
                return BadRequest(new PaymentResultDto(false, "Invalid payment amount."));
            }

            if (request.Plan is not ("one-time" or "weekly" or "monthly"))
            {
                _logger.LogWarning("❌ Invalid plan: {Plan}", request.Plan);
                return BadRequest(new PaymentResultDto(false, "Invalid plan."));
            }

            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
            {
                _logger.LogWarning("❌ Missing name or email");
                return BadRequest(new PaymentResultDto(false, "Name and Email are required."));
            }

            if (string.IsNullOrWhiteSpace(request.PaymentMethodId))
            {
                _logger.LogWarning("❌ Missing payment method id for charge request.");
                return BadRequest(new PaymentResultDto(false, "Payment method is required."));
            }

            var paymentMethodId = request.PaymentMethodId;

            _logger.LogInformation("💳 Using payment method: {PaymentMethodId}", paymentMethodId);

            try
            {
                string? customerId = null;
                string? subscriptionId = null;
                bool paymentSucceeded = false;

                if (request.Plan == "one-time")
                {
                    // One-time payment: use PaymentIntent
                    _logger.LogInformation("💰 Processing one-time payment...");
                    
                    var paymentIntentService = new PaymentIntentService();
                    var options = new PaymentIntentCreateOptions
                    {
                        Amount = (long)(request.AmountUsd * 100m),
                        Currency = "usd",
                        PaymentMethod = paymentMethodId,
                        PaymentMethodTypes = new List<string> { "card" },
                        ConfirmationMethod = "automatic",
                        Confirm = true,
                        Description = $"AstroAI one-time premium prediction",
                        ReceiptEmail = request.Email,
                        Metadata = new Dictionary<string, string>
                        {
                            ["plan"] = request.Plan,
                            ["customer_name"] = request.Name,
                            ["email"] = request.Email
                        }
                    };

                    _logger.LogInformation("🔄 Creating Stripe PaymentIntent...");
                    var intent = await ExecuteWithRetryAsync(
                        token => paymentIntentService.CreateAsync(options, null, token),
                        ct,
                        "Stripe PaymentIntent creation");
                    _logger.LogInformation("✅ PaymentIntent created: ID={IntentId}, Status={Status}", 
                        intent.Id, intent.Status);

                    var paymentResult = BuildPaymentResultFromIntent(intent);
                    if (!paymentResult.Success)
                    {
                        if (paymentResult.RequiresAction)
                        {
                            return Ok(paymentResult);
                        }

                        _logger.LogWarning("⚠️ One-time payment not completed. Status={Status}", paymentResult.PaymentStatus);
                        return BadRequest(paymentResult);
                    }

                    paymentSucceeded = true;
                }
                else
                {
                    // Recurring payment: create Customer and Subscription
                    _logger.LogInformation("🔁 Processing recurring subscription: {Plan}", request.Plan);

                    // Prevent duplicate active weekly subscriptions for the same email
                    if (request.Plan == "weekly")
                    {
                        var latestWeeklyPurchaseUtc = await GetLatestWeeklyPremiumPurchaseUtcAsync(request.Email, ct);
                        if (latestWeeklyPurchaseUtc is not null)
                        {
                            var expiry = latestWeeklyPurchaseUtc.Value.UtcDateTime.AddDays(7);
                            if (expiry > DateTime.UtcNow)
                            {
                                var message = $"You already have an active weekly subscription until {expiry:yyyy-MM-dd}.";
                                _logger.LogInformation("⚠️ Active weekly subscription found for {Email} valid until {Expiry}",
                                    request.Email, expiry);
                                return BadRequest(new PaymentResultDto(false, message));
                            }
                        }
                    }

                    // Step 1: Create or retrieve Stripe Customer
                    var customerService = new CustomerService();
                    var customerOptions = new CustomerCreateOptions
                    {
                        Email = request.Email,
                        Name = request.Name,
                        PaymentMethod = paymentMethodId,
                        InvoiceSettings = new CustomerInvoiceSettingsOptions
                        {
                            DefaultPaymentMethod = paymentMethodId
                        },
                        Metadata = new Dictionary<string, string>
                        {
                            ["date_of_birth"] = request.DateOfBirth,
                            ["time_of_birth"] = request.TimeOfBirth,
                            ["place_of_birth"] = request.PlaceOfBirth
                        }
                    };

                    _logger.LogInformation("👤 Creating Stripe Customer...");
                    var customer = await ExecuteWithRetryAsync(
                        token => customerService.CreateAsync(customerOptions, null, token),
                        ct,
                        "Stripe Customer creation");
                    customerId = customer.Id;
                    _logger.LogInformation("✅ Customer created: ID={CustomerId}", customerId);

                    // Step 2: Create Price for the subscription
                    var priceService = new PriceService();
                    var interval = request.Plan == "weekly" ? "week" : "month";
                    var priceOptions = new PriceCreateOptions
                    {
                        UnitAmount = (long)(request.AmountUsd * 100m),
                        Currency = "usd",
                        Recurring = new PriceRecurringOptions
                        {
                            Interval = interval
                        },
                        ProductData = new PriceProductDataOptions
                        {
                            Name = $"AstroAI {request.Plan} Premium Subscription"
                        },
                        Metadata = new Dictionary<string, string>
                        {
                            ["plan_type"] = request.Plan
                        }
                    };

                    _logger.LogInformation("💵 Creating Stripe Price for {Interval} subscription...", interval);
                    var price = await ExecuteWithRetryAsync(
                        token => priceService.CreateAsync(priceOptions, null, token),
                        ct,
                        "Stripe Price creation");
                    _logger.LogInformation("✅ Price created: ID={PriceId}", price.Id);

                    // Step 3: Create Subscription
                    var subscriptionService = new SubscriptionService();
                    var subscriptionOptions = new SubscriptionCreateOptions
                    {
                        Customer = customerId,
                        Items = new List<SubscriptionItemOptions>
                        {
                            new SubscriptionItemOptions
                            {
                                Price = price.Id
                            }
                        },
                        DefaultPaymentMethod = paymentMethodId,
                        Metadata = new Dictionary<string, string>
                        {
                            ["plan"] = request.Plan,
                            ["customer_name"] = request.Name,
                            ["email"] = request.Email
                        }
                    };

                    _logger.LogInformation("🔄 Creating Stripe Subscription...");
                    var subscription = await ExecuteWithRetryAsync(
                        token => subscriptionService.CreateAsync(subscriptionOptions, null, token),
                        ct,
                        "Stripe Subscription creation");
                    subscriptionId = subscription.Id;
                    _logger.LogInformation("✅ Subscription created: ID={SubscriptionId}, Status={Status}", 
                        subscription.Id, subscription.Status);

                    var subscriptionPaymentResult = BuildPaymentResultFromSubscription(subscription, customerId);
                    if (!subscriptionPaymentResult.Success)
                    {
                        if (subscriptionPaymentResult.RequiresAction)
                        {
                            return Ok(subscriptionPaymentResult);
                        }

                        _logger.LogWarning("⚠️ Subscription not active. Status={Status}", subscriptionPaymentResult.PaymentStatus);
                        return BadRequest(subscriptionPaymentResult);
                    }

                    paymentSucceeded = true;
                }

                if (paymentSucceeded)
                {
                    _logger.LogInformation("💰 Payment succeeded, processing horoscope and subscription record...");

                    // Generate horoscope for the subscriber
                    SouthIndianChart? horoscopeChart = null;
                    try
                    {
                        _logger.LogInformation("🔮 Generating horoscope for {PlaceOfBirth}", request.PlaceOfBirth);
                        
                        var placeParts = request.PlaceOfBirth.Split(',')
                            .Select(p => p.Trim())
                            .Where(p => !string.IsNullOrWhiteSpace(p))
                            .ToArray();

                        var city = placeParts.Length > 0 ? placeParts[0] : string.Empty;
                        var state = placeParts.Length > 1 ? placeParts[1] : string.Empty;
                        var country = placeParts.Length > 2 ? placeParts[2] : "India";

                        _logger.LogInformation("📍 Parsed location: City={City}, State={State}, Country={Country}", 
                            city, state, country);

                        if (DateTime.TryParse(request.DateOfBirth, out var birthDate) &&
                            TimeSpan.TryParse(request.TimeOfBirth, out var birthTime))
                        {
                            _logger.LogInformation("📅 Parsed birth details: Date={BirthDate}, Time={BirthTime}", 
                                birthDate, birthTime);

                            var birthChartRequest = new BirthChartRequest(
                                City: city,
                                State: state,
                                Country: country,
                                BirthDate: new DateOnly(birthDate.Year, birthDate.Month, birthDate.Day),
                                BirthTime: new TimeOnly(birthTime.Hours, birthTime.Minutes, birthTime.Seconds),
                                Latitude: null,
                                Longitude: null,
                                TimeZoneId: null
                            );

                            var horoscopeTimeoutSeconds = Math.Max(
                                3,
                                _configuration.GetValue<int?>("Payments:HoroscopeTimeoutSeconds") ?? 8);

                            using var horoscopeCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                            horoscopeCts.CancelAfter(TimeSpan.FromSeconds(horoscopeTimeoutSeconds));

                            horoscopeChart = await ExecuteWithRetryAsync(
                                token => _kpHoroscope.GenerateSouthIndianChartAsync(birthChartRequest, token),
                                horoscopeCts.Token,
                                "Horoscope generation",
                                maxAttempts: 2,
                                initialDelayMs: 250);

                            _logger.LogInformation("✅ Horoscope generated successfully");
                        }
                        else
                        {
                            _logger.LogWarning("⚠️ Failed to parse birth date/time: DOB={DOB}, TOB={TOB}", 
                                request.DateOfBirth, request.TimeOfBirth);
                        }
                    }
                    catch (OperationCanceledException) when (!ct.IsCancellationRequested)
                    {
                        _logger.LogWarning("⏱️ Horoscope generation timed out. Continuing without horoscope data.");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Failed to generate horoscope: {Message}", ex.Message);
                    }

                    _logger.LogInformation("💾 Saving premium birth chart to Supabase...");
                    var premiumBirthChartRequest = BuildPremiumBirthChartSaveRequest(
                        await ResolveUserIdOrThrowAsync(request.Email, ct),
                        request,
                        horoscopeChart,
                        customerId,
                        subscriptionId);

                    try
                    {
                        await ExecuteWithRetryAsync(
                            async token =>
                            {
                                await _premiumBirthChartStore.SaveAsync(premiumBirthChartRequest, token);
                                return true;
                            },
                            ct,
                            "Supabase premium birth chart save");
                        _logger.LogInformation("✅ Premium birth chart saved: Email={Email}, Type={Type}", 
                            premiumBirthChartRequest.Email,
                            premiumBirthChartRequest.SubscriptionType);
                    }
                    catch (Exception supabaseEx)
                    {
                        _logger.LogError(supabaseEx, "❌ Supabase premium birth chart save failed: {Message}", supabaseEx.Message);
                        throw;
                    }

                    return Ok(new PaymentResultDto(true, null, subscriptionId, customerId));
                }

                _logger.LogWarning("⚠️ Payment not completed");
                return BadRequest(new PaymentResultDto(false, "Payment not completed."));
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "❌ Stripe error: {Message}, Code={Code}", ex.Message, ex.StripeError?.Code);
                return BadRequest(new PaymentResultDto(false, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Unexpected error in charge endpoint: {Message}", ex.Message);
                return StatusCode(500,
                    new PaymentResultDto(false, "Payment failed due to a server error."));
            }
        }

        [HttpGet("premiumBirthCharts")]
        public async Task<ActionResult<IReadOnlyList<PremiumBirthChartDto>>> GetPremiumBirthCharts(CancellationToken ct)
        {
            try
            {
                var userId = await ResolveUserIdOrThrowAsync(null, ct);
                var charts = await _premiumBirthChartStore.GetByUserIdAsync(userId, ct);
                return Ok(charts.Select(MapPremiumBirthChartDto).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to load premium birth charts: {Message}", ex.Message);
                return StatusCode(500, "Failed to load premium birth charts.");
            }
        }

        [HttpPost("chargeForQNA")]
        public async Task<ActionResult<PaymentResultDto>> ChargeForQNA(
            [FromBody] QnaPaymentRequestDto request,
            CancellationToken ct)
        {
            _logger.LogInformation("📥 QNA Charge request received: Plan={Plan}, Amount={Amount}, Email={Email}", 
                request.Plan, request.AmountUsd, request.Email);

            if (request.AmountUsd <= 0)
            {
                _logger.LogWarning("❌ Invalid payment amount: {Amount}", request.AmountUsd);
                return BadRequest(new PaymentResultDto(false, "Invalid payment amount."));
            }

            if (request.Plan is not ("qna-10" or "qna-unlimited"))
            {
                _logger.LogWarning("❌ Invalid QNA plan: {Plan}", request.Plan);
                return BadRequest(new PaymentResultDto(false, "Invalid QNA plan."));
            }

            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
            {
                _logger.LogWarning("❌ Missing name or email");
                return BadRequest(new PaymentResultDto(false, "Name and Email are required."));
            }

            if (string.IsNullOrWhiteSpace(request.PaymentMethodId))
            {
                _logger.LogWarning("❌ Missing payment method id for QNA charge request.");
                return BadRequest(new PaymentResultDto(false, "Payment method is required."));
            }

            var paymentMethodId = request.PaymentMethodId;

            _logger.LogInformation("💳 Using payment method: {PaymentMethodId}", paymentMethodId);

            try
            {
                // QNA payment: use one-time PaymentIntent
                _logger.LogInformation("💰 Processing QNA one-time payment...");
                
                var paymentIntentService = new PaymentIntentService();
                var options = new PaymentIntentCreateOptions
                {
                    Amount = (long)(request.AmountUsd * 100m),
                    Currency = "usd",
                    PaymentMethod = paymentMethodId,
                    PaymentMethodTypes = new List<string> { "card" },
                    ConfirmationMethod = "automatic",
                    Confirm = true,
                    Description = $"AstroAI {request.Plan} questions package",
                    ReceiptEmail = request.Email,
                    Metadata = new Dictionary<string, string>
                    {
                        ["plan"] = request.Plan,
                        ["customer_name"] = request.Name,
                        ["email"] = request.Email,
                        ["type"] = "qna"
                    }
                };

                _logger.LogInformation("🔄 Creating Stripe PaymentIntent for QNA...");
                var intent = await ExecuteWithRetryAsync(
                    token => paymentIntentService.CreateAsync(options, null, token),
                    ct,
                    "Stripe QNA PaymentIntent creation");
                _logger.LogInformation("✅ PaymentIntent created: ID={IntentId}, Status={Status}", 
                    intent.Id, intent.Status);

                var paymentResult = BuildPaymentResultFromIntent(intent);

                if (!paymentResult.Success)
                {
                    if (paymentResult.RequiresAction)
                    {
                        return Ok(paymentResult);
                    }

                    _logger.LogWarning("⚠️ QNA payment not completed. Status={Status}", paymentResult.PaymentStatus);
                    return BadRequest(paymentResult);
                }

                var paymentSucceeded = true;

                if (paymentSucceeded)
                {
                    _logger.LogInformation("💰 QNA Payment succeeded, saving record to Cosmos DB...");

                    var subscriptionType = request.Plan == "qna-10" ? "Q10" : "QU";
                    var record = new SubscriptionRecord
                    {
                        name = request.Name,
                        email = request.Email,
                        subscriptionType = subscriptionType,
                        dateOfBirth = string.Empty,
                        timeOfBirth = string.Empty,
                        placeOfBirth = string.Empty,
                        horoscope = null
                    };

                    try
                    {
                        await ExecuteWithRetryAsync(
                            token => _subscriptions.CreateItemAsync(
                                record,
                                new PartitionKey(record.individual),
                                cancellationToken: token),
                            ct,
                            "Cosmos QNA record save");
                        _logger.LogInformation("✅ QNA purchase record saved: Email={Email}, Type={Type}", 
                            record.email, record.subscriptionType);
                    }
                    catch (Exception cosmosEx)
                    {
                        _logger.LogError(cosmosEx, "❌ Cosmos DB save failed: {Message}", cosmosEx.Message);
                        throw;
                    }

                    return Ok(new PaymentResultDto(true, null, null, null));
                }

                _logger.LogWarning("⚠️ QNA Payment not completed");
                return BadRequest(new PaymentResultDto(false, "Payment not completed."));
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "❌ Stripe error: {Message}, Code={Code}", ex.Message, ex.StripeError?.Code);
                return BadRequest(new PaymentResultDto(false, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Unexpected error in chargeForQNA endpoint: {Message}", ex.Message);
                return StatusCode(500,
                    new PaymentResultDto(false, "Payment failed due to a server error."));
            }
        }

        [HttpPost("chargeForMatchmaking")]
        public async Task<IActionResult> ChargeForMatchmaking(
            [FromBody] MatchmakingPaymentRequestDto dto,
            CancellationToken ct)
        {
            _logger.LogInformation("💜 Matchmaking payment attempt for {Email}", dto.Email);

            try
            {
                var amountCents = (long)(dto.AmountUsd * 100);

                var paymentIntentOptions = new PaymentIntentCreateOptions
                {
                    Amount = amountCents,
                    Currency = "usd",
                    PaymentMethod = dto.PaymentMethodId,
                    Confirm = true,
                    Description = $"Matchmaking Analysis - {dto.Person1Name} & {dto.Person2Name}",
                    ReceiptEmail = dto.Email,
                    Metadata = new Dictionary<string, string>
                    {
                        { "service", "matchmaking" },
                        { "customer_name", dto.Name },
                        { "customer_email", dto.Email },
                        { "person1_name", dto.Person1Name },
                        { "person1_birth_date", dto.Person1BirthDate },
                        { "person2_name", dto.Person2Name },
                        { "person2_birth_date", dto.Person2BirthDate }
                    },
                    AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                    {
                        Enabled = true,
                        AllowRedirects = "never"
                    }
                };

                var service = new PaymentIntentService();
                var intent = await ExecuteWithRetryAsync(
                    token => service.CreateAsync(paymentIntentOptions, cancellationToken: token),
                    ct,
                    "Stripe Matchmaking PaymentIntent creation");

                var paymentResult = BuildPaymentResultFromIntent(intent);

                if (paymentResult.Success)
                {
                    _logger.LogInformation("✅ Matchmaking payment succeeded for {Email}", dto.Email);
                    return Ok(new PaymentResultDto(true, null, null, null));
                }

                if (paymentResult.RequiresAction)
                {
                    return Ok(paymentResult);
                }

                _logger.LogWarning("⚠️ Matchmaking payment not completed, status: {Status}", paymentResult.PaymentStatus);
                return BadRequest(paymentResult);
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "❌ Stripe error in Matchmaking payment: {Message}, Code={Code}", 
                    ex.Message, ex.StripeError?.Code);
                return BadRequest(new PaymentResultDto(false, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Unexpected error in chargeForMatchmaking: {Message}", ex.Message);
                return StatusCode(500,
                    new PaymentResultDto(false, "Payment failed due to a server error."));
            }
        }

        [HttpPost("chargeForNumerology")]
        public async Task<IActionResult> ChargeForNumerology(
            [FromBody] NumerologyPaymentRequestDto dto,
            CancellationToken ct)
        {
            _logger.LogInformation("✨ Numerology payment attempt for {Email}", dto.Email);

            try
            {
                var amountCents = (long)(dto.AmountUsd * 100);

                var paymentIntentOptions = new PaymentIntentCreateOptions
                {
                    Amount = amountCents,
                    Currency = "usd",
                    PaymentMethod = dto.PaymentMethodId,
                    Confirm = true,
                    Description = $"Numerology Analysis - {dto.BirthDate}",
                    ReceiptEmail = dto.Email,
                    Metadata = new Dictionary<string, string>
                    {
                        { "service", "numerology" },
                        { "customer_name", dto.Name },
                        { "customer_email", dto.Email },
                        { "birth_date", dto.BirthDate }
                    },
                    AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                    {
                        Enabled = true,
                        AllowRedirects = "never"
                    }
                };

                var service = new PaymentIntentService();
                var intent = await ExecuteWithRetryAsync(
                    token => service.CreateAsync(paymentIntentOptions, cancellationToken: token),
                    ct,
                    "Stripe Numerology PaymentIntent creation");

                var paymentResult = BuildPaymentResultFromIntent(intent);

                if (paymentResult.Success)
                {
                    _logger.LogInformation("✅ Numerology payment succeeded for {Email}", dto.Email);
                    return Ok(new PaymentResultDto(true, null, null, null));
                }

                if (paymentResult.RequiresAction)
                {
                    return Ok(paymentResult);
                }

                _logger.LogWarning("⚠️ Numerology payment not completed, status: {Status}", paymentResult.PaymentStatus);
                return BadRequest(paymentResult);
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "❌ Stripe error in Numerology payment: {Message}, Code={Code}", 
                    ex.Message, ex.StripeError?.Code);
                return BadRequest(new PaymentResultDto(false, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Unexpected error in chargeForNumerology: {Message}", ex.Message);
                return StatusCode(500,
                    new PaymentResultDto(false, "Payment failed due to a server error."));
            }
        }

        [HttpPost("chargeForGemstone")]
        public async Task<IActionResult> ChargeForGemstone(
            [FromBody] GemstonePaymentRequestDto dto,
            CancellationToken ct)
        {
            _logger.LogInformation("💎 Gemstone payment attempt for {Email}", dto.Email);
            try
            {
                var amountCents = (long)(dto.AmountUsd * 100);
                var options = new PaymentIntentCreateOptions
                {
                    Amount = amountCents,
                    Currency = "usd",
                    PaymentMethod = dto.PaymentMethodId,
                    Confirm = true,
                    Description = $"Gemstone Recommendation – {dto.BirthDate}",
                    ReceiptEmail = dto.Email,
                    Metadata = new Dictionary<string, string>
                    {
                        { "service", "gemstone" },
                        { "customer_name", dto.Name },
                        { "customer_email", dto.Email },
                        { "birth_date", dto.BirthDate },
                        { "birth_place", dto.BirthPlace }
                    },
                    AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                    {
                        Enabled = true,
                        AllowRedirects = "never"
                    }
                };
                var service = new PaymentIntentService();
                var intent = await ExecuteWithRetryAsync(
                    token => service.CreateAsync(options, cancellationToken: token),
                    ct,
                    "Stripe Gemstone PaymentIntent creation");
                var paymentResult = BuildPaymentResultFromIntent(intent);

                if (paymentResult.Success)
                {
                    _logger.LogInformation("✅ Gemstone payment succeeded for {Email}", dto.Email);
                    return Ok(new PaymentResultDto(true, null, null, null));
                }

                if (paymentResult.RequiresAction)
                {
                    return Ok(paymentResult);
                }

                _logger.LogWarning("⚠️ Gemstone payment not completed, status: {Status}", paymentResult.PaymentStatus);
                return BadRequest(paymentResult);
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "❌ Stripe error in Gemstone payment: {Message}, Code={Code}",
                    ex.Message, ex.StripeError?.Code);
                return BadRequest(new PaymentResultDto(false, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Unexpected error in chargeForGemstone: {Message}", ex.Message);
                return StatusCode(500, new PaymentResultDto(false, "Payment failed due to a server error."));
            }
        }

        [HttpPost("chargeForFeature")]
        public async Task<IActionResult> ChargeForFeature(
            [FromBody] FeaturePaymentRequestDto dto,
            CancellationToken ct)
        {
            _logger.LogInformation("🪙 Feature payment attempt for {Feature} by {Email}", dto.Feature, dto.Email);

            if (dto.AmountUsd <= 0)
            {
                return BadRequest(new PaymentResultDto(false, "Invalid payment amount."));
            }

            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.PaymentMethodId))
            {
                return BadRequest(new PaymentResultDto(false, "Name, email, and payment method are required."));
            }

            var feature = dto.Feature?.Trim().ToLowerInvariant();
            var allowedFeatures = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "palmistry",
                "nakshatra-aura-ar",
                "gemstone-try-ar",
                "soul-sketch"
            };

            if (string.IsNullOrWhiteSpace(feature) || !allowedFeatures.Contains(feature))
            {
                return BadRequest(new PaymentResultDto(false, "Invalid feature."));
            }

            var description = feature switch
            {
                "palmistry" => "Palmistry Reading",
                "nakshatra-aura-ar" => "Nakshatra Aura AR",
                "gemstone-try-ar" => "Gemstone Try-On AR",
                "soul-sketch" => "Soul Sketch",
                _ => "Premium Feature"
            };

            try
            {
                var amountCents = (long)(dto.AmountUsd * 100m);
                var options = new PaymentIntentCreateOptions
                {
                    Amount = amountCents,
                    Currency = "usd",
                    PaymentMethod = dto.PaymentMethodId,
                    Confirm = true,
                    Description = $"{description} - AstroAI",
                    ReceiptEmail = dto.Email,
                    Metadata = new Dictionary<string, string>
                    {
                        { "service", "feature" },
                        { "feature", feature },
                        { "customer_name", dto.Name },
                        { "customer_email", dto.Email }
                    },
                    AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                    {
                        Enabled = true,
                        AllowRedirects = "never"
                    }
                };

                var service = new PaymentIntentService();
                var intent = await ExecuteWithRetryAsync(
                    token => service.CreateAsync(options, cancellationToken: token),
                    ct,
                    "Stripe Feature PaymentIntent creation");

                var paymentResult = BuildPaymentResultFromIntent(intent);

                if (paymentResult.Success)
                {
                    _logger.LogInformation("✅ Feature payment succeeded for {Feature} by {Email}", feature, dto.Email);
                    return Ok(new PaymentResultDto(true, null, null, null));
                }

                if (paymentResult.RequiresAction)
                {
                    return Ok(paymentResult);
                }

                _logger.LogWarning("⚠️ Feature payment not completed for {Feature}, status: {Status}", feature, paymentResult.PaymentStatus);
                return BadRequest(paymentResult);
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "❌ Stripe error in feature payment: {Message}, Code={Code}", ex.Message, ex.StripeError?.Code);
                return BadRequest(new PaymentResultDto(false, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Unexpected error in chargeForFeature: {Message}", ex.Message);
                return StatusCode(500, new PaymentResultDto(false, "Payment failed due to a server error."));
            }
        }

        [HttpPost("chargeForAstrologer")]
        [AllowAnonymous]
        public async Task<IActionResult> ChargeForAstrologer(
            [FromBody] AstrologerPaymentRequestDto dto,
            CancellationToken ct)
        {
            _logger.LogInformation("🔮 Astrologer payment attempt for {Email}", dto.Email);
            try
            {
                var amountCents = (long)(dto.AmountUsd * 100);
                var options = new PaymentIntentCreateOptions
                {
                    Amount = amountCents,
                    Currency = "usd",
                    PaymentMethod = dto.PaymentMethodId,
                    Confirm = true,
                    Description = "Pandit Arjun – 50-Question Session",
                    ReceiptEmail = dto.Email,
                    Metadata = new Dictionary<string, string>
                    {
                        { "service", "astrologer-chat" },
                        { "customer_name", dto.Name },
                        { "customer_email", dto.Email },
                        { "place_of_birth", dto.PlaceOfBirth }
                    },
                    AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                    {
                        Enabled = true,
                        AllowRedirects = "never"
                    }
                };
                var service = new PaymentIntentService();
                var intent = await ExecuteWithRetryAsync(
                    token => service.CreateAsync(options, cancellationToken: token),
                    ct,
                    "Stripe Astrologer PaymentIntent creation");
                var paymentResult = BuildPaymentResultFromIntent(intent);

                if (paymentResult.Success)
                {
                    _logger.LogInformation("✅ Astrologer payment succeeded for {Email}", dto.Email);
                    return Ok(new PaymentResultDto(true, null, null, null));
                }

                if (paymentResult.RequiresAction)
                {
                    return Ok(paymentResult);
                }

                _logger.LogWarning("⚠️ Astrologer payment not completed, status: {Status}", paymentResult.PaymentStatus);
                return BadRequest(paymentResult);
            }
            catch (StripeException ex)
            {
                _logger.LogError(ex, "❌ Stripe error in Astrologer payment: {Message}, Code={Code}",
                    ex.Message, ex.StripeError?.Code);
                return BadRequest(new PaymentResultDto(false, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Unexpected error in chargeForAstrologer: {Message}", ex.Message);
                return StatusCode(500, new PaymentResultDto(false, "Payment failed due to a server error."));
            }
        }

        [HttpPost("validateGooglePlay")]
        public async Task<IActionResult> ValidateGooglePlay(
            [FromBody] GooglePlayValidationDto dto,
            CancellationToken ct)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.ProductId) || string.IsNullOrWhiteSpace(dto.PurchaseToken))
                    return BadRequest(new { success = false, error = "ProductId and PurchaseToken are required." });

                if (!KnownGooglePlayProducts.Contains(dto.ProductId))
                {
                    _logger.LogWarning("❌ Unknown Google Play product id: {ProductId}", dto.ProductId);
                    return BadRequest(new { success = false, error = "Unknown Google Play product id." });
                }

                var verification = await VerifyGooglePlayPurchaseAsync(dto.ProductId, dto.PurchaseToken, ct);
                var allowUnverifiedFallback = _configuration.GetValue<bool>("GooglePlay:AllowUnverifiedFallback");

                if (!verification.Verified && !allowUnverifiedFallback)
                {
                    _logger.LogWarning("❌ Google Play verification failed for ProductId={ProductId}. Status={Status}. Error={Error}",
                        dto.ProductId,
                        verification.Status,
                        verification.Error);

                    return BadRequest(new
                    {
                        success = false,
                        error = "Google Play purchase could not be verified.",
                        verificationStatus = verification.Status
                    });
                }

                _logger.LogInformation("✅ Google Play purchase validated: ProductId={ProductId}", dto.ProductId);

                var isSubscription = dto.ProductId is "seeker_monthly" or "rhythm_monthly";
                var planCode = dto.ProductId switch
                {
                    "seeker_monthly" => "seeker",
                    "rhythm_monthly" => "rhythm",
                    _ => null
                };

                var featureKey = dto.ProductId switch
                {
                    "premium_birth_chart" => "birth-chart-premium",
                    "matchmaking_analysis" => "matchmaking",
                    "numerology_reading" => "numerology",
                    "gemstone_report" => "gemstone",
                    "palmistry_reading" => "palmistry",
                    "nakshatra_aura_ar" => "nakshatra-aura-ar",
                    "gemstone_tryon_ar" => "gemstone-tryon-ar",
                    "soul_sketch" => "soul-sketch",
                    "past_life_reading" => "past-life-reading",
                    "yearly_horoscope" => "yearly-horoscope",
                    "astrologer_session" => "astrologer-session",
                    _ => null
                };

                // Determine question grants for QnA products
                int? questionsGranted = dto.ProductId switch
                {
                    "qna_10_questions"  => 10,
                    _                   => null
                };

                return Ok(new
                {
                    success = true,
                    productId = dto.ProductId,
                    verified = verification.Verified,
                    verificationStatus = verification.Status,
                    isSubscription,
                    planCode,
                    featureKey,
                    questionsGranted
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in ValidateGooglePlay: {Message}", ex.Message);
                return StatusCode(500, new { success = false, error = "Server error validating Google Play purchase." });
            }
        }
    }
}
