using AstroAI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AstroAI.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class GeoController : ControllerBase
{
    private readonly IGptLocationService _gpt;

    public GeoController(IGptLocationService gpt) => _gpt = gpt;

    public sealed record CoordinatesRequest(string City, string State, string Country);

    [HttpPost("coordinates")]
    public async Task<IActionResult> Coordinates([FromBody] CoordinatesRequest req, CancellationToken ct)
    {
        try
        {
            var (lat, lon) = await _gpt.GetCoordinatesAsync(req.City, req.State, req.Country, ct);
            return Ok(new { latitude = lat, longitude = lon });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
