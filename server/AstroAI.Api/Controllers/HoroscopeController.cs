using AstroAI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AstroAI.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class HoroscopeController : ControllerBase
{
    private readonly IKpHoroscopeService _kp;

    public HoroscopeController(IKpHoroscopeService kp) => _kp = kp;

    [HttpPost("south-indian")]
    public async Task<IActionResult> SouthIndian([FromBody] BirthChartRequest req, CancellationToken ct)
    {
        var chart = await _kp.GenerateSouthIndianChartAsync(req, ct);
        return Ok(chart);
    }

    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] AskQuestionRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Question))
        {
            return BadRequest("Question cannot be empty.");
        }

        var answer = await _kp.AskQuestionAsync(req, ct);
        return Ok(answer);
    }
}
