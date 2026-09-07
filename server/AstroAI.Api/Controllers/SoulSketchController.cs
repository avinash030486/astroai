using AstroAI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AstroAI.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class SoulSketchController : ControllerBase
{
    private readonly IGptAstrologyService _gpt;
    private readonly IKpHoroscopeService _kp;
    private readonly IVimshottariDashaService _dasha;
    private readonly ILogger<SoulSketchController> _logger;

    public SoulSketchController(
        IGptAstrologyService gpt,
        IKpHoroscopeService kp,
        IVimshottariDashaService dasha,
        ILogger<SoulSketchController> logger)
    {
        _gpt    = gpt;
        _kp     = kp;
        _dasha  = dasha;
        _logger = logger;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate(
        [FromBody] SoulSketchHttpRequest req,
        CancellationToken ct)
    {
        if (!DateOnly.TryParse(req.BirthDate, out var birthDate))
            return BadRequest(new { error = "Invalid BirthDate. Use YYYY-MM-DD." });

        if (!TimeOnly.TryParse(req.BirthTime ?? "06:00:00", out var birthTime))
            birthTime = new TimeOnly(6, 0);

        if (string.IsNullOrWhiteSpace(req.City))
            return BadRequest(new { error = "City is required." });

        try
        {
            _logger.LogInformation("🎨 Soul Sketch requested for {City} {BirthDate}", req.City, req.BirthDate);

            // Build natal chart
            var chartReq = new BirthChartRequest(req.City, req.State, req.Country, birthDate, birthTime);
            var chart    = await _kp.GenerateSouthIndianChartAsync(chartReq, ct);

            // Compute current dasha (needs Moon longitude)
            var moon = chart.Planets.FirstOrDefault(p =>
                string.Equals(p.Name, "Moon", StringComparison.OrdinalIgnoreCase));
            if (moon is null)
                return BadRequest(new { error = "Moon position could not be computed." });

            var dasha = _dasha.ComputeCurrent(
                chart.BirthDateTimeUtc,
                DateTime.UtcNow,
                moon.SiderealLongitude,
                moon.Nakshatra);

            // Generate soul sketch (GPT + DALL-E)
            var result = await _gpt.GenerateSoulSketchAsync(
                chart,
                dasha,
                req.Gender ?? "unknown",
                req.PartnerGender ?? "any",
                req.City ?? string.Empty,
                req.State ?? string.Empty,
                req.Country ?? string.Empty,
                ct);

            _logger.LogInformation("✅ Soul Sketch generated successfully");
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Soul Sketch generation failed: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
    }
}
