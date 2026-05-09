using Microsoft.AspNetCore.Mvc;
using AstroAI.Core.Services;
using AstroAI.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;

namespace AstroAI.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class PredictionsController : ControllerBase
{
    private readonly IGptAstrologyService _gpt;
    private readonly IVimshottariDashaService _dasha;
    private readonly IEphemerisService _ephemeris;

    public PredictionsController(IGptAstrologyService gpt, IVimshottariDashaService dasha, IEphemerisService ephemeris)
    {
        _gpt = gpt;
        _dasha = dasha;
        _ephemeris = ephemeris;
    }

    /// <summary>
    /// Returns accurate Moon nakshatra, sign and Rahu Kalam for today using Swiss Ephemeris.
    /// No auth required — used by the public Cosmic Today page.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("get-moon-position")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> GetMoonPosition(CancellationToken ct)
    {
        var utcNow = DateTime.UtcNow;
        var lons = await _ephemeris.GetTropicalLongitudesAsync(utcNow, ct);

        double moonTropical = lons["Moon"];
        // Lahiri ayanamsha to convert tropical → sidereal
        double ayanamsha = AyanamshaCalculator.ComputeKpAyanamshaDegrees(utcNow);
        double moonSidereal = (moonTropical - ayanamsha + 360.0) % 360.0;

        // Nakshatra (27 equal divisions of 360° = 13°20’ each)
        int nakIdx = (int)(moonSidereal / (360.0 / 27.0));
        string[] nakshatras = {
            "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra",
            "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
            "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
            "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha","Shatabhisha",
            "Purva Bhadrapada","Uttara Bhadrapada","Revati"
        };
        string nakshatra = nakshatras[Math.Clamp(nakIdx, 0, 26)];

        // Rashi / Moon sign (12 equal divisions of 360° = 30° each)
        string[] signs = {
            "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
            "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
        };
        int signIdx = (int)(moonSidereal / 30.0);
        string moonSign = signs[Math.Clamp(signIdx, 0, 11)];

        // Rahu Kalam (approximate; based on weekday + sunrise ~6 AM)
        // Offsets in 90-min slots: Sun=8th, Mon=2nd, Tue=7th, Wed=5th, Thu=6th, Fri=4th, Sat=3rd
        int[] rahuSlots = { 7, 1, 6, 4, 5, 3, 2 }; // index by DayOfWeek (0=Sun)
        int slot = rahuSlots[(int)utcNow.DayOfWeek];
        // Approximate local sunrise at 6:00, each slot is 90 min
        int rahuStartMin = 6 * 60 + slot * 90;
        int rahuEndMin   = rahuStartMin + 90;
        string FormatTime(int totalMin) => $"{totalMin / 60:D2}:{totalMin % 60:D2}";
        string rahuKalam = $"{FormatTime(rahuStartMin)}–{FormatTime(rahuEndMin)}";

        return Ok(new
        {
            nakshatra,
            moonSign,
            moonSiderealDegrees = Math.Round(moonSidereal, 4),
            ayanamsha = Math.Round(ayanamsha, 4),
            rahuKalam,
            computedAtUtc = utcNow
        });
    }
    [HttpPost("natal")]
    public async Task<IActionResult> Natal([FromBody] NatalRequest req, CancellationToken ct)
        => Ok(new { summary = await _gpt.GenerateNatalReadingAsync(req.FullName, req.BirthDate, req.BirthTime, req.BirthPlace, req.FocusArea, ct) });

    [HttpPost("horoscope")]
    public async Task<IActionResult> Horoscope([FromBody] HoroscopeRequest req, CancellationToken ct)
        => Ok(new { summary = await _gpt.GenerateHoroscopeAsync(req.ZodiacSign, req.Period, ct) });

