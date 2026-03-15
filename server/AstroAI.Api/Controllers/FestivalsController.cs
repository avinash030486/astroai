using AstroAI.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AstroAI.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class FestivalsController : ControllerBase
{
    [HttpGet("calendar")]
    [ResponseCache(Duration = 86400)] // cache 24 hours
    public IActionResult Calendar([FromQuery] int month = 0, [FromQuery] int year = 0)
    {
        if (month == 0) month = DateTime.UtcNow.Month;
        if (year == 0) year = DateTime.UtcNow.Year;
        if (month < 1 || month > 12) return BadRequest(new { error = "Month must be 1-12." });

        var events = GetHinduFestivals(year)
            .Where(f => DateOnly.TryParse(f.Date, out var d) && d.Month == month)
            .OrderBy(f => f.Date)
            .ToList();

        var monthName = new DateTime(year, month, 1).ToString("MMMM");
        return Ok(new FestivalCalendarResponse(month, year, monthName, events));
    }

    private static IReadOnlyList<FestivalEvent> GetHinduFestivals(int year)
    {
        // Core Hindu festivals with approximate Gregorian dates
        // These are computed based on typical Panchang for the given year.
        // Dates shift by 1-2 days year to year based on lunar calendar.
        var festivals = new List<FestivalEvent>
        {
            // January
            new("Makar Sankranti",       $"{year}-01-14", "Festival",  "Surya (Sun)",           "Solar transition into Capricorn; harvest festival",                        "Take holy bath, donate sesame & jaggery, fly kites",        true),
            new("Pongal",                $"{year}-01-14", "Festival",  "Surya (Sun)",           "Tamil harvest festival celebrated over 4 days",                            "Cook Pongal dish, thank the Sun, decorate with kolam",       true),
            new("Lohri",                 $"{year}-01-13", "Festival",  "Agni (Fire)",           "Punjabi harvest festival marking end of winter",                           "Bonfire, sing folk songs, offer til & rewri to fire",        false),
            new("Vasant Panchami",       $"{year}-02-02", "Festival",  "Saraswati",             "Goddess of knowledge & arts; onset of spring",                             "Wear yellow, worship Saraswati, begin education",            false),

            // February / March
            new("Maha Shivratri",        $"{year}-02-26", "Vrat",      "Shiva",                 "Night of Shiva; most important fasting day for Shiva devotees",            "Fast all day, night-long prayers, offer Bel leaves",         false),
            new("Holi",                  $"{year}-03-14", "Festival",  "Krishna / Radha",       "Festival of colors; victory of good over evil",                            "Play with colors, offer coconut to Agni on Holika Dahan",    true),
            new("Holika Dahan",          $"{year}-03-13", "Festival",  "Vishnu / Prahlad",      "Bonfire night before Holi; burning of Holika",                             "Light bonfire, perform parikrama, offer grains",             false),

            // March / April
            new("Ugadi / Gudi Padwa",   $"{year}-03-30", "Festival",  "Brahma",                "Telugu & Kannada New Year; Maharashtrian New Year",                        "Prepare Pachadi/Bevu-Bella, hoist Gudi, offer prayers",      false),
            new("Ram Navami",            $"{year}-04-06", "Festival",  "Rama",                  "Birthday of Lord Rama; 9th day of Chaitra Navratri",                       "Fast, read Ramayana, attend Ram Katha",                      false),
            new("Hanuman Jayanti",       $"{year}-04-12", "Festival",  "Hanuman",               "Birthday of Lord Hanuman; strength & devotion",                            "Visit Hanuman temple, read Hanuman Chalisa, fast",           false),
            new("Chaitra Navratri",      $"{year}-03-30", "Vrat",      "Durga / Navadurga",     "9 nights of the Divine Mother; spring Navratri",                           "Fast, worship 9 forms of Durga, chant Durga Saptashati",    false),

            // April
            new("Baisakhi",              $"{year}-04-13", "Festival",  "Surya / Guru Gobind Singh", "Harvest festival; founding of Khalsa Panth",                         "Visit Gurudwara, bhangra/gidda, offer ardas",                true),
            new("Akshaya Tritiya",       $"{year}-04-30", "Festival",  "Vishnu / Lakshmi",      "Most auspicious day for new beginnings & purchases",                      "Buy gold, donate, start new ventures, no muhurat needed",   false),

            // May
            new("Buddha Purnima",        $"{year}-05-12", "Festival",  "Gautama Buddha",        "Birth, enlightenment, and death anniversary of Buddha",                   "Visit Buddhist temples, meditate, donate, fast",             true),

            // June / July
            new("Nirjala Ekadashi",      $"{year}-06-06", "Vrat",      "Vishnu",                "Strictest Ekadashi – water-less fast; equal to all 24 Ekadashis",         "Complete fast including water, chant Vishnu Sahasranama",    false),
            new("Rath Yatra",            $"{year}-06-27", "Festival",  "Jagannath",             "Chariot festival of Lord Jagannath in Puri",                               "Pull the chariot, offer coconut and flowers",                false),
            new("Guru Purnima",          $"{year}-07-10", "Festival",  "Vyasa / Guru",          "Honoring spiritual teachers and Sage Vyasa",                               "Seek guru's blessings, perform pada puja, fast or meditate", false),

            // July / August
            new("Nag Panchami",          $"{year}-07-29", "Festival",  "Nag Devata (Serpent)",  "Worship of serpent deities for protection",                                "Offer milk to snake idols, fast, chant snake mantras",       false),
            new("Raksha Bandhan",        $"{year}-08-09", "Festival",  "Yama / Yamuna",         "Bond between brothers and sisters; protection ritual",                     "Sisters tie rakhi, brothers give gifts and vow protection",  true),
            new("Janmashtami",           $"{year}-08-16", "Vrat",      "Krishna",               "Midnight birthday of Lord Krishna; one of 4 major vrats",                 "Fast till midnight, sing bhajans, perform abhishek of Krishna",true),
            new("Onam",                  $"{year}-09-05", "Festival",  "Mahabali / Vamana",     "Kerala harvest festival; homecoming of King Mahabali",                     "Pookalam, Onam Sadya feast, Vallam Kali boat race",          true),

            // August / September
            new("Hariyali Teej",         $"{year}-08-01", "Vrat",      "Parvati / Shiva",       "Women's festival for marital bliss and rain",                              "Fast, wear green, swing on jhula, celebrate with songs",     false),
            new("Ganesh Chaturthi",      $"{year}-08-27", "Festival",  "Ganesha",               "10-day festival celebrating Lord Ganesha's birthday",                      "Install Ganesha idol, offer modak, perform aarti daily",     true),

            // September / October
            new("Navratri",              $"{year}-10-02", "Vrat",      "Durga / Navadurga",     "9 nights of the Divine Mother; autumn Navratri",                           "Fast, Dandiya/Garba, worship 9 forms of Durga",             true),
            new("Dussehra / Vijayadashami", $"{year}-10-12","Festival", "Rama / Durga",         "Victory of Rama over Ravana; triumph of good over evil",                   "Burn Ravana effigy, Shami puja, Aparajita puja",            true),
            new("Karva Chauth",          $"{year}-10-20", "Vrat",      "Moon / Parvati",        "Married women fast for husband's long life",                               "Moon-rise fast, apply mehendi, give sieve argha to moon",   false),

            // October / November
            new("Dhanteras",             $"{year}-10-29", "Festival",  "Dhanvantari / Lakshmi", "Day of wealth; buying utensils, gold, silver for prosperity",              "Buy new items, worship Lakshmi & Dhanvantari, light diyas",  true),
            new("Chhoti Diwali / Narak Chaturdashi", $"{year}-10-30","Festival","Kali / Krishna","Killing of demon Narakasura; minor Diwali",                              "Light crackers, apply ubtan (oil massage)",                   false),
            new("Diwali",                $"{year}-10-31", "Festival",  "Lakshmi / Ganesha",     "Festival of lights; goddess Lakshmi's worship for wealth",                 "Light diyas & candles, Lakshmi puja at night, burst crackers",true),
            new("Govardhan Puja / Annakut", $"{year}-11-01","Festival","Krishna",              "Krishna lifted Govardhan hill to protect villagers from Indra's wrath",     "Offer 56 food items, worship cow, draw Govardhan with cow dung",false),
            new("Bhai Dooj",             $"{year}-11-02", "Festival",  "Yama / Yamuna",         "Bond of siblings; sisters pray for brothers' long life",                   "Apply tilak, share meals, exchange gifts",                   false),
            new("Chhath Puja",           $"{year}-11-05", "Vrat",      "Surya (Sun)",           "Sun worship festival; 4-day penance for prosperity & healing",             "36-hour fast, sunset/sunrise arghya offering at river",      false),
            new("Dev Uthani Ekadashi",   $"{year}-11-11", "Festival",  "Vishnu",                "Lord Vishnu awakens from 4-month cosmic sleep; auspicious season begins",  "Tulsi vivah, wedding season starts, break Chaturmas vrat",   false),

            // November / December
            new("Kartik Purnima",        $"{year}-11-15", "Festival",  "Vishnu / Shiva",        "Holy bath in Pushkar/Varanasi; Dev Deepawali celebration",                 "Take holy dip, light 1,000 diyas at ghats, fast",           false),
            new("Vivah Panchami",        $"{year}-11-30", "Festival",  "Rama / Sita",           "Marriage anniversary of Ram and Sita",                                     "Ram Sita vivah celebration, read Bal Kand",                  false),

            // December
            new("Gita Jayanti",          $"{year}-12-04", "Festival",  "Krishna",               "Day Bhagavad Gita was revealed to Arjuna on the battlefield",             "Read Gita, attend discourse, distribute Gita",               false),

            // Monthly Ekadashis (approximate for year)
            new("Ekadashi Vrat",         $"{year}-01-10", "Ekadashi",  "Vishnu",                "11th tithi fast; purifies sins and pleases Lord Vishnu",                   "Fast from grains, chant Vishnu Sahasranama, stay awake",    false),
            new("Ekadashi Vrat",         $"{year}-01-25", "Ekadashi",  "Vishnu",                "11th tithi fast; purifies sins and pleases Lord Vishnu",                   "Fast from grains, chant Vishnu Sahasranama, stay awake",    false),
            new("Ekadashi Vrat",         $"{year}-02-08", "Ekadashi",  "Vishnu",                "11th tithi fast; purifies sins and pleases Lord Vishnu",                   "Fast from grains, chant Vishnu Sahasranama, stay awake",    false),
            new("Ekadashi Vrat",         $"{year}-02-24", "Ekadashi",  "Vishnu",                "11th tithi fast; purifies sins and pleases Lord Vishnu",                   "Fast from grains, chant Vishnu Sahasranama, stay awake",    false),
            new("Ekadashi Vrat",         $"{year}-03-10", "Ekadashi",  "Vishnu",                "11th tithi fast; purifies sins and pleases Lord Vishnu",                   "Fast from grains, chant Vishnu Sahasranama, stay awake",    false),
            new("Ekadashi Vrat",         $"{year}-03-25", "Ekadashi",  "Vishnu",                "11th tithi fast; purifies sins and pleases Lord Vishnu",                   "Fast from grains, chant Vishnu Sahasranama, stay awake",    false),

            // Monthly Pradosh (13th tithi)
            new("Pradosh Vrat",          $"{year}-01-12", "Vrat",      "Shiva",                 "13th lunar day worship of Shiva during twilight",                          "Fast, visit Shiva temple at sunset, offer Bel leaves",       false),
            new("Pradosh Vrat",          $"{year}-01-27", "Vrat",      "Shiva",                 "13th lunar day worship of Shiva during twilight",                          "Fast, visit Shiva temple at sunset, offer Bel leaves",       false),
            new("Pradosh Vrat",          $"{year}-02-11", "Vrat",      "Shiva",                 "13th lunar day worship of Shiva during twilight",                          "Fast, visit Shiva temple at sunset, offer Bel leaves",       false),
            new("Pradosh Vrat",          $"{year}-02-26", "Vrat",      "Shiva",                 "13th lunar day worship of Shiva during twilight",                          "Fast, visit Shiva temple at sunset, offer Bel leaves",       false),
            new("Pradosh Vrat",          $"{year}-03-12", "Vrat",      "Shiva",                 "13th lunar day worship of Shiva during twilight",                          "Fast, visit Shiva temple at sunset, offer Bel leaves",       false),

            // Monthly Amavasya (No Moon)
            new("Amavasya",              $"{year}-01-29", "Amavasya",  "Pitru (Ancestors)",     "New moon; sacred day for ancestor rituals",                                "Tarpan to ancestors, fast, donate to Brahmins",              false),
            new("Amavasya",              $"{year}-02-28", "Amavasya",  "Pitru (Ancestors)",     "New moon; sacred day for ancestor rituals",                                "Tarpan to ancestors, fast, donate to Brahmins",              false),
            new("Amavasya",              $"{year}-03-29", "Amavasya",  "Pitru (Ancestors)",     "New moon; sacred day for ancestor rituals",                                "Tarpan to ancestors, fast, donate to Brahmins",              false),
            new("Amavasya",              $"{year}-04-27", "Amavasya",  "Pitru (Ancestors)",     "New moon; sacred day for ancestor rituals",                                "Tarpan to ancestors, fast, donate to Brahmins",              false),
            new("Amavasya",              $"{year}-05-27", "Amavasya",  "Pitru (Ancestors)",     "New moon; sacred day for ancestor rituals",                                "Tarpan to ancestors, fast, donate to Brahmins",              false),
            new("Amavasya",              $"{year}-06-25", "Amavasya",  "Pitru (Ancestors)",     "New moon; sacred day for ancestor rituals",                                "Tarpan to ancestors, fast, donate to Brahmins",              false),
            new("Amavasya",              $"{year}-07-24", "Amavasya",  "Pitru (Ancestors)",     "New moon; sacred day for ancestor rituals",                                "Tarpan to ancestors, fast, donate to Brahmins",              false),
            new("Amavasya",              $"{year}-08-23", "Amavasya",  "Pitru (Ancestors)",     "New moon; sacred day for ancestor rituals",                                "Tarpan to ancestors, fast, donate to Brahmins",              false),
            new("Amavasya",              $"{year}-09-21", "Amavasya",  "Pitru (Ancestors)",     "New moon; sacred day for ancestor rituals",                                "Tarpan to ancestors, fast, donate to Brahmins",              false),
            new("Amavasya",              $"{year}-10-21", "Amavasya",  "Pitru (Ancestors)",     "New moon; sacred day for ancestor rituals",                                "Tarpan to ancestors, fast, donate to Brahmins",              false),
            new("Amavasya",              $"{year}-11-20", "Amavasya",  "Pitru (Ancestors)",     "New moon; sacred day for ancestor rituals",                                "Tarpan to ancestors, fast, donate to Brahmins",              false),
            new("Amavasya",              $"{year}-12-19", "Amavasya",  "Pitru (Ancestors)",     "New moon; sacred day for ancestor rituals",                                "Tarpan to ancestors, fast, donate to Brahmins",              false),

            // Monthly Purnima (Full Moon)
            new("Purnima",               $"{year}-01-13", "Purnima",   "Vishnu / Chandra",      "Full moon; highly auspicious for worship and charity",                     "Fast, take holy dip, worship Vishnu, donate food",           false),
            new("Purnima",               $"{year}-02-12", "Purnima",   "Vishnu / Chandra",      "Full moon; highly auspicious for worship and charity",                     "Fast, take holy dip, worship Vishnu, donate food",           false),
            new("Purnima",               $"{year}-03-14", "Purnima",   "Vishnu / Chandra",      "Full moon; highly auspicious for worship and charity",                     "Fast, take holy dip, worship Vishnu, donate food",           false),
            new("Purnima",               $"{year}-04-13", "Purnima",   "Vishnu / Chandra",      "Full moon; highly auspicious for worship and charity",                     "Fast, take holy dip, worship Vishnu, donate food",           false),
            new("Purnima",               $"{year}-05-12", "Purnima",   "Vishnu / Chandra",      "Full moon; highly auspicious for worship and charity",                     "Fast, take holy dip, worship Vishnu, donate food",           false),
            new("Purnima",               $"{year}-06-11", "Purnima",   "Vishnu / Chandra",      "Full moon; highly auspicious for worship and charity",                     "Fast, take holy dip, worship Vishnu, donate food",           false),
            new("Purnima",               $"{year}-07-10", "Purnima",   "Vishnu / Chandra",      "Full moon; highly auspicious for worship and charity",                     "Fast, take holy dip, worship Vishnu, donate food",           false),
            new("Purnima",               $"{year}-08-09", "Purnima",   "Vishnu / Chandra",      "Full moon; highly auspicious for worship and charity",                     "Fast, take holy dip, worship Vishnu, donate food",           false),
            new("Purnima",               $"{year}-09-07", "Purnima",   "Vishnu / Chandra",      "Full moon; highly auspicious for worship and charity",                     "Fast, take holy dip, worship Vishnu, donate food",           false),
            new("Purnima",               $"{year}-10-07", "Purnima",   "Vishnu / Chandra",      "Full moon; highly auspicious for worship and charity",                     "Fast, take holy dip, worship Vishnu, donate food",           false),
            new("Purnima",               $"{year}-11-05", "Purnima",   "Vishnu / Chandra",      "Full moon; highly auspicious for worship and charity",                     "Fast, take holy dip, worship Vishnu, donate food",           false),
            new("Purnima",               $"{year}-12-04", "Purnima",   "Vishnu / Chandra",      "Full moon; highly auspicious for worship and charity",                     "Fast, take holy dip, worship Vishnu, donate food",           false),
        };

        return festivals;
    }
}
