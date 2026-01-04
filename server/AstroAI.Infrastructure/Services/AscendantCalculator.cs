using System;

namespace AstroAI.Infrastructure.Services;

public static class AscendantCalculator
{
    // Compute tropical ascendant ecliptic longitude in degrees for given UTC, latitude, longitude (deg, East positive)
    public static double ComputeTropicalAscendantLongitude(DateTime utc, double latitudeDeg, double longitudeDeg)
    {
        // Julian Day
        double jd = ToJulianDay(utc);
        // Days since J2000.0
        double D = jd - 2451545.0;
        // GMST in hours (approx, Meeus)
        double GMST = 18.697374558 + 24.06570982441908 * D;
        GMST = Mod(GMST, 24.0);
        // Local sidereal time in hours
        double LST = GMST + (longitudeDeg / 15.0);
        LST = Mod(LST, 24.0);
        double LSTRad = Deg2Rad(LST * 15.0);

        // Mean obliquity of the ecliptic (arcseconds polynomial) converted to degrees
        double T = (jd - 2451545.0) / 36525.0; // centuries from J2000.0
        double epsArcsec = 84381.448 - 46.8150 * T - 0.00059 * T * T + 0.001813 * T * T * T;
        double eps = epsArcsec / 3600.0;
        double epsRad = Deg2Rad(eps);

        double phi = Deg2Rad(latitudeDeg);

    // Ascendant longitude (robust form; Meeus)
    // tan(λ) = (sin(Θ)·cos(ε) − tan(φ)·sin(ε)) / cos(Θ)
    double num = Math.Sin(LSTRad) * Math.Cos(epsRad) - Math.Tan(phi) * Math.Sin(epsRad);
    double den = Math.Cos(LSTRad);
    double lambdaRad = Math.Atan2(num, den);
        double lambdaDeg = Rad2Deg(lambdaRad);
        return NormalizeDegrees(lambdaDeg);
    }

    public static double NormalizeDegrees(double deg)
    {
        deg %= 360.0;
        return deg < 0 ? deg + 360.0 : deg;
    }

    private static double Deg2Rad(double d) => Math.PI * d / 180.0;
    private static double Rad2Deg(double r) => 180.0 * r / Math.PI;
    private static double Mod(double x, double m)
    {
        double r = x % m;
        return r < 0 ? r + m : r;
    }

    private static double ToJulianDay(DateTime utc)
    {
        if (utc.Kind != DateTimeKind.Utc)
            utc = DateTime.SpecifyKind(utc, DateTimeKind.Utc);

        int Y = utc.Year;
        int M = utc.Month;
        double D = utc.Day + (utc.Hour + (utc.Minute + (utc.Second / 60.0)) / 60.0) / 24.0;

        if (M <= 2)
        {
            Y -= 1; M += 12;
        }
        int A = Y / 100;
        int B = 2 - A + (A / 4);
        double jd = Math.Floor(365.25 * (Y + 4716))
                   + Math.Floor(30.6001 * (M + 1))
                   + D + B - 1524.5;
        return jd;
    }
}