    [HttpPost("generate-basic-chart-prediction")]
    public async Task<IActionResult> GenerateBasicChartPrediction([FromBody] BasicChartPredictionRequest req, CancellationToken ct)
    {
        // Validate birth/current timestamps - DOB is required
        if (req.BirthDateTimeUtc is null)
            return BadRequest(new { error = "BirthDateTimeUtc is required to compute Vimshottari dasha and age." });
        var birthUtc = req.BirthDateTimeUtc.Value;
        var currentUtc = req.CurrentDateTimeUtc ?? DateTime.UtcNow;

        // Extract Moon info
        var moon = req.Planets.FirstOrDefault(p => string.Equals(p.Name, "Moon", StringComparison.OrdinalIgnoreCase));
        if (moon is null)
            return BadRequest(new { error = "Moon position is required to compute Vimshottari dasha." });

        var status = _dasha.ComputeCurrent(birthUtc, currentUtc, moon.SiderealLongitude, moon.Nakshatra);

    // Age in years (Gregorian)
    var ageYears = (int)Math.Floor((currentUtc - birthUtc).TotalDays / 365.2425);

        // Defer the full analysis to OpenAI and return the model parsed from GPT
        var resp = await _gpt.GenerateBasicChartPredictionAsync(req, status, ageYears, ct);
        return Ok(resp);
    }

    [HttpPost("generate-detailed-prediction")]
    public async Task<IActionResult> GenerateDetailedPrediction([FromBody] BasicChartPredictionRequest req, CancellationToken ct)
    {
        if (req.BirthDateTimeUtc is null)
            return BadRequest(new { error = "BirthDateTimeUtc is required to compute Vimshottari dasha and age." });
        var birthUtc = req.BirthDateTimeUtc.Value;
        var currentUtc = req.CurrentDateTimeUtc ?? DateTime.UtcNow;

        var moon = req.Planets.FirstOrDefault(p => string.Equals(p.Name, "Moon", StringComparison.OrdinalIgnoreCase));
        if (moon is null)
            return BadRequest(new { error = "Moon position is required to compute Vimshottari dasha." });

        var status = _dasha.ComputeCurrent(birthUtc, currentUtc, moon.SiderealLongitude, moon.Nakshatra);
        var ageYears = (int)Math.Floor((currentUtc - birthUtc).TotalDays / 365.2425);

        var resp = await _gpt.GenerateDetailedPredictionAsync(req, status, ageYears, ct);
        return Ok(resp);
    }

    [HttpGet("get-daily-predictions")]
    public async Task<IActionResult> GetDailyPredictions(CancellationToken ct)
        => Ok(await _gpt.GetDailyPredictionsAsync(ct));

