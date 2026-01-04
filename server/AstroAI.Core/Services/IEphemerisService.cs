namespace AstroAI.Core.Services;

public interface IEphemerisService
{
    /// <summary>
    /// Returns approximate tropical ecliptic longitudes (degrees 0..360) for standard bodies at the given UTC.
    /// Names should include Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu, Ketu.
    /// </summary>
    Task<IReadOnlyDictionary<string, double>> GetTropicalLongitudesAsync(DateTime utc, CancellationToken ct);
}
