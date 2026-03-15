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

    public TransitsController(IGptAstrologyService gpt) => _gpt = gpt;

    public sealed record TransitRequest(string ZodiacSign);

    [HttpPost("current")]
    [ResponseCache(Duration = 3600)] // cache 1 hour - transits don't change minute by minute
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
}
