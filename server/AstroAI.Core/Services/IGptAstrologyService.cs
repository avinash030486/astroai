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
}
