using Microsoft.AspNetCore.Mvc;
using AstroAI.Core.Services;

namespace AstroAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class YearlyHoroscopeController : ControllerBase
{
    private readonly IKpHoroscopeService _kpService;
    private readonly IGptAstrologyService _gptService;
    private readonly IVimshottariDashaService _dashaService;
    private readonly ILogger<YearlyHoroscopeController> _logger;

    public YearlyHoroscopeController(
        IKpHoroscopeService kpService,
        IGptAstrologyService gptService,
        IVimshottariDashaService dashaService,
        ILogger<YearlyHoroscopeController> logger)
    {
        _kpService = kpService;
        _gptService = gptService;
        _dashaService = dashaService;
        _logger = logger;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateYearlyHoroscope(
        [FromBody] YearlyHoroscopeRequest request,
        CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("📅 Generating yearly horoscope for year {Year}", request.Year);

            if (request.Year < DateTime.UtcNow.Year - 1 || request.Year > DateTime.UtcNow.Year + 5)
                return BadRequest(new { error = "Year must be between current year-1 and current year+5" });

            // Generate birth chart
            var chart = await _kpService.GenerateSouthIndianChartAsync(new(
                City: request.City,
                State: request.State,
                Country: request.Country,
                BirthDate: request.BirthDate,
                BirthTime: request.BirthTime,
                Latitude: request.Latitude,
                Longitude: request.Longitude,
                TimeZoneId: request.TimeZoneId), ct);

            // Calculate Dasha for target year
            var targetYearStart = new DateTime(request.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            
            var moon = chart.Planets.FirstOrDefault(p => 
                string.Equals(p.Name, "Moon", StringComparison.OrdinalIgnoreCase));

            if (moon is null)
                return BadRequest(new { error = "Moon position required for Dasha calculation" });

            var birthUtc = new DateTime(
                request.BirthDate.Year, request.BirthDate.Month, request.BirthDate.Day,
                request.BirthTime.Hour, request.BirthTime.Minute, request.BirthTime.Second,
                DateTimeKind.Utc);

            var dasha = _dashaService.ComputeCurrent(
                birthUtc, targetYearStart, moon.SiderealLongitude, moon.Nakshatra);

            // Generate yearly horoscope
            var horoscope = await _gptService.GenerateYearlyHoroscopeAsync(
                chart, dasha, request.Year, ct);

            _logger.LogInformation("✅ Yearly horoscope generated for {Year}", request.Year);

            return Ok(horoscope);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error generating yearly horoscope");
            return StatusCode(500, new { error = "Failed to generate yearly horoscope", details = ex.Message });
        }
    }
}
