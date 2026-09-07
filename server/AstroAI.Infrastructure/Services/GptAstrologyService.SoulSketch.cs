using System.Net.Http.Json;
using System.Text.Json;
using AstroAI.Core.Services;

namespace AstroAI.Infrastructure.Services;

public sealed partial class GptAstrologyService
{
    public async Task<SoulSketchResponse> GenerateSoulSketchAsync(
        SouthIndianChart chart,
        DashaStatus dasha,
        string gender,
        string partnerGender,
        string birthCity,
        string birthState,
        string birthCountry,
        CancellationToken ct)
    {
        if (_endpoint.Contains("your-openai-endpoint", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("ASTROAI OpenAI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException("ASTROAI OpenAI API key is missing.");

        var chatUrl = _endpoint.Contains("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? _endpoint
            : $"{_endpoint.TrimEnd('/')}/chat/completions";

        // ── Step 1: GPT analyses chart → produces soulmate visual description ─
        var chartSummary = BuildSoulSketchChartSummary(chart, dasha, gender, partnerGender, birthCity, birthState, birthCountry);

        var systemPrompt =
            "You are an expert Vedic astrologer and realistic portrait director. Analyse the birth chart carefully before " +
            "describing the soulmate. Ground the portrait primarily in Lagna, Lagna lord, 1st house influences, 7th house, " +
            "7th lord, Darakaraka, Moon, Venus, Jupiter, nakshatra influences, and current dasha. Use astrology to infer likely " +
            "physical appearance, facial structure, expression, body build, complexion, and subtle identifying marks. Also use the birthplace " +
            "country/state/city only as soft cultural context for likely ethnicity, grooming, clothing vibe, and physiognomy — never as a hard stereotype. " +
            "Also infer whether the spouse is likely from the same region/culture or may be foreign-born, cross-cultural, or from a different linguistic or ethnic background when the chart strongly suggests it. If the chart suggests the spouse is from the same cultural or regional background, keep the portrait ethnically and culturally consistent with that background and do not foreignize the face, skin tone, or overall physiognomy. " +
            "Infer unique body or face markers when astrology supports it, such as a mole, birthmark, keloid-like scar, neck mark, cheek mark, eyebrow scar, " +
            "dimple, asymmetry, widow's peak, dental feature, or distinctive neck/collarbone trait. Avoid fantasy exaggeration, celebrity beauty clichés, 'hot model' glamour language, pageant-style beauty, or generic phrases. Prefer believable details that make a face look like a real individual with natural attractiveness rather than a stylized supermodel. " +
            "Apply these explicit astrology-to-feature rules when supported by the chart: Saturn, Rahu, or strong 8th-house/8th-lord links can indicate scars, darker marks, rougher texture, or visible unusual markings; Venus and Moon emphasis can indicate softer symmetry, luminous skin, rounded features, attractive eyes, and gentler facial harmony; Mars influence can indicate a sharp jaw, athletic tone, reddish or warm undertone, assertive brows, or a small cut/scar-type mark; Mercury influence can indicate a youthful frame, smaller or finer features, quick eyes, a lighter build, and youthful facial proportions. " +
            "Jupiter influence can indicate a fuller, broader, or gently chubby face shape, calm wise eyes, softer cheeks, and dignified presence; Sun influence can indicate a stronger forehead, prouder posture, brighter complexion, or regal bearing; Ketu influence can indicate an unusual, detached, inward, or spiritual expression, or a quietly striking feature that makes the face feel uncommon. Rahu, 7th-house foreign-significator patterns, 12th-house connections, or strong cross-border indicators can suggest a foreign-born or cross-cultural spouse. " +
            "If astrology suggests uncertainty, keep the feature moderate and natural instead of extreme. Return STRICT JSON only — no markdown, no prose outside JSON.";

        var userContent =
            "Chart:\n" + chartSummary + "\n\n" +
            "Return STRICT JSON matching this schema exactly:\n" +
            "{\n" +
            "  \"visualDescription\": \"5-7 sentences describing a realistic portrait inferred from the chart: approximate age range, body build, face shape, forehead, jawline, cheekbones, skin tone/undertone, eye shape and colour, eyebrow style, nose shape, lips, hair texture and hairstyle, expression, gait or posture if relevant, and 1-3 specific identifying features. At least one identifying feature should name its location clearly if astrology supports it, e.g. a small mole near the neck, a faint scar on the eyebrow, a beauty mark near the collarbone, a keloid-like raised mark near the neck, dimples, slight facial asymmetry, or a distinct hairline. Keep it natural, respectful, culturally plausible, astrologically grounded, and avoid describing the person as a glamorous model or unrealistically perfect beauty.\",\n" +
            "  \"soulmateNarrative\": \"2-3 poetic sentences on who this soul is and what they bring to the native's life\",\n" +
            "  \"originReading\": \"1-2 sentences stating whether the spouse is likely local/native to the same cultural background or more likely foreign-born, cross-cultural, from a different region, or internationally connected — only when the chart strongly indicates it. If same-cultural/native is indicated, say so clearly.\",\n" +
            "  \"marriageAgeReading\": \"1-2 sentences giving the likely marriage age or age window based on 7th house, 7th lord, Venus, Jupiter, Darakaraka and dasha timing. Use a realistic age or narrow range such as 27-29, and mention uncertainty modestly if needed.\",\n" +
            "  \"astroTraits\": [\n" +
            "    { \"label\": \"Lagna\", \"value\": \"Ascendant appearance signature\" },\n" +
            "    { \"label\": \"Lagna Lord\", \"value\": \"Planet + sign + house influence on looks\" },\n" +
            "    { \"label\": \"Venus\", \"value\": \"Sign — key quality\" },\n" +
            "    { \"label\": \"7th Lord\", \"value\": \"Planet in Sign\" },\n" +
            "    { \"label\": \"7th House\", \"value\": \"Sign qualities\" },\n" +
            "    { \"label\": \"Darakaraka\", \"value\": \"Spouse significator influence\" },\n" +
            "    { \"label\": \"Rahu\", \"value\": \"Desire focus\" },\n" +
            "    { \"label\": \"Dasha\", \"value\": \"Current period theme\" }\n" +
            "  ],\n" +
            "  \"distinctiveFeatures\": [\"Feature 1 with body location\", \"Feature 2 with body location\", \"Optional feature 3 with body location\"]\n" +
            "}";

        var gptPayload = new
        {
            model = _model,
            temperature = 0.8,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user",   content = userContent  }
            }
        };

        using var gptReq = CreateRequest(chatUrl, gptPayload);
        var gptRes  = await _http.SendAsync(gptReq, ct);
        var gptBody = await gptRes.Content.ReadAsStringAsync(ct);
        if (!gptRes.IsSuccessStatusCode)
            throw new HttpRequestException($"GPT soul sketch analysis failed: {(int)gptRes.StatusCode}. Body: {gptBody}");

        using var gptDoc = JsonDocument.Parse(gptBody);
        var rawContent = gptDoc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "{}";

        // Strip markdown code fences if GPT wraps the JSON
        var jsonText = rawContent.Trim();
        if (jsonText.StartsWith("```"))
        {
            var lines = jsonText.Split('\n');
            jsonText = string.Join('\n', lines.Skip(1).TakeWhile(l => !l.TrimStart().StartsWith("```")));
        }

        using var parsed = JsonDocument.Parse(jsonText);
        var root = parsed.RootElement;

        var visualDescription  = root.GetPropertyOrDefault("visualDescription",  "A serene person with warm expressive eyes and a gentle, radiant smile.");
        var soulmateNarrative  = root.GetPropertyOrDefault("soulmateNarrative",  "Your soulmate carries a celestial calm, bringing harmony and deep spiritual connection into your world.");
        var originReading      = root.GetPropertyOrDefault("originReading", string.Empty);
        var marriageAgeReading = root.GetPropertyOrDefault("marriageAgeReading", string.Empty);
        var distinctiveFeatures = root.GetArrayOrDefault("distinctiveFeatures");
        if (distinctiveFeatures.Count > 0)
        {
            visualDescription = $"{visualDescription} Distinctive features: {string.Join(", ", distinctiveFeatures)}.";
        }
        if (!string.IsNullOrWhiteSpace(originReading))
        {
            soulmateNarrative = $"{soulmateNarrative} {originReading}".Trim();
        }

        var traits = new List<SoulSketchTrait>();
        if (root.TryGetProperty("astroTraits", out var traitsEl) && traitsEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var t in traitsEl.EnumerateArray())
            {
                var label = t.GetPropertyOrDefault("label", "");
                var value = t.GetPropertyOrDefault("value", "");
                if (!string.IsNullOrWhiteSpace(label))
                    traits.Add(new SoulSketchTrait(label, value));
            }
        }

        // ── Step 2: GPT Image paints the portrait ────────────────────────────
        var imageUrl = await GenerateDallePortraitAsync(visualDescription, partnerGender, ct);

        return new SoulSketchResponse(
            ImageUrl:          imageUrl,
            VisualDescription: visualDescription,
            OriginReading:     originReading,
            MarriageAgeReading: marriageAgeReading,
            SoulmateNarrative: soulmateNarrative,
            AstroTraits:       traits.ToArray());
    }

    // ── GPT Image portrait — fetches image server-side → returns base64 data URI ─
    private async Task<string> GenerateDallePortraitAsync(string visualDescription, string partnerGender, CancellationToken ct)
    {
        var imageGenUrl = _endpoint
            .Replace("/chat/completions", "/images/generations", StringComparison.OrdinalIgnoreCase);

        var desc = visualDescription.Length > 500 ? visualDescription[..500] : visualDescription;
        var prompt =
            $"Create a realistic, natural-looking portrait photo of a {partnerGender} person based on this description: {desc}. " +
            "The face should look like a believable real person with subtle unique features preserved exactly as described, " +
            "including small moles, freckles, dimples, facial asymmetry, jawline, cheekbones, eyebrow shape, hair texture, " +
            "and any other distinctive but natural identifying traits. Preserve exact body-location details for marks if mentioned, especially neck, jawline, collarbone, eyebrow, cheek, chin, or lips. " +
            "If the description implies the person is from the same regional or cultural background as the native, keep the ethnicity, facial structure, complexion range, and overall physiognomy consistent with that background and do not make the person look foreign or westernized. " +
            "Use soft cinematic lighting, clean portrait composition, gentle expression, photorealistic skin texture, natural eyes, realistic hair strands, and an elegant understated celestial mood. " +
            "Make the person naturally attractive and believable, not like a fashion model, film star, influencer glamour shot, or beauty pageant portrait. " +
            "No text, no watermark, no extra limbs, no duplicated features, no fantasy distortion, no cartoon style.";

        var payload = new
        {
            model   = _imageModel,
            prompt,
            n       = 1,
            size    = "1024x1024",
            quality = "medium"
        };

        using var req = CreateRequest(imageGenUrl, payload);
        var res  = await _http.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);

        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException($"Portrait generation failed using image model '{_imageModel}': {(int)res.StatusCode}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        if (!doc.RootElement.TryGetProperty("data", out var dataEl) || dataEl.ValueKind != JsonValueKind.Array || dataEl.GetArrayLength() == 0)
            throw new InvalidOperationException($"Image model '{_imageModel}' returned no data. Body: {body}");

        var first = dataEl[0];

        if (first.TryGetProperty("b64_json", out var b64El))
        {
            var b64 = b64El.GetString();
            if (!string.IsNullOrWhiteSpace(b64))
                return $"data:image/png;base64,{b64}";
        }

        if (first.TryGetProperty("base64", out var altB64El))
        {
            var altB64 = altB64El.GetString();
            if (!string.IsNullOrWhiteSpace(altB64))
                return $"data:image/png;base64,{altB64}";
        }

        if (!first.TryGetProperty("url", out var urlEl))
            throw new InvalidOperationException($"Image model '{_imageModel}' returned neither url nor base64 image data. Body: {body}");

        var imageUrl = urlEl.GetString()
            ?? throw new InvalidOperationException($"Image model '{_imageModel}' returned an empty image URL. Body: {body}");

        // Fetch image bytes server-side → base64 data URI (avoids RN loading issues)
        using var imgReq = new HttpRequestMessage(HttpMethod.Get, imageUrl);
        var imgRes  = await _http.SendAsync(imgReq, ct);
        if (!imgRes.IsSuccessStatusCode)
            throw new HttpRequestException($"Portrait image download failed using image model '{_imageModel}': {(int)imgRes.StatusCode} {imgRes.ReasonPhrase}.");
        var bytes   = await imgRes.Content.ReadAsByteArrayAsync(ct);
        var mime    = imgRes.Content.Headers.ContentType?.MediaType ?? "image/png";
        return $"data:{mime};base64,{Convert.ToBase64String(bytes)}";
    }

    // ── Chart summary builder ─────────────────────────────────────────────────
    private static string BuildSoulSketchChartSummary(
        SouthIndianChart chart, DashaStatus dasha, string gender, string partnerGender, string birthCity, string birthState, string birthCountry)
    {
        var venus       = chart.Planets.FirstOrDefault(p => p.Name.Equals("Venus", StringComparison.OrdinalIgnoreCase));
        var moon        = chart.Planets.FirstOrDefault(p => p.Name.Equals("Moon", StringComparison.OrdinalIgnoreCase));
        var rahu        = chart.Planets.FirstOrDefault(p => p.Name.Equals("Rahu", StringComparison.OrdinalIgnoreCase));
        var jupiter     = chart.Planets.FirstOrDefault(p => p.Name.Equals("Jupiter", StringComparison.OrdinalIgnoreCase));
        var ascHouse    = chart.Houses.FirstOrDefault(h => h.Number == 1);
        var seventhHouse= chart.Houses.FirstOrDefault(h => h.Number == 7);
        var ascLordName = GetSignRuler(chart.AscendantSign);
        var ascLord     = chart.Planets.FirstOrDefault(p => p.Name.Equals(ascLordName, StringComparison.OrdinalIgnoreCase));
        var seventhLordName = GetSignRuler(seventhHouse?.Sign ?? GetOppositeSign(chart.AscendantSign));
        var seventhLord = chart.Planets.FirstOrDefault(p => p.Name.Equals(seventhLordName, StringComparison.OrdinalIgnoreCase));
        var firstHousePlanets = chart.Planets.Where(p => p.House == 1).Select(p => p.Name).ToArray();
        var seventhHousePlanets = chart.Planets.Where(p => p.House == 7).Select(p => p.Name).ToArray();
        var darakaraka = GetDarakaraka(chart.Planets);
        var allPlanets = string.Join("; ", chart.Planets.Select(p => $"{p.Name} {p.Sign} H{p.House} DegInSign:{(p.SiderealLongitude % 30.0):F2} Nak:{p.Nakshatra} RL:{p.RasiLord} SL:{p.SubLord}"));

        return
            $"Native gender: {gender}\n" +
            $"Seeking partner: {partnerGender}\n" +
            $"Birthplace context: city={birthCity}, state={birthState}, country={birthCountry}. Use as soft cultural/national context only, not stereotype.\n" +
            $"Ascendant: {chart.AscendantSign} ({chart.AscendantSiderealLongitude:F2}°)\n" +
            $"1st house sign and influences: {ascHouse?.Sign ?? chart.AscendantSign}; occupants=[{string.Join(",", firstHousePlanets)}]; rasi lord={ascHouse?.RasiLord ?? ascLordName}; nakshatra={ascHouse?.Nakshatra ?? "unknown"}; sublord={ascHouse?.SubLord ?? "unknown"}\n" +
            $"Lagna lord: {ascLordName} in {ascLord?.Sign ?? "unknown"} house {ascLord?.House ?? 0}, nakshatra {ascLord?.Nakshatra ?? "unknown"}, sublord {ascLord?.SubLord ?? "unknown"}\n" +
            $"7th house sign and spouse influences: {seventhHouse?.Sign ?? GetOppositeSign(chart.AscendantSign)}; occupants=[{string.Join(",", seventhHousePlanets)}]; rasi lord={seventhHouse?.RasiLord ?? seventhLordName}; nakshatra={seventhHouse?.Nakshatra ?? "unknown"}; sublord={seventhHouse?.SubLord ?? "unknown"}\n" +
            $"7th lord: {seventhLordName} in {seventhLord?.Sign ?? "unknown"} house {seventhLord?.House ?? 0}, nakshatra {seventhLord?.Nakshatra ?? "unknown"}, sublord {seventhLord?.SubLord ?? "unknown"}\n" +
            $"Darakaraka: {darakaraka?.Name ?? "unknown"} in {darakaraka?.Sign ?? "unknown"} house {darakaraka?.House ?? 0}, deg-in-sign {((darakaraka?.SiderealLongitude ?? 0) % 30.0):F2}, nakshatra {darakaraka?.Nakshatra ?? "unknown"}\n" +
            $"Venus: {venus?.Sign ?? "unknown"} in house {venus?.House ?? 0}, deg-in-sign {((venus?.SiderealLongitude ?? 0) % 30.0):F2}, nakshatra {venus?.Nakshatra ?? "unknown"}\n" +
            $"Moon: {moon?.Sign ?? "unknown"} in house {moon?.House ?? 0}, deg-in-sign {((moon?.SiderealLongitude ?? 0) % 30.0):F2}, Nakshatra: {moon?.Nakshatra ?? "unknown"}\n" +
            $"Jupiter: {jupiter?.Sign ?? "unknown"} in house {jupiter?.House ?? 0}, deg-in-sign {((jupiter?.SiderealLongitude ?? 0) % 30.0):F2}, nakshatra {jupiter?.Nakshatra ?? "unknown"}\n" +
            $"Rahu: {rahu?.Sign ?? "unknown"} in house {rahu?.House ?? 0}, deg-in-sign {((rahu?.SiderealLongitude ?? 0) % 30.0):F2}, nakshatra {rahu?.Nakshatra ?? "unknown"}\n" +
            $"Current Maha Dasha: {dasha.MahaDashaLord}\n" +
            $"Current Antar Dasha: {dasha.AntarDashaLord}\n" +
                    $"Instruction: Derive likely physical features primarily from Lagna/Lagna lord/1st house for body and face structure, and refine spouse appearance using 7th house/7th lord/Darakaraka/Venus/Moon/Jupiter. Pay attention to degrees within sign, nakshatra, sublord, and house placement to infer subtle marks or distinguishing physical traits. If a specific mark is astrologically likely, state its probable body location clearly. Also infer spouse origin/background carefully: mention foreign-born, cross-cultural, different-region, or same-native-background tendencies only if the chart strongly supports it. Also estimate likely marriage timing or age window using 7th house, 7th lord, Venus, Jupiter, Darakaraka, and the current or upcoming dasha periods.\n" +
                    $"Rule hints: Saturn/Rahu/8th links -> scars or darker marks; Venus/Moon emphasis -> softer facial symmetry; Mars influence -> sharp jaw, cut mark, reddish undertone; Mercury influence -> youthful frame, smaller features; Jupiter influence -> fuller face, gently chubby cheeks, calm eyes, dignified presence; Sun influence -> stronger forehead, regal bearing; Ketu influence -> unusual or spiritual-looking detachment in expression; Rahu/12th/7th foreign links -> foreign or cross-cultural spouse indications.\n" +
            $"All planets: {allPlanets}";
    }

    private static PlanetPosition? GetDarakaraka(IReadOnlyList<PlanetPosition> planets)
    {
        var valid = planets
            .Where(p => p.Name is "Sun" or "Moon" or "Mars" or "Mercury" or "Jupiter" or "Venus" or "Saturn")
            .OrderBy(p => p.SiderealLongitude % 30.0)
            .ToList();

        return valid.FirstOrDefault();
    }

    private static string GetSignRuler(string sign) => sign switch
    {
        "Aries" => "Mars",
        "Taurus" => "Venus",
        "Gemini" => "Mercury",
        "Cancer" => "Moon",
        "Leo" => "Sun",
        "Virgo" => "Mercury",
        "Libra" => "Venus",
        "Scorpio" => "Mars",
        "Sagittarius" => "Jupiter",
        "Capricorn" => "Saturn",
        "Aquarius" => "Saturn",
        "Pisces" => "Jupiter",
        _ => "unknown"
    };

    private static string GetOppositeSign(string ascendant) => ascendant switch
    {
        "Aries"       => "Libra",
        "Taurus"      => "Scorpio",
        "Gemini"      => "Sagittarius",
        "Cancer"      => "Capricorn",
        "Leo"         => "Aquarius",
        "Virgo"       => "Pisces",
        "Libra"       => "Aries",
        "Scorpio"     => "Taurus",
        "Sagittarius" => "Gemini",
        "Capricorn"   => "Cancer",
        "Aquarius"    => "Leo",
        "Pisces"      => "Virgo",
        _             => "unknown"
    };
}
