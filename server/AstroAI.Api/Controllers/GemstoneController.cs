using AstroAI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AstroAI.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class GemstoneController : ControllerBase
{
    private readonly IGptAstrologyService _gpt;
    private readonly IKpHoroscopeService _kp;
    private readonly IVimshottariDashaService _dasha;

    public GemstoneController(IGptAstrologyService gpt, IKpHoroscopeService kp, IVimshottariDashaService dasha)
    {
        _gpt = gpt;
        _kp = kp;
        _dasha = dasha;
    }

    public sealed record GemstoneHttpRequest(
        string BirthDate,  // YYYY-MM-DD
        string BirthTime,  // HH:mm:ss
        string City,
        string State,
        string Country);

    [HttpPost("recommend")]
    public async Task<IActionResult> Recommend([FromBody] GemstoneHttpRequest req, CancellationToken ct)
    {
        if (!DateOnly.TryParse(req.BirthDate, out var birthDate))
            return BadRequest(new { error = "Invalid BirthDate. Use YYYY-MM-DD." });
        if (!TimeOnly.TryParse(req.BirthTime ?? "00:00:00", out var birthTime))
            birthTime = TimeOnly.MinValue;

        try
        {
            // Calculate natal chart first
            var chartReq = new BirthChartRequest(req.City, req.State, req.Country, birthDate, birthTime);
            var chart = await _kp.GenerateSouthIndianChartAsync(chartReq, ct);

            // Compute current dasha
            var moon = chart.Planets.FirstOrDefault(p => string.Equals(p.Name, "Moon", StringComparison.OrdinalIgnoreCase));
            if (moon is null)
                return BadRequest(new { error = "Moon position could not be computed." });

            var birthUtc = chart.BirthDateTimeUtc;
            var dasha = _dasha.ComputeCurrent(birthUtc, DateTime.UtcNow, moon.SiderealLongitude, moon.Nakshatra);

            var result = await _gpt.GetGemstoneRecommendationAsync(chart, dasha, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
