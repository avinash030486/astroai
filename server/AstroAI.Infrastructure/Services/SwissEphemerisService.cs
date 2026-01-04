using AstroAI.Core.Services;
using System;
using System.Collections.Generic;
using SwissEphNet;

namespace AstroAI.Infrastructure.Services
{
    /// <summary>
    /// Ephemeris service backed by Swiss Ephemeris via SwissEphNet.
    /// Computes tropical ecliptic longitudes for standard bodies at UTC.
    /// </summary>
    public sealed class SwissEphemerisService : IEphemerisService
    {
        public Task<IReadOnlyDictionary<string, double>> GetTropicalLongitudesAsync(DateTime utc, CancellationToken ct)
        {
            // Convert UTC to Julian Day UT
            var swe = new SwissEph();
            double jd = swe.swe_julday(utc.Year, utc.Month, utc.Day,
                utc.Hour + (utc.Minute + utc.Second / 60.0) / 60.0,
                SwissEph.SE_GREG_CAL);

            // Flags: use Swiss Ephemeris, include speed (not used here), sidereal off (we want tropical)
            int iflag = SwissEph.SEFLG_SWIEPH | SwissEph.SEFLG_SPEED;

            // Helper to compute a body's longitude
            double BodyLon(double j, int flag, int ipl)
            {
                var xx = new double[6];
                string err = string.Empty;
                swe.swe_calc_ut(j, ipl, flag, xx, ref err);
                // xx[0] is longitude in degrees
                double lon = xx[0];
                lon %= 360.0; if (lon < 0) lon += 360.0;
                return lon;
            }

            // Compute longitudes
            var result = new Dictionary<string, double>
            {
                ["Sun"] = BodyLon(jd, iflag, SwissEph.SE_SUN),
                ["Moon"] = BodyLon(jd, iflag, SwissEph.SE_MOON),
                ["Mercury"] = BodyLon(jd, iflag, SwissEph.SE_MERCURY),
                ["Venus"] = BodyLon(jd, iflag, SwissEph.SE_VENUS),
                ["Mars"] = BodyLon(jd, iflag, SwissEph.SE_MARS),
                ["Jupiter"] = BodyLon(jd, iflag, SwissEph.SE_JUPITER),
                ["Saturn"] = BodyLon(jd, iflag, SwissEph.SE_SATURN),
                ["Rahu"] = BodyLon(jd, iflag, SwissEph.SE_MEAN_NODE)
            };
            result["Ketu"] = (result["Rahu"] + 180.0) % 360.0;

            return Task.FromResult<IReadOnlyDictionary<string, double>>(result);
        }
    }
}
