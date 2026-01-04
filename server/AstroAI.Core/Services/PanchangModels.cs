using System;

namespace AstroAI.Core.Services;

public sealed record GeoPoint(double Latitude, double Longitude, string ResolvedLocation);

public sealed record PanchangTimes(
    string Sunrise,
    string Sunset,
    string Moonrise,
    string Moonset,
    string RahuKaal,
    string Yamaganda,
    string Gulika,
    string AbhijitMuhurta
);

public sealed record DailyPanchangResponse(
    DateTime DateUtc,
    GeoPoint Coordinates,
    string Weekday,
    string Tithi,
    string Nakshatra,
    string Yoga,
    string Karana,
    string MoonSign,
    string SunSign,
    PanchangTimes Times,
    string Notes
);
