using AstroAI.Api.Models;
using AstroAI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Linq;
using Microsoft.Extensions.Logging;
using Stripe;
using System;
using System.Collections.Generic;
using System.Linq;
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

    public record PaymentResultDto(bool Success, string? Error, string? SubscriptionId = null, string? CustomerId = null);


    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly Container _subscriptions;
        private readonly IKpHoroscopeService _kpHoroscope;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(
            CosmosClient cosmosClient, 
            IKpHoroscopeService kpHoroscope,
            ILogger<PaymentsController> logger)
        {
            _logger = logger;
            _logger.LogInformation("💳 PaymentsController initialized");
            // database: vedicastro, container: vedicastroai
            _subscriptions = cosmosClient.GetContainer("vedicastro", "vedicastroai");
            _kpHoroscope = kpHoroscope;
        }

        private async Task<SubscriptionRecord?> GetActiveWeeklySubscriptionAsync(string email, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return null;
            }

            var now = DateTime.UtcNow;
            var since = now.AddDays(-7); // weekly subscription window

            var queryable = _subscriptions.GetItemLinqQueryable<SubscriptionRecord>(
                requestOptions: new QueryRequestOptions
                {
                    PartitionKey = new PartitionKey("individual"),
                    MaxItemCount = 10
                })
                .Where(r => r.email == email && r.subscriptionType == "W" && r.createdUtc >= since)
                .OrderByDescending(r => r.createdUtc);

            using var iterator = queryable.ToFeedIterator();
            while (iterator.HasMoreResults)
            {
                var page = await iterator.ReadNextAsync(ct);
                var record = page.Resource.FirstOrDefault();
                if (record is not null)
                {
                    return record;
                }
            }

            return null;
        }

        private static string MapPlanToCode(string plan) =>
            plan switch
            {
                "one-time" => "O",
                "weekly"   => "W",
                "monthly"  => "M",
                _           => "O"
            };

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

            var paymentMethodId = string.IsNullOrWhiteSpace(request.PaymentMethodId)
                ? "pm_card_visa"
                : request.PaymentMethodId;

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
                    var intent = await paymentIntentService.CreateAsync(options, null, ct);
                    _logger.LogInformation("✅ PaymentIntent created: ID={IntentId}, Status={Status}", 
                        intent.Id, intent.Status);

                    paymentSucceeded = intent.Status == "succeeded";
                }
                else
                {
                    // Recurring payment: create Customer and Subscription
                    _logger.LogInformation("🔁 Processing recurring subscription: {Plan}", request.Plan);

                    // Prevent duplicate active weekly subscriptions for the same email
                    if (request.Plan == "weekly")
                    {
                        var existingWeekly = await GetActiveWeeklySubscriptionAsync(request.Email, ct);
                        if (existingWeekly is not null)
                        {
                            var expiry = existingWeekly.createdUtc.AddDays(7);
                            var message = $"You already have an active weekly subscription until {expiry:yyyy-MM-dd}.";
                            _logger.LogInformation("⚠️ Active weekly subscription found for {Email} valid until {Expiry}",
                                request.Email, expiry);
                            return BadRequest(new PaymentResultDto(false, message));
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
                    var customer = await customerService.CreateAsync(customerOptions, null, ct);
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
                    var price = await priceService.CreateAsync(priceOptions, null, ct);
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
                    var subscription = await subscriptionService.CreateAsync(subscriptionOptions, null, ct);
                    subscriptionId = subscription.Id;
                    _logger.LogInformation("✅ Subscription created: ID={SubscriptionId}, Status={Status}", 
                        subscription.Id, subscription.Status);

                    paymentSucceeded = subscription.Status == "active" || subscription.Status == "trialing";
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

                            horoscopeChart = await _kpHoroscope.GenerateSouthIndianChartAsync(birthChartRequest, ct);
                            _logger.LogInformation("✅ Horoscope generated successfully");
                        }
                        else
                        {
                            _logger.LogWarning("⚠️ Failed to parse birth date/time: DOB={DOB}, TOB={TOB}", 
                                request.DateOfBirth, request.TimeOfBirth);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Failed to generate horoscope: {Message}", ex.Message);
                    }

                    _logger.LogInformation("💾 Saving subscription record to Cosmos DB...");
                    var record = new SubscriptionRecord
                    {
                        name = request.Name,
                        email = request.Email,
                        subscriptionType = MapPlanToCode(request.Plan),
                        dateOfBirth = request.DateOfBirth,
                        timeOfBirth = request.TimeOfBirth,
                        placeOfBirth = request.PlaceOfBirth,
                        horoscope = horoscopeChart
                    };

                    try
                    {
                        await _subscriptions.CreateItemAsync(
                            record,
                            new PartitionKey(record.individual),
                            cancellationToken: ct);
                        _logger.LogInformation("✅ Subscription record saved: Email={Email}, Type={Type}", 
                            record.email, record.subscriptionType);
                    }
                    catch (Exception cosmosEx)
                    {
                        _logger.LogError(cosmosEx, "❌ Cosmos DB save failed: {Message}", cosmosEx.Message);
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

            var paymentMethodId = string.IsNullOrWhiteSpace(request.PaymentMethodId)
                ? "pm_card_visa"
                : request.PaymentMethodId;

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
                var intent = await paymentIntentService.CreateAsync(options, null, ct);
                _logger.LogInformation("✅ PaymentIntent created: ID={IntentId}, Status={Status}", 
                    intent.Id, intent.Status);

                var paymentSucceeded = intent.Status == "succeeded";

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
                        await _subscriptions.CreateItemAsync(
                            record,
                            new PartitionKey(record.individual),
                            cancellationToken: ct);
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
                var intent = await service.CreateAsync(paymentIntentOptions, cancellationToken: ct);

                if (intent.Status == "succeeded")
                {
                    _logger.LogInformation("✅ Matchmaking payment succeeded for {Email}", dto.Email);
                    return Ok(new PaymentResultDto(true, null, null, null));
                }

                _logger.LogWarning("⚠️ Matchmaking payment not completed, status: {Status}", intent.Status);
                return BadRequest(new PaymentResultDto(false, "Payment not completed."));
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
                var intent = await service.CreateAsync(paymentIntentOptions, cancellationToken: ct);

                if (intent.Status == "succeeded")
                {
                    _logger.LogInformation("✅ Numerology payment succeeded for {Email}", dto.Email);
                    return Ok(new PaymentResultDto(true, null, null, null));
                }

                _logger.LogWarning("⚠️ Numerology payment not completed, status: {Status}", intent.Status);
                return BadRequest(new PaymentResultDto(false, "Payment not completed."));
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
                var intent = await service.CreateAsync(options, cancellationToken: ct);
                if (intent.Status == "succeeded")
                {
                    _logger.LogInformation("✅ Gemstone payment succeeded for {Email}", dto.Email);
                    return Ok(new PaymentResultDto(true, null, null, null));
                }
                _logger.LogWarning("⚠️ Gemstone payment not completed, status: {Status}", intent.Status);
                return BadRequest(new PaymentResultDto(false, "Payment not completed."));
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
    }
}
