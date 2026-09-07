using AstroAI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AstroAI.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class PalmistryController : ControllerBase
{
    private readonly IGptAstrologyService _gpt;

    public PalmistryController(IGptAstrologyService gpt) => _gpt = gpt;

    public sealed record PalmistryHttpRequest(
        /// <summary>Base64-encoded JPEG of the palm (data URI or bare base64).</summary>
        string ImageBase64,
        string? UserName = null);

    [HttpPost("analyze")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB max image
    public async Task<IActionResult> Analyze([FromBody] PalmistryHttpRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.ImageBase64))
            return BadRequest(new { error = "ImageBase64 is required." });

        try
        {
            var result = await _gpt.AnalyzePalmAsync(
                new PalmistryRequest(req.ImageBase64, req.UserName), ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
