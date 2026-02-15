using Microsoft.AspNetCore.Mvc;
using AstroAI.Core.Services;

namespace AstroAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class RemediesController : ControllerBase
{
    private readonly IKpHoroscopeService _kpService;
    private readonly IGptAstrologyService _gptService;
    private readonly IVimshottariDashaService _dashaService;
    private readonly ILogger<RemediesController> _logger;

    public RemediesController(
        IKpHoroscopeService kpService,
        IGptAstrologyService gptService,
        IVimshottariDashaService dashaService,
        ILogger<RemediesController> logger)
    {
        _kpService = kpService;
        _gptService = gptService;
        _dashaService = dashaService;
        _logger = logger;
    }

    [HttpPost("personalized")]
    public async Task<IActionResult> GetPersonalizedRemedies(
        [FromBody] PersonalizedRemediesRequest request,
        CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("🪷 Generating personalized remedies for concerns: {Concerns}", 
                string.Join(", ", request.AreasOfConcern));

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

            // Calculate current Dasha
            var currentUtc = DateTime.UtcNow;
            
            var moon = chart.Planets.FirstOrDefault(p => 
                string.Equals(p.Name, "Moon", StringComparison.OrdinalIgnoreCase));

            if (moon is null)
                return BadRequest(new { error = "Moon position required for Dasha calculation" });

            var birthUtc = new DateTime(
                request.BirthDate.Year, request.BirthDate.Month, request.BirthDate.Day,
                request.BirthTime.Hour, request.BirthTime.Minute, request.BirthTime.Second,
                DateTimeKind.Utc);

            var dasha = _dashaService.ComputeCurrent(
                birthUtc, currentUtc, moon.SiderealLongitude, moon.Nakshatra);

            // Generate personalized remedies
            var remedies = await _gptService.GeneratePersonalizedRemediesAsync(
                chart, dasha, request.AreasOfConcern, ct);

            _logger.LogInformation("✅ Personalized remedies generated");

            return Ok(remedies);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error generating personalized remedies");
            return StatusCode(500, new { error = "Failed to generate remedies", details = ex.Message });
        }
    }
}