    [HttpPost("get-daily-panchang")]
    [ResponseCache(Duration = 1800, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "*" })]
    public async Task<IActionResult> GetDailyPanchang([FromBody] DailyPanchangRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Location))
            return BadRequest(new { error = "Location is required (e.g., \"Trivandrum, Kerala, India\")." });
        var result = await _gpt.GetDailyPanchangAsync(req.Location!, req.DateUtc, ct);
        return Ok(result);
    }

    [HttpPost("get-numerology-details")]
    public IActionResult GetNumerologyDetails([FromBody] NumerologyRequest req)
    {
        if (req.BirthDate == default)
            return BadRequest(new { error = "BirthDate is required." });

        // Calculate numerology numbers
        var lifePathNumber = CalculateLifePathNumber(req.BirthDate);
        var destinyNumber = CalculateDestinyNumber(req.BirthDate);
        var soulUrgeNumber = CalculateSoulUrgeNumber(req.BirthDate);
        
        // Generate predictions based on numerology
        var luckyNumbers = GetLuckyNumbers(lifePathNumber, destinyNumber);
        var careerDirection = GetCareerDirection(lifePathNumber);
        var lovePrediction = GetLovePrediction(lifePathNumber);
        var moneyPrediction = GetMoneyPrediction(destinyNumber);
        var remedies = GetRemedies(lifePathNumber, destinyNumber);

        var response = new NumerologyDetailsResponse(
            lifePathNumber,
            destinyNumber,
            soulUrgeNumber,
            luckyNumbers,
            careerDirection,
            lovePrediction,
            moneyPrediction,
            remedies
        );

        return Ok(response);
    }

    private static int CalculateLifePathNumber(DateOnly birthDate)
    {
        // Life Path = reduced sum of full birth date
        int day = birthDate.Day;
        int month = birthDate.Month;
        int year = birthDate.Year;

        int sum = ReduceToSingleDigit(day) + ReduceToSingleDigit(month) + ReduceToSingleDigit(year);
        return ReduceToSingleDigit(sum);
    }

    private static int CalculateDestinyNumber(DateOnly birthDate)
    {
        // Destiny Number = reduced sum of day + month
        int day = birthDate.Day;
        int month = birthDate.Month;

        int sum = ReduceToSingleDigit(day) + ReduceToSingleDigit(month);
        return ReduceToSingleDigit(sum);
    }

    private static int CalculateSoulUrgeNumber(DateOnly birthDate)
    {
        // Soul Urge = reduced sum of year digits
        int year = birthDate.Year;
        return ReduceToSingleDigit(year);
    }

    private static int ReduceToSingleDigit(int number)
    {
        // Keep master numbers 11, 22, 33
        if (number == 11 || number == 22 || number == 33)
            return number;

        while (number > 9)
        {
            int sum = 0;
            while (number > 0)
            {
                sum += number % 10;
                number /= 10;
            }
            number = sum;
        }
        return number;
    }

    private static IReadOnlyList<int> GetLuckyNumbers(int lifePathNumber, int destinyNumber)
    {
        var luckyNumbers = new List<int> { lifePathNumber, destinyNumber };
        
        // Add complementary numbers
        luckyNumbers.Add((lifePathNumber + destinyNumber) % 9 == 0 ? 9 : (lifePathNumber + destinyNumber) % 9);
        luckyNumbers.Add((lifePathNumber * 2) % 9 == 0 ? 9 : (lifePathNumber * 2) % 9);
        luckyNumbers.Add((destinyNumber * 3) % 9 == 0 ? 9 : (destinyNumber * 3) % 9);

        return luckyNumbers.Distinct().OrderBy(n => n).ToList();
    }

    private static string GetCareerDirection(int lifePathNumber)
    {
        return lifePathNumber switch
        {
            1 => "Leadership, entrepreneurship, innovation, and independent ventures. You excel in pioneering roles where you can take initiative and make autonomous decisions.",
            2 => "Diplomacy, counseling, partnership roles, and collaborative work. You thrive in environments that require mediation, cooperation, and building relationships.",
            3 => "Creative arts, communication, entertainment, and expression. Your natural talent for self-expression makes you ideal for writing, speaking, or performing arts.",
            4 => "Organization, management, building, and systematic work. You're suited for careers requiring structure, discipline, and attention to detail.",
            5 => "Travel, sales, marketing, and dynamic environments. You flourish in roles that offer variety, freedom, and opportunities to explore new ideas.",
            6 => "Teaching, healing, counseling, and service to others. Your nurturing nature makes you perfect for roles that involve caring for and guiding others.",
            7 => "Research, analysis, spirituality, and specialized knowledge. You excel in fields requiring deep thinking, investigation, and intellectual pursuit.",
            8 => "Business, finance, executive roles, and material success. Your strong sense of authority and ambition drives you toward positions of power and wealth.",
            9 => "Humanitarian work, philanthropy, arts, and global causes. You're drawn to careers that make a meaningful impact on society and humanity.",
            11 => "Spiritual teaching, inspiration, invention, and enlightenment. As a master number, you have the potential to inspire and uplift others through visionary work.",
            22 => "Master builder, large-scale projects, and transformative enterprises. You have the ability to turn grand visions into concrete reality.",
            33 => "Master teacher, healing on a global scale, and selfless service. Your calling is to nurture and guide humanity toward higher consciousness.",
            _ => "Explore diverse fields and trust your intuition to find your true calling."
        };
    }

    private static string GetLovePrediction(int lifePathNumber)
    {
        return lifePathNumber switch
        {
            1 => "You seek independence in relationships and need a partner who respects your autonomy. You're passionate and direct in love but may struggle with compromise. Best matches: 3, 5, 6.",
            2 => "You're a natural peacemaker and romantic, seeking harmony and deep emotional connection. You thrive with partners who appreciate your sensitivity and devotion. Best matches: 4, 6, 8.",
            3 => "You bring joy and creativity to relationships, seeking fun and self-expression. You need a partner who appreciates your spontaneity and social nature. Best matches: 1, 5, 7.",
            4 => "You value stability, loyalty, and commitment. You're practical in love and build relationships on trust and shared goals. Best matches: 2, 7, 8.",
            5 => "You crave freedom and adventure in love. You need space and variety, and work best with partners who share your love of exploration. Best matches: 1, 3, 7.",
            6 => "You're the ultimate nurturer, seeking to create a harmonious home and family. You're devoted and responsible in relationships. Best matches: 1, 2, 8, 9.",
            7 => "You seek intellectual and spiritual connection. You need alone time and a partner who respects your inner world. Best matches: 3, 4, 5.",
            8 => "You approach love with intensity and dedication. You seek a powerful partnership built on mutual respect and shared ambitions. Best matches: 2, 4, 6.",
            9 => "You love unconditionally and seek a partner who shares your humanitarian values. You're compassionate but may struggle with boundaries. Best matches: 6, 9.",
            11 => "You seek a spiritual connection and deep understanding. You're idealistic in love and need a partner who matches your intensity. Best matches: 2, 6, 9.",
            22 => "You need a partner who supports your grand visions and understands your drive. You balance material success with emotional depth. Best matches: 4, 6, 8.",
            33 => "You give selflessly in love and seek a partner who shares your desire to serve humanity. Your love transcends the personal. Best matches: 6, 9, 11.",
            _ => "Follow your heart and seek genuine connection based on mutual understanding and respect."
        };
    }

    private static string GetMoneyPrediction(int destinyNumber)
    {
        return destinyNumber switch
        {
            1 => "You have strong potential for financial independence and success through original ideas. Money comes through leadership and innovation. Take calculated risks and trust your entrepreneurial instincts.",
            2 => "Your financial success comes through partnerships and collaboration. You attract wealth by supporting others and working in teams. Patience and diplomacy are your wealth-building tools.",
            3 => "Money flows through creative endeavors and communication. Your optimistic nature attracts opportunities. Diversify income streams and use your talents for self-expression.",
            4 => "You build wealth slowly and steadily through hard work and discipline. Financial security comes from practical investments and systematic savings. Real estate and traditional methods favor you.",
            5 => "Your finances fluctuate with your adventurous nature. Money comes through adaptability, travel, and multiple ventures. Embrace change but maintain a financial cushion.",
            6 => "You attract wealth through service, teaching, and caring professions. Financial stability comes from responsible management and helping others. Family businesses may prosper.",
            7 => "Money comes through specialized knowledge, research, and intellectual pursuits. You may earn through teaching, consulting, or spiritual work. Quality over quantity in financial matters.",
            8 => "You have strong potential for material abundance and wealth. Money comes through business, executive roles, and investments. You understand power and finance naturally. Think big.",
            9 => "Your wealth comes through humanitarian efforts and serving the greater good. Money flows when you're aligned with your mission. Generosity attracts more abundance.",
            11 => "Financial success comes through inspired ideas and spiritual work. You attract resources when aligned with your higher purpose. Multiple income streams through creative inspiration.",
            22 => "You have the potential for significant wealth through large-scale enterprises. Your practical vision can create lasting material legacy. Think global, act strategically.",
            33 => "Money comes as a byproduct of your service to humanity. Financial resources flow to support your healing and teaching work. Trust in abundance while staying mission-focused.",
            _ => "Balance practical effort with optimism. Money follows consistent action and positive mindset."
        };
    }

    private static IReadOnlyList<string> GetRemedies(int lifePathNumber, int destinyNumber)
    {
        var remedies = new List<string>();

        // General remedies based on life path number
        remedies.Add(lifePathNumber switch
        {
            1 => "Wear ruby or red gemstones. Meditate on Sunday mornings. Practice self-confidence affirmations daily.",
            2 => "Wear pearls or white moonstone. Practice moon meditation on Mondays. Cultivate patience and emotional balance.",
            3 => "Wear yellow sapphire or citrine. Engage in creative activities daily. Practice gratitude and joyful expression.",
            4 => "Wear blue sapphire or hessonite. Establish daily routines. Practice grounding exercises and connect with nature.",
            5 => "Wear emerald or green gemstones. Embrace flexibility. Practice breathing exercises and stay open to change.",
            6 => "Wear diamond or clear quartz. Focus on family harmony. Practice acts of service and maintain work-life balance.",
            7 => "Wear cat's eye or amethyst. Spend time in solitude. Practice meditation and develop your spiritual practice.",
            8 => "Wear blue sapphire or black tourmaline. Set clear goals. Practice discipline and ethical business practices.",
            9 => "Wear red coral or garnet. Serve humanitarian causes. Practice forgiveness and let go of attachments.",
            11 => "Wear clear quartz or selenite. Follow your intuition. Practice spiritual development and inspire others.",
            22 => "Wear combination of earth stones. Build your vision systematically. Practice manifestation techniques.",
            33 => "Wear emerald or rose quartz. Engage in healing work. Practice self-care while serving others.",
            _ => "Wear gemstones that resonate with you. Maintain positive energy through regular spiritual practice."
        });

        // Additional remedies
        remedies.Add($"Donate to charity on days matching your lucky numbers: {string.Join(", ", GetLuckyNumbers(lifePathNumber, destinyNumber))}.");
        remedies.Add("Chant your personal mantra based on your birth date: Om followed by your life path number times. Example: 'Om' chanted 3 times for life path 3.");
        remedies.Add("Keep your living space organized and decluttered to allow positive energy flow.");
        remedies.Add("Practice daily gratitude journaling, especially focusing on the areas you want to improve (career, love, or finances).");

        return remedies;
    }
}

