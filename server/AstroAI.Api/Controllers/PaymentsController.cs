using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace AstroAI.Api.Controllers
{
    public record PaymentRequestDto(string Plan, decimal AmountUsd);

    public record PaymentResultDto(bool Success, string? Error);

    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        [HttpPost("charge")]
        public async Task<ActionResult<PaymentResultDto>> Charge([FromBody] PaymentRequestDto request, CancellationToken ct)
        {
            // TODO: Integrate real Stripe payment logic here.
            // For now, this is a stub that always succeeds if amount is positive.

            await Task.CompletedTask;

            if (request.AmountUsd <= 0)
            {
                return BadRequest(new PaymentResultDto(false, "Invalid payment amount."));
            }

            return Ok(new PaymentResultDto(true, null));
        }
    }
}
