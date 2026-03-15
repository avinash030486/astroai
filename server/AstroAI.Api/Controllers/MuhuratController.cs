using AstroAI.Core.Services;
using AstroAI.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AstroAI.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class MuhuratController : ControllerBase
{
    private readonly IGptAstrologyService _gpt;
    private readonly IKpHoroscopeService _kp;

    public MuhuratController(IGptAstrologyService gpt, IKpHoroscopeService kp)
    {
        _gpt = gpt;
        _kp = kp;
    }

    public sealed record MuhuratHttpRequest(
        string ActivityType,
        string City,
        string State,
        string Country,
        string FromDate,   // YYYY-MM-DD
        string ToDate);    // YYYY-MM-DD

    [HttpPost("calculate")]
    public async Task<IActionResult> Calculate([FromBody] MuhuratHttpRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.ActivityType))
            return BadRequest(new { error = "ActivityType is required." });
        if (!DateOnly.TryParse(req.FromDate, out var from))
            return BadRequest(new { error = "Invalid FromDate. Use YYYY-MM-DD." });
        if (!DateOnly.TryParse(req.ToDate, out var to))
            return BadRequest(new { error = "Invalid ToDate. Use YYYY-MM-DD." });
        if (to < from)
            return BadRequest(new { error = "ToDate must be >= FromDate." });
        if ((to.ToDateTime(TimeOnly.MinValue) - from.ToDateTime(TimeOnly.MinValue)).TotalDays > 31)
            return BadRequest(new { error = "Date range cannot exceed 31 days." });

        try
        {
            var muhuratReq = new MuhuratRequest(req.ActivityType, req.City, req.State, req.Country, from, to);
            var result = await _gpt.GetMuhuratTimingsAsync(muhuratReq, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
