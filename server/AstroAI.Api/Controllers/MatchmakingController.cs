using Microsoft.AspNetCore.Mvc;
using AstroAI.Core.Services;

namespace AstroAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class MatchmakingController : ControllerBase
{
    private readonly IKpHoroscopeService _kpService;
    private readonly IGptAstrologyService _gptService;
    private readonly IVimshottariDashaService _dashaService;
    private readonly ILogger<MatchmakingController> _logger;

    public MatchmakingController(
        IKpHoroscopeService kpService,
        IGptAstrologyService gptService,
        IVimshottariDashaService dashaService,
        ILogger<MatchmakingController> logger)
    {
        _kpService = kpService;
        _gptService = gptService;
        _dashaService = dashaService;
        _logger = logger;
    }

    [HttpPost("analyze")]
    public async Task<IActionResult> AnalyzeCompatibility(
        [FromBody] MatchmakingRequest request,
        CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("🔮 Generating matchmaking analysis for {Person1} and {Person2}", 
                request.Person1Name, request.Person2Name);

            // Generate Person 1 chart
            var person1Chart = await _kpService.GenerateSouthIndianChartAsync(new(
                City: request.Person1City,
                State: request.Person1State,
                Country: request.Person1Country,
                BirthDate: request.Person1BirthDate,
                BirthTime: request.Person1BirthTime,
                Latitude: request.Person1Latitude,
                Longitude: request.Person1Longitude,
                TimeZoneId: request.Person1TimeZoneId), ct);

            // Generate Person 2 chart
            var person2Chart = await _kpService.GenerateSouthIndianChartAsync(new(
                City: request.Person2City,
                State: request.Person2State,
                Country: request.Person2Country,
                BirthDate: request.Person2BirthDate,
                BirthTime: request.Person2BirthTime,
                Latitude: request.Person2Latitude,
                Longitude: request.Person2Longitude,
                TimeZoneId: request.Person2TimeZoneId), ct);

            // Calculate Dasha for both
            var currentUtc = DateTime.UtcNow;
            
            var person1Moon = person1Chart.Planets.FirstOrDefault(p => 
                string.Equals(p.Name, "Moon", StringComparison.OrdinalIgnoreCase));
            var person2Moon = person2Chart.Planets.FirstOrDefault(p => 
                string.Equals(p.Name, "Moon", StringComparison.OrdinalIgnoreCase));

            if (person1Moon is null || person2Moon is null)
                return BadRequest(new { error = "Moon position required for both charts" });

            var person1BirthUtc = new DateTime(
                request.Person1BirthDate.Year, request.Person1BirthDate.Month, request.Person1BirthDate.Day,
                request.Person1BirthTime.Hour, request.Person1BirthTime.Minute, request.Person1BirthTime.Second,
                DateTimeKind.Utc);

            var person2BirthUtc = new DateTime(
                request.Person2BirthDate.Year, request.Person2BirthDate.Month, request.Person2BirthDate.Day,
                request.Person2BirthTime.Hour, request.Person2BirthTime.Minute, request.Person2BirthTime.Second,
                DateTimeKind.Utc);

            var person1Dasha = _dashaService.ComputeCurrent(
                person1BirthUtc, currentUtc, person1Moon.SiderealLongitude, person1Moon.Nakshatra);
            
            var person2Dasha = _dashaService.ComputeCurrent(
                person2BirthUtc, currentUtc, person2Moon.SiderealLongitude, person2Moon.Nakshatra);

            // Generate AI matchmaking analysis
            var analysis = await _gptService.GenerateMatchmakingAnalysisAsync(
                person1Chart, person2Chart,
                person1Dasha, person2Dasha,
                request.Person1Name, request.Person2Name,
                ct);

            _logger.LogInformation("✅ Matchmaking analysis complete. Score: {Score}/100", 
                analysis.OverallScore);

            return Ok(analysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error generating matchmaking analysis");
            return StatusCode(500, new { error = "Failed to generate matchmaking analysis", details = ex.Message });
        }
    }
}
