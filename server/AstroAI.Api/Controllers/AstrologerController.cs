using Microsoft.AspNetCore.Mvc;
using AstroAI.Core.Services;

namespace AstroAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AstrologerController : ControllerBase
{
    private readonly IGptAstrologyService _gpt;
    private readonly IKpHoroscopeService _kp;
    private readonly IVimshottariDashaService _dasha;

    public AstrologerController(
        IGptAstrologyService gpt,
        IKpHoroscopeService kp,
        IVimshottariDashaService dasha)
    {
        _gpt   = gpt;
        _kp    = kp;
        _dasha = dasha;
    }

    /// <summary>
    /// Generate a KP birth chart from birth details (no auth required).
    /// Returns a compact chart context string to pass with all subsequent chat calls.
    /// </summary>
    [HttpPost("cast-chart")]
    public async Task<IActionResult> CastChart(
        [FromBody] CastChartRequest req,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { error = "Name is required." });
        if (string.IsNullOrWhiteSpace(req.PlaceOfBirth))
            return BadRequest(new { error = "Place of birth is required." });

        // Parse "City, State, Country" from the free-text place field
        var parts   = req.PlaceOfBirth.Split(',', StringSplitOptions.TrimEntries);
        var city    = parts.Length > 0 ? parts[0] : req.PlaceOfBirth;
        var state   = parts.Length > 1 ? parts[1] : string.Empty;
        var country = parts.Length > 2 ? parts[2] : string.Empty;

        var chartReq = new BirthChartRequest(
            City:      city,
            State:     state,
            Country:   country,
            BirthDate: req.BirthDate,
            BirthTime: req.BirthTime);

        var chart = await _kp.GenerateSouthIndianChartAsync(chartReq, ct);

        // Compute Vimshottari dasha from Moon position
        var moon   = chart.Planets.FirstOrDefault(p =>
            string.Equals(p.Name, "Moon", StringComparison.OrdinalIgnoreCase));
        var now    = DateTime.UtcNow;
        var dasha  = moon is not null
            ? _dasha.ComputeCurrent(chart.BirthDateTimeUtc, now, moon.SiderealLongitude, moon.Nakshatra)
            : new DashaStatus("Unknown", new DashaPeriod("Unknown", now, now),
                              "Unknown", new DashaPeriod("Unknown", now, now));

        // Build compact chart context string for GPT
        var planets = string.Join(", ", chart.Planets
            .Select(p => $"{p.Name}:{p.Sign} H{p.House}"));
        var houses = string.Join(", ", chart.Houses
            .Select(h => $"H{h.Number}:{h.Sign}" +
                (h.Occupants.Any() ? $"[{string.Join(",", h.Occupants)}]" : "")));

        var moonSign = moon?.Sign ?? "Unknown";
        var sunPlanet = chart.Planets.FirstOrDefault(p =>
            string.Equals(p.Name, "Sun", StringComparison.OrdinalIgnoreCase));
        var sunSign = sunPlanet?.Sign ?? "Unknown";

        var context =
            $"Name: {req.Name} | " +
            $"DOB: {req.BirthDate:yyyy-MM-dd} {req.BirthTime:HH:mm} | " +
            $"Place: {req.PlaceOfBirth}\n" +
            $"System: KP | Ayanamsha: {chart.AyanamshaName} ({chart.AyanamshaDegrees:F4}°)\n" +
            $"Ascendant: {chart.AscendantSign} ({chart.AscendantSiderealLongitude:F2}°) | " +
            $"Moon: {moonSign} | Sun: {sunSign}\n" +
            $"Planets: {planets}\n" +
            $"Houses: {houses}\n" +
            $"Current Dasha: {dasha.MahaDashaLord}/{dasha.AntarDashaLord} " +
            $"[Maha: {dasha.MahaPeriod.StartUtc:yyyy-MM-dd}..{dasha.MahaPeriod.EndUtc:yyyy-MM-dd}] " +
            $"[Antar: {dasha.AntarPeriod.StartUtc:yyyy-MM-dd}..{dasha.AntarPeriod.EndUtc:yyyy-MM-dd}]";

        return Ok(new CastChartResponse(
            ChartContext:       context,
            AscendantSign:      chart.AscendantSign,
            MoonSign:           moonSign,
            SunSign:            sunSign,
            CurrentMahaDasha:   dasha.MahaDashaLord,
            CurrentAntarDasha:  dasha.AntarDashaLord));
    }

    /// <summary>
    /// Chat with Pandit Arjun – the virtual Vedic astrologer.
    /// No authentication required so free questions work for anonymous users too.
    /// </summary>
    [HttpPost("chat")]
    public async Task<IActionResult> Chat(
        [FromBody] AstrologerChatRequest req,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.NewMessage))
            return BadRequest(new { error = "Message cannot be empty." });

        if (req.NewMessage.Length > 1000)
            return BadRequest(new { error = "Message is too long (max 1000 characters)." });

        var response = await _gpt.AstrologerChatAsync(req, ct);
        return Ok(response);
    }
}
