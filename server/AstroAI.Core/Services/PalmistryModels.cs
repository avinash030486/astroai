namespace AstroAI.Core.Services;

// ── Request ───────────────────────────────────────────────────────────────────
/// <summary>Raw request received by the API controller — base64 JPEG of the palm.</summary>
public sealed record PalmistryRequest(
    /// <summary>data:image/jpeg;base64,... or bare base64 string.</summary>
    string ImageBase64,
    string? UserName = null);

// ── Response model ────────────────────────────────────────────────────────────
public sealed record PalmistryResponse(
    string OverallReading,
    string DominantHand,
    PalmLine LifeLine,
    PalmLine HeartLine,
    PalmLine HeadLine,
    PalmLine FateLine,
    IReadOnlyList<PalmMount> Mounts,
    IReadOnlyList<string> SpecialMarks,
    PalmPersonality Personality,
    string LuckyColor,
    string LuckyNumber,
    string SuggestedGemstone,
    IReadOnlyList<string> Remedies,
    LifePredictions LifeMilestones,
    string Disclaimer);

/// <summary>Age-range predictions derived from palm lines.</summary>
public sealed record LifePredictions(
    string MarriageAge,        // e.g. "26–29"
    string MarriageNature,     // brief quality of marriage
    string CareerBreakAge,     // age range of big career shift / success
    string CareerField,        // most suitable career field
    string HealthCrisisAge,    // age range to watch health carefully
    string HealthAdvice,       // what to watch out for
    string PropertyAge,        // age range for first major property acquisition
    string WealthPeak,         // age range of peak financial prosperity
    string ChildrenCount,      // indication of number of children
    string SpiritualAwakening, // age range / event of spiritual turning point
    IReadOnlyList<string> KeyLifeEvents); // 3-4 notable milestone summaries

public sealed record PalmLine(
    string Name,
    string Condition,   // e.g. "Deep and long"
    string Interpretation,
    string Prediction);

public sealed record PalmMount(
    string Name,        // Jupiter, Saturn, Sun, Mercury, Venus, Moon, Mars
    string Development, // Prominent / Average / Weak
    string Meaning);

public sealed record PalmPersonality(
    string Element,     // Fire / Earth / Air / Water
    string Temperament,
    string Strengths,
    string Weaknesses,
    string CareerSuggestions,
    string RelationshipNature);
