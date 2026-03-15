using AstroAI.Core.Services;
using AstroAI.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AstroAI.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class TransitsController : ControllerBase
{
    private readonly IGptAstrologyService _gpt;

    private static readonly string[] ValidSigns =
    {
        "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
        "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
    };

    public TransitsController(IGptAstrologyService gpt) => _gpt = gpt;

    public sealed record TransitRequest(string ZodiacSign);

    // ── Existing endpoint (kept for backward compatibility) ───────────────────
    [HttpPost("current")]
    [ResponseCache(Duration = 3600)]
    public async Task<IActionResult> Current([FromBody] TransitRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.ZodiacSign))
            return BadRequest(new { error = "ZodiacSign is required." });
        try
        {
            var result = await _gpt.GetTransitAlertsAsync(req.ZodiacSign, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ── New: all 12 zodiac summaries for the grid ─────────────────────────────
    [HttpGet("zodiac-summaries")]
    [ResponseCache(Duration = 1800)]
    public async Task<IActionResult> ZodiacSummaries(CancellationToken ct)
    {
        try
        {
            var result = await _gpt.GetAllZodiacSummariesAsync(ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ── New: detailed transit for a specific sign ─────────────────────────────
    [HttpGet("{sign}/detail")]
    [ResponseCache(Duration = 3600)]
    public async Task<IActionResult> Detail(string sign, CancellationToken ct)
    {
        var normalized = ValidSigns.FirstOrDefault(s => s.Equals(sign, StringComparison.OrdinalIgnoreCase));
        if (normalized is null) return BadRequest(new { error = "Invalid zodiac sign." });
        try
        {
            var result = await _gpt.GetDetailedTransitAsync(normalized, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ── New: monthly forecast for a specific sign ─────────────────────────────
    [HttpGet("{sign}/monthly")]
    [ResponseCache(Duration = 7200)]
    public async Task<IActionResult> Monthly(string sign, CancellationToken ct)
    {
        var normalized = ValidSigns.FirstOrDefault(s => s.Equals(sign, StringComparison.OrdinalIgnoreCase));
        if (normalized is null) return BadRequest(new { error = "Invalid zodiac sign." });
        try
        {
            var result = await _gpt.GetMonthlyTransitAsync(normalized, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

