using AstroAI.Core.Configuration;
using AstroAI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace AstroAI.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class GeoController : ControllerBase
{
    private readonly IGptLocationService _gpt;
    private readonly string _googleMapsApiKey;
    private readonly HttpClient _httpClient;

    public GeoController(IGptLocationService gpt, IOptions<AstroAiSettings> settings, IHttpClientFactory httpClientFactory)
    {
        _gpt = gpt;
        _googleMapsApiKey = settings.Value.GoogleMapsApiKey;
        _httpClient = httpClientFactory.CreateClient("AstroAI.Default");
    }

    public sealed record CoordinatesRequest(string City, string State, string Country);
    public sealed record PlaceSuggestion(string Description, string PlaceId);

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

    [HttpGet("autocomplete")]
    public async Task<IActionResult> Autocomplete([FromQuery] string input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input) || input.Length < 3)
        {
            return Ok(new List<PlaceSuggestion>());
        }

        if (string.IsNullOrWhiteSpace(_googleMapsApiKey))
        {
            return BadRequest(new { error = "Google Maps API key is not configured." });
        }

        try
        {
            var url = $"https://maps.googleapis.com/maps/api/place/autocomplete/json?input={Uri.EscapeDataString(input)}&types=(cities)&key={_googleMapsApiKey}";
            var response = await _httpClient.GetAsync(url, ct);
            
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, new { error = "Failed to fetch place suggestions." });
            }

            var content = await response.Content.ReadAsStringAsync(ct);
            var jsonDoc = JsonDocument.Parse(content);
            var predictions = jsonDoc.RootElement.GetProperty("predictions");

            var suggestions = new List<PlaceSuggestion>();
            foreach (var prediction in predictions.EnumerateArray())
            {
                var description = prediction.GetProperty("description").GetString() ?? string.Empty;
                var placeId = prediction.GetProperty("place_id").GetString() ?? string.Empty;
                suggestions.Add(new PlaceSuggestion(description, placeId));
            }

            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