public sealed record NatalRequest(string FullName, DateOnly BirthDate, TimeOnly BirthTime, string BirthPlace, string FocusArea);
public sealed record HoroscopeRequest(string ZodiacSign, string Period);
public sealed record DailyPanchangRequest(string? Location, DateTime? DateUtc);
public sealed record NumerologyRequest(DateOnly BirthDate);
public sealed record NumerologyDetailsResponse(
    int LifePathNumber,
    int DestinyNumber,
    int SoulUrgeNumber,
    IReadOnlyList<int> LuckyNumbers,
    string CareerDirection,
    string LovePrediction,
    string MoneyPrediction,
    IReadOnlyList<string> Remedies
);

static class PredictionText
{
    public static readonly Dictionary<string, string> AscTraits = new(StringComparer.OrdinalIgnoreCase)
    {
        {"Aries", "Aries rising – direct, pioneering, action-first."},
        {"Taurus", "Taurus rising – steady, sensual, values-driven."},
        {"Gemini", "Gemini rising – curious, communicative, versatile."},
        {"Cancer", "Cancer rising – nurturing, protective, home-centered."},
        {"Leo", "Leo rising – expressive, confident, creative."},
        {"Virgo", "Virgo rising – analytical, meticulous, service-oriented."},
        {"Libra", "Libra rising – diplomatic, aesthetic, relationship-focused."},
        {"Scorpio", "Scorpio rising – intense, transformative, strategic."},
        {"Sagittarius", "Sagittarius rising – optimistic, exploratory, philosophical."},
        {"Capricorn", "Capricorn rising – disciplined, ambitious, pragmatic."},
        {"Aquarius", "Aquarius rising – innovative, humanitarian, unconventional."},
        {"Pisces", "Pisces rising – intuitive, compassionate, imaginative."}
    };

    public static readonly Dictionary<string, string> DashaEffects = new(StringComparer.OrdinalIgnoreCase)
    {
        {"Sun", "Authority, vitality, visibility, father/government themes."},
        {"Moon", "Emotions, mind, family, nourishment, fluctuations."},
        {"Mars", "Drive, courage, competition, technical work, conflicts."},
        {"Mercury", "Intellect, communication, trade, analysis, learning."},
        {"Jupiter", "Wisdom, growth, guidance, finance, children."},
        {"Venus", "Relationships, arts, comforts, vehicles, luxury."},
        {"Saturn", "Discipline, responsibilities, delays, endurance, service."},
        {"Rahu", "Aspirations, unconventional gains, foreign links, obsessions."},
        {"Ketu", "Detachment, spirituality, research, sudden breaks, introspection."}
    };
}

// Removed local text builders; the analysis is generated by OpenAI via IGptAstrologyService
