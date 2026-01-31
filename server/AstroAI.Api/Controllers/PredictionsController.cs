using Microsoft.AspNetCore.Mvc;
using AstroAI.Core.Services;
using Microsoft.AspNetCore.Authorization;

namespace AstroAI.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class PredictionsController : ControllerBase
{
    private readonly IGptAstrologyService _gpt;
    private readonly IVimshottariDashaService _dasha;

    public PredictionsController(IGptAstrologyService gpt, IVimshottariDashaService dasha)
    {
        _gpt = gpt;
        _dasha = dasha;
    }

    [HttpPost("natal")]
    public async Task<IActionResult> Natal([FromBody] NatalRequest req, CancellationToken ct)
        => Ok(new { summary = await _gpt.GenerateNatalReadingAsync(req.FullName, req.BirthDate, req.BirthTime, req.BirthPlace, req.FocusArea, ct) });

    [HttpPost("horoscope")]
    public async Task<IActionResult> Horoscope([FromBody] HoroscopeRequest req, CancellationToken ct)
        => Ok(new { summary = await _gpt.GenerateHoroscopeAsync(req.ZodiacSign, req.Period, ct) });

    [HttpPost("generate-basic-chart-prediction")]
    public async Task<IActionResult> GenerateBasicChartPrediction([FromBody] BasicChartPredictionRequest req, CancellationToken ct)
    {
        // Validate birth/current timestamps - DOB is required
        if (req.BirthDateTimeUtc is null)
            return BadRequest(new { error = "BirthDateTimeUtc is required to compute Vimshottari dasha and age." });
        var birthUtc = req.BirthDateTimeUtc.Value;
        var currentUtc = req.CurrentDateTimeUtc ?? DateTime.UtcNow;

        // Extract Moon info
        var moon = req.Planets.FirstOrDefault(p => string.Equals(p.Name, "Moon", StringComparison.OrdinalIgnoreCase));
        if (moon is null)
            return BadRequest(new { error = "Moon position is required to compute Vimshottari dasha." });

        var status = _dasha.ComputeCurrent(birthUtc, currentUtc, moon.SiderealLongitude, moon.Nakshatra);

    // Age in years (Gregorian)
    var ageYears = (int)Math.Floor((currentUtc - birthUtc).TotalDays / 365.2425);

        // Defer the full analysis to OpenAI and return the model parsed from GPT
        var resp = await _gpt.GenerateBasicChartPredictionAsync(req, status, ageYears, ct);
        return Ok(resp);
    }

    [HttpPost("generate-detailed-prediction")]
    public async Task<IActionResult> GenerateDetailedPrediction([FromBody] BasicChartPredictionRequest req, CancellationToken ct)
    {
        if (req.BirthDateTimeUtc is null)
            return BadRequest(new { error = "BirthDateTimeUtc is required to compute Vimshottari dasha and age." });
        var birthUtc = req.BirthDateTimeUtc.Value;
        var currentUtc = req.CurrentDateTimeUtc ?? DateTime.UtcNow;

        var moon = req.Planets.FirstOrDefault(p => string.Equals(p.Name, "Moon", StringComparison.OrdinalIgnoreCase));
        if (moon is null)
            return BadRequest(new { error = "Moon position is required to compute Vimshottari dasha." });

        var status = _dasha.ComputeCurrent(birthUtc, currentUtc, moon.SiderealLongitude, moon.Nakshatra);
        var ageYears = (int)Math.Floor((currentUtc - birthUtc).TotalDays / 365.2425);

        var resp = await _gpt.GenerateDetailedPredictionAsync(req, status, ageYears, ct);
        return Ok(resp);
    }

    [HttpGet("get-daily-predictions")]
    public async Task<IActionResult> GetDailyPredictions(CancellationToken ct)
        => Ok(await _gpt.GetDailyPredictionsAsync(ct));

    [HttpPost("get-daily-panchang")]
    [ResponseCache(Duration = 1800, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "*" })]
    public async Task<IActionResult> GetDailyPanchang([FromBody] DailyPanchangRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Location))
            return BadRequest(new { error = "Location is required (e.g., \"Trivandrum, Kerala, India\")." });
        var result = await _gpt.GetDailyPanchangAsync(req.Location!, req.DateUtc, ct);
        return Ok(result);
    }
}

public sealed record NatalRequest(string FullName, DateOnly BirthDate, TimeOnly BirthTime, string BirthPlace, string FocusArea);
public sealed record HoroscopeRequest(string ZodiacSign, string Period);
public sealed record DailyPanchangRequest(string? Location, DateTime? DateUtc);

static class PredictionText
{
    public static readonly Dictionary<string, string> AscTraits = new(StringComparer.OrdinalIgnoreCase)
    {
        {"Aries", "Aries rising – direct, pioneering, action-first."},
        {"Taurus", "Taurus rising – steady, sensual, values-driven."},
        {"Gemini", "Gemini rising – curious, communicative, versatile."},
        {"Cancer", "Cancer rising – nurturing, protective, home-centered."},
        {"Leo", "Leo rising – expressive, confident, creative."},
        {"Virgo", "Virgo rising – analytical, meticulous, service-oriented."},
        {"Libra", "Libra rising – diplomatic, aesthetic, relationship-focused."},
        {"Scorpio", "Scorpio rising – intense, transformative, strategic."},
        {"Sagittarius", "Sagittarius rising – optimistic, exploratory, philosophical."},
        {"Capricorn", "Capricorn rising – disciplined, ambitious, pragmatic."},
        {"Aquarius", "Aquarius rising – innovative, humanitarian, unconventional."},
        {"Pisces", "Pisces rising – intuitive, compassionate, imaginative."}
    };

    public static readonly Dictionary<string, string> DashaEffects = new(StringComparer.OrdinalIgnoreCase)
    {
        {"Sun", "Authority, vitality, visibility, father/government themes."},
        {"Moon", "Emotions, mind, family, nourishment, fluctuations."},
        {"Mars", "Drive, courage, competition, technical work, conflicts."},
        {"Mercury", "Intellect, communication, trade, analysis, learning."},
        {"Jupiter", "Wisdom, growth, guidance, finance, children."},
        {"Venus", "Relationships, arts, comforts, vehicles, luxury."},
        {"Saturn", "Discipline, responsibilities, delays, endurance, service."},
        {"Rahu", "Aspirations, unconventional gains, foreign links, obsessions."},
        {"Ketu", "Detachment, spirituality, research, sudden breaks, introspection."}
    };
}

// Removed local text builders; the analysis is generated by OpenAI via IGptAstrologyService
