using AstroAI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AstroAI.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class FaceReadingController : ControllerBase
{
    private readonly IGptAstrologyService _gpt;

    public FaceReadingController(IGptAstrologyService gpt) => _gpt = gpt;

    public sealed record FaceReadingHttpRequest(
        /// <summary>Base64-encoded JPEG of the face selfie (data URI or bare base64).</summary>
        string ImageBase64,
        string NakshatraName,
        string NakshatraPlanet);

    [HttpPost("analyze")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB max
    public async Task<IActionResult> Analyze([FromBody] FaceReadingHttpRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.ImageBase64))
            return BadRequest(new { error = "ImageBase64 is required." });

        if (string.IsNullOrWhiteSpace(req.NakshatraName))
            return BadRequest(new { error = "NakshatraName is required." });

        try
        {
            var result = await _gpt.AnalyzeFaceAsync(
                new FaceReadingRequest(req.ImageBase64, req.NakshatraName, req.NakshatraPlanet ?? "Moon"),
                ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (OperationCanceledException)
        {
            return StatusCode(504, new { error = "Face analysis timed out. Please try again." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
