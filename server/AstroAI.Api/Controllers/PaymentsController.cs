using AstroAI.Api.Models;
using AstroAI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
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

    public record PaymentResultDto(bool Success, string? Error);


    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly Container _subscriptions;
        private readonly IKpHoroscopeService _kpHoroscope;

        public PaymentsController(CosmosClient cosmosClient, IKpHoroscopeService kpHoroscope)
        {
            // database: vedicastro, container: vedicastroai
            _subscriptions = cosmosClient.GetContainer("vedicastro", "vedicastroai");
            _kpHoroscope = kpHoroscope;
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
            if (request.AmountUsd <= 0)
                return BadRequest(new PaymentResultDto(false, "Invalid payment amount."));

            if (request.Plan is not ("one-time" or "weekly" or "monthly"))
                return BadRequest(new PaymentResultDto(false, "Invalid plan."));

            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new PaymentResultDto(false, "Name and Email are required."));

            var paymentMethodId = string.IsNullOrWhiteSpace(request.PaymentMethodId)
                ? "pm_card_visa"
                : request.PaymentMethodId;

            var service = new PaymentIntentService();

            try
            {
                var options = new PaymentIntentCreateOptions
                {
                    Amount = (long)(request.AmountUsd * 100m),
                    Currency = "usd",

                    // We are using an explicit card PaymentMethod and want card-only
                    PaymentMethod = paymentMethodId,
                    PaymentMethodTypes = new List<string> { "card" },

                    ConfirmationMethod = "automatic",
                    Confirm = true,

                    Description = $"AstroAI {request.Plan} premium prediction",
                    ReceiptEmail = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email,
                    Metadata = new Dictionary<string, string>
                    {
                        ["plan"] = request.Plan,
                        ["customer_name"] = request.Name ?? string.Empty
                    },

                    //// Make sure Stripe does NOT try automatic_payment_methods here
                    //AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                    //{
                    //    Enabled = false
                    //},
                    //ReturnUrl= "http://localhost:4200/birth-chart"

                };

                var intent = await service.CreateAsync(options, null, ct);

                if (intent.Status == "succeeded")
                {
                    // Generate horoscope for the subscriber
                    SouthIndianChart? horoscopeChart = null;
                    try
                    {
                        // Parse place of birth to extract city, state, country
                        var placeParts = request.PlaceOfBirth.Split(',')
                            .Select(p => p.Trim())
                            .Where(p => !string.IsNullOrWhiteSpace(p))
                            .ToArray();

                        var city = placeParts.Length > 0 ? placeParts[0] : string.Empty;
                        var state = placeParts.Length > 1 ? placeParts[1] : string.Empty;
                        var country = placeParts.Length > 2 ? placeParts[2] : "India"; // Default to India

                        // Parse birth date and time
                        if (DateTime.TryParse(request.DateOfBirth, out var birthDate) &&
                            TimeSpan.TryParse(request.TimeOfBirth, out var birthTime))
                        {
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
                        }
                    }
                    catch (Exception ex)
                    {
                        // Log the error but don't fail the payment - horoscope will be null
                        Console.WriteLine($"Warning: Failed to generate horoscope for subscriber: {ex.Message}");
                    }

                    var record = new SubscriptionRecord
                    {
                        name = request.Name ?? string.Empty,
                        email = request.Email ?? string.Empty,
                        subscriptionType = MapPlanToCode(request.Plan),
                        dateOfBirth = request.DateOfBirth,
                        timeOfBirth = request.TimeOfBirth,
                        placeOfBirth = request.PlaceOfBirth,
                        horoscope = horoscopeChart
                    };

                    await _subscriptions.CreateItemAsync(
                        record,
                        new PartitionKey(record.individual),
                        cancellationToken: ct);

                    return Ok(new PaymentResultDto(true, null));
                }

                return BadRequest(new PaymentResultDto(false,
                    $"Payment not completed. Status: {intent.Status}"));
            }
            catch (StripeException ex)
            {
                return BadRequest(new PaymentResultDto(false, ex.Message));
            }
            catch
            {
                return StatusCode(500,
                    new PaymentResultDto(false, "Payment failed due to a server error."));
            }
        }
    }
}
