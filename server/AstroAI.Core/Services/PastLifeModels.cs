namespace AstroAI.Core.Services;

// ── Request ───────────────────────────────────────────────────────────────────
public sealed record PastLifeRequest(
    DateOnly BirthDate,
    TimeOnly BirthTime,
    string City,
    string State,
    string Country);

// ── Response model ────────────────────────────────────────────────────────────
public sealed record PastLifeResponse(
    /// <summary>Dominant karmic signature from the natal chart.</summary>
    string KarmicSignature,
    /// <summary>Core soul lesson this lifetime (Nadi-style interpretation of Saturn, Rahu, 12th house).</summary>
    string SoulLesson,
    /// <summary>Who you were in a past life — role, era, probable region.</summary>
    PastLifeNarrative PreviousLife,
    /// <summary>Karmic debts carried forward (6th / 8th / 12th + Rahu-Ketu axis).</summary>
    IReadOnlyList<KarmicDebt> KarmicDebts,
    /// <summary>Talents and gifts brought from past lives (5th house, benefic stelliums).</summary>
    IReadOnlyList<string> InheritedGifts,
    /// <summary>Karmic relationships indicated in this chart (7th, 5th, 4th lord connections).</summary>
    IReadOnlyList<KarmicRelationship> KarmicRelationships,
    /// <summary>Purpose of THIS lifetime (1st, 9th, 10th house synthesis).</summary>
    string CurrentLifePurpose,
    /// <summary>Spiritual path suggested (strong planets, atmakaraka, 9th lord).</summary>
    string SpiritualPath,
    /// <summary>Nadi-specific indicators found in the chart.</summary>
    IReadOnlyList<string> NadiIndicators,
    /// <summary>Remedies to clear karmic debts in this lifetime.</summary>
    IReadOnlyList<string> KarmicRemedies,
    string Disclaimer);

public sealed record PastLifeNarrative(
    string Era,           // e.g. "Ancient India, 500–200 BCE"
    string Role,          // e.g. "Scholar or temple priest"
    string Region,        // e.g. "Southern Indian subcontinent"
    string KeyExperiences,
    string UnfinishedBusiness);

public sealed record KarmicDebt(
    string Planet,        // Planet creating the debt
    string House,         // House involved
    string Description,
    string Resolution);   // How to resolve in this life

public sealed record KarmicRelationship(
    string Type,          // "Twin Flame", "Karmic Teacher", "Soul Contract"
    string PlanetIndicator,
    string Description,
    string Lesson);
