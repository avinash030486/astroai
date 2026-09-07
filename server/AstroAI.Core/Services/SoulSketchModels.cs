namespace AstroAI.Core.Services;

public record SoulSketchHttpRequest(
    string BirthDate,      // YYYY-MM-DD
    string BirthTime,      // HH:mm:ss
    string City,
    string State,
    string Country,
    string Gender,         // "male" | "female" | "non-binary"
    string PartnerGender); // "male" | "female" | "any"

public record SoulSketchTrait(string Label, string Value);

public record SoulSketchResponse(
    string ImageUrl,
    string VisualDescription,
    string OriginReading,
    string MarriageAgeReading,
    string SoulmateNarrative,
    SoulSketchTrait[] AstroTraits);
