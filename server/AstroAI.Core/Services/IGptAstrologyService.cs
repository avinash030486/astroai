namespace AstroAI.Core.Services;

public interface IGptAstrologyService
{
    Task<string> GenerateNatalReadingAsync(string fullName, DateOnly birthDate, TimeOnly birthTime, string birthPlace, string focusArea, CancellationToken ct);
    Task<string> GenerateHoroscopeAsync(string zodiacSign, string period, CancellationToken ct);
    Task<BasicChartPredictionResponse> GenerateBasicChartPredictionAsync(BasicChartPredictionRequest chart, DashaStatus dasha, int ageYears, CancellationToken ct);
    Task<DetailedChartPredictionResponse> GenerateDetailedPredictionAsync(BasicChartPredictionRequest chart, DashaStatus dasha, int ageYears, CancellationToken ct);
    Task<DailyPredictionsResponse> GetDailyPredictionsAsync(CancellationToken ct);
    Task<DailyPanchangResponse> GetDailyPanchangAsync(string location, DateTime? dateUtc, CancellationToken ct);
    Task<AskQuestionResponse> AnswerQuestionAsync(AskQuestionPayload payload, CancellationToken ct);
    
    Task<MatchmakingResponse> GenerateMatchmakingAnalysisAsync(
        SouthIndianChart person1Chart,
        SouthIndianChart person2Chart,
        DashaStatus person1Dasha,
        DashaStatus person2Dasha,
        string person1Name,
        string person2Name,
        CancellationToken ct);
    
    Task<YearlyHoroscopeResponse> GenerateYearlyHoroscopeAsync(
        SouthIndianChart chart,
        DashaStatus currentDasha,
        int targetYear,
        CancellationToken ct);
    
    Task<PersonalizedRemediesResponse> GeneratePersonalizedRemediesAsync(
        SouthIndianChart chart,
        DashaStatus dasha,
        IReadOnlyList<string> areasOfConcern,
        CancellationToken ct);

    Task<TransitAlertsResponse> GetTransitAlertsAsync(string zodiacSign, CancellationToken ct);

    // New richer transit endpoints
    Task<IReadOnlyList<ZodiacTransitSummary>> GetAllZodiacSummariesAsync(CancellationToken ct);
    Task<DetailedTransitResponse> GetDetailedTransitAsync(string zodiacSign, CancellationToken ct);
    Task<MonthlyTransitResponse> GetMonthlyTransitAsync(string zodiacSign, CancellationToken ct);

    Task<MuhuratResponse> GetMuhuratTimingsAsync(MuhuratRequest request, CancellationToken ct);

    Task<GemstoneResponse> GetGemstoneRecommendationAsync(
        SouthIndianChart chart,
        DashaStatus dasha,
        CancellationToken ct);

    Task<AstrologerChatResponse> AstrologerChatAsync(
        AstrologerChatRequest request,
        CancellationToken ct);

    /// <summary>
    /// Analyse a palm photo using GPT-4 Vision and return a full Vedic palmistry reading.
    /// </summary>
    Task<PalmistryResponse> AnalyzePalmAsync(PalmistryRequest request, CancellationToken ct);

    /// <summary>
    /// Analyse a face selfie using GPT-4 Vision, cross-referenced with the user's Moon Nakshatra,
    /// and return a Vedic Samudrika Shastra face-reading.
    /// </summary>
    Task<FaceReadingResponse> AnalyzeFaceAsync(FaceReadingRequest request, CancellationToken ct);

    /// <summary>
    /// Generate a Nadi Jyotisha-style past-life analysis from the natal chart.
    /// </summary>
    Task<PastLifeResponse> GeneratePastLifeAnalysisAsync(SouthIndianChart chart, DashaStatus dasha, CancellationToken ct);

    /// <summary>
    /// Analyse Venus, 7th house, Navamsha and Rahu to paint an AI portrait of the native's soulmate.
    /// </summary>
    Task<SoulSketchResponse> GenerateSoulSketchAsync(
        SouthIndianChart chart,
        DashaStatus dasha,
        string gender,
        string partnerGender,
        string birthCity,
        string birthState,
        string birthCountry,
        CancellationToken ct);
}
