namespace AstroAI.Core.Services;

public interface IGptLocationService
{
    Task<(double Latitude, double Longitude)> GetCoordinatesAsync(
        string city, string state, string country, CancellationToken ct);

    /// <summary>
    /// Given coordinates and country context, returns a best-effort Windows time zone ID
    /// such as "Eastern Standard Time" or "India Standard Time".
    /// Returns null if the LLM cannot determine a valid time zone.
    /// </summary>
    Task<string?> GetWindowsTimeZoneIdAsync(
        double latitude, double longitude, string country, CancellationToken ct);
}
