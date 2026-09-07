namespace AstroAI.Core.Services;

public sealed record FaceReadingRequest(string ImageBase64, string NakshatraName, string NakshatraPlanet);

public sealed record FaceReadingResponse(
    string CosmicSummary,       // 3-4 sentence overview tying face features to Nakshatra energy
    string FaceShape,           // e.g. "Oval / Pitta"
    string DominantElement,     // Fire / Earth / Air / Water
    string EnergyType,          // e.g. "Solar – radiant, commanding"
    FaceFeatureReading Eyes,
    FaceFeatureReading Nose,
    FaceFeatureReading Lips,
    FaceFeatureReading Forehead,
    FaceFeatureReading Jawline,
    NakshatraAlignment NakshatraMatch,
    string[] Strengths,
    string[] Challenges,
    string[] LifeGuidance,
    string LuckyColor,
    string PowerDay,
    string Mantra,
    string Disclaimer
);

public sealed record FaceFeatureReading(
    string Feature,
    string Observation,
    string VedicMeaning,
    string Prediction
);

public sealed record NakshatraAlignment(
    string Nakshatra,
    string AlignmentLevel,    // "Strong", "Moderate", "Developing"
    string AlignmentMessage   // How face features confirm/complement the Nakshatra energy
);
