using AstroAI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AstroAI.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class PastLifeController : ControllerBase
{
    private readonly IGptAstrologyService _gpt;
    private readonly IKpHoroscopeService _kp;
    private readonly IVimshottariDashaService _dasha;

    public PastLifeController(IGptAstrologyService gpt, IKpHoroscopeService kp, IVimshottariDashaService dasha)
    {
        _gpt   = gpt;
        _kp    = kp;
        _dasha = dasha;
    }

    public sealed record PastLifeHttpRequest(
        string BirthDate,  // YYYY-MM-DD
        string BirthTime,  // HH:mm:ss
        string City,
        string State,
        string Country);

    [HttpPost("analyze")]
    public async Task<IActionResult> Analyze([FromBody] PastLifeHttpRequest req)
    {
        if (!DateOnly.TryParse(req.BirthDate, out var birthDate))
            return BadRequest(new { error = "Invalid BirthDate. Use YYYY-MM-DD." });
        if (!TimeOnly.TryParse(req.BirthTime ?? "00:00:00", out var birthTime))
            birthTime = TimeOnly.MinValue;

        // Use an independent timeout — NOT bound to the HTTP request's CancellationToken.
        // This prevents mobile clients that drop the connection early from aborting
        // a long-running GPT call that may take 30-90 seconds.
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(120));

        try
        {
            // Build natal chart
            var chartReq = new BirthChartRequest(req.City, req.State, req.Country, birthDate, birthTime);
            var chart    = await _kp.GenerateSouthIndianChartAsync(chartReq, cts.Token);

            var moon = chart.Planets.FirstOrDefault(p =>
                string.Equals(p.Name, "Moon", StringComparison.OrdinalIgnoreCase));
            if (moon is null)
                return BadRequest(new { error = "Moon position could not be computed." });

            var dasha = _dasha.ComputeCurrent(
                chart.BirthDateTimeUtc, DateTime.UtcNow,
                moon.SiderealLongitude, moon.Nakshatra);

            var result = await _gpt.GeneratePastLifeAnalysisAsync(chart, dasha, cts.Token);
            return Ok(result);
        }
        catch (OperationCanceledException)
        {
            return StatusCode(504, new { error = "Past life analysis timed out. Please try again." });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
