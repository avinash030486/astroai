using System;

namespace AstroAI.Infrastructure.Services;

/// <summary>
/// Computes KP (Krishnamurti) ayanamsha using a well-known polynomial for Lahiri (Chitrapaksha)
/// referenced to 1900-01-00 12:00 UT (JD 2415020.0). Many KP practitioners use Lahiri ayanamsha;
/// if a distinct KP offset is desired, set kpOffsetDegrees accordingly.
/// </summary>
public static class AyanamshaCalculator
{
    /// <summary>
    /// Compute KP ayanamsha degrees for the given UTC datetime.
    /// </summary>
    public static double ComputeKpAyanamshaDegrees(DateTime utc, double kpOffsetDegrees = 0.0)
    {
        // Convert to Julian Day (UTC). Meeus, Astronomical Algorithms.
        double jd = ToJulianDay(utc);
        // Centuries since 1900 Jan 0.5 UT (JD 2415020.0)
        double T = (jd - 2415020.0) / 36525.0;

        // Lahiri ayanamsha polynomial (degrees): A = 22.460148 + 1.396855*T + 0.000310*T^2
        // This widely used approximation yields ~23.856° near J2000.
        double A = 22.460148 + (1.396855 * T) + (0.000310 * T * T);

        // Apply optional KP offset if needed (default 0.0 for KP≈Lahiri practice)
        A += kpOffsetDegrees;

        // Normalize to [0, 360)
        A %= 360.0;
        if (A < 0) A += 360.0;
        return A;
    }

    private static double ToJulianDay(DateTime utc)
    {
        // Ensure UTC
        if (utc.Kind != DateTimeKind.Utc)
            utc = DateTime.SpecifyKind(utc, DateTimeKind.Utc);

        int Y = utc.Year;
        int M = utc.Month;
        double D = utc.Day + (utc.Hour + (utc.Minute + (utc.Second / 60.0)) / 60.0) / 24.0;

        int A;
        int B;
        if (M <= 2)
        {
            Y -= 1;
            M += 12;
        }
        A = Y / 100;
        B = 2 - A + (A / 4);

        double jd = Math.Floor(365.25 * (Y + 4716))
                   + Math.Floor(30.6001 * (M + 1))
                   + D + B - 1524.5;
        return jd;
    }
}
