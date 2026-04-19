using System.Text.Json;
using AstroAI.Core.Services;

namespace AstroAI.Infrastructure.Services;

// Pandit Arjun – virtual astrologer chatbot implementation
public sealed partial class GptAstrologyService
{
    private const string PanditArjunBasePrompt =
        "You are Pandit Arjun, a wise and compassionate Vedic astrologer with 40 years of deep cosmic experience. " +
        "You speak with warmth, mysticism, and authority. You always open with 'Namaste', 'Om Shanti', or 'Jai Guru Dev'. " +
        "You answer questions about Vedic astrology, birth charts, planetary influences, relationships, career, health, " +
        "spirituality, remedies, gemstones, mantras, and life guidance. " +
        "You NEVER give medical, legal, or financial investment advice — gently redirect those to proper professionals. " +
        "For off-topic questions, return the conversation gracefully to astrology with wisdom. " +
        "Keep each reply to 2–4 sentences maximum — warm, poetic, and impactful. " +
        "Respond ONLY as STRICT JSON with this exact schema: " +
        "{\"reply\": string, \"tone\": \"friendly\"|\"serious\"|\"mystical\"|\"concerned\"|\"joyful\", \"emoji\": string}. " +
        "No prose or text outside the JSON object.";

    public async Task<AstrologerChatResponse> AstrologerChatAsync(
        AstrologerChatRequest request,
        CancellationToken ct)
    {
        ValidateConfig();
        var url = BuildUrl();

        // Build system prompt — include chart context when present
        var systemPrompt = !string.IsNullOrWhiteSpace(request.ChartContext)
            ? PanditArjunBasePrompt +
              "\n\nThe seeker's KP birth chart has been computed. Use this as the SOLE foundation for ALL analysis:\n" +
              request.ChartContext +
              "\nReference specific planets, houses, signs and dasha lords in every answer where relevant."
            : PanditArjunBasePrompt;

        // Build message list: system + last 10 history turns + new user message
        var messages = new List<object>
        {
            new { role = "system", content = systemPrompt }
        };

        foreach (var msg in request.History.TakeLast(10))
            messages.Add(new { role = msg.Role, content = msg.Content });

        // Enrich message with optional context
        var userContent = request.NewMessage;
        if (!string.IsNullOrWhiteSpace(request.ZodiacSign))
            userContent = $"[User zodiac: {request.ZodiacSign}] {userContent}";
        if (!string.IsNullOrWhiteSpace(request.UserName))
            userContent = $"[User name: {request.UserName}] {userContent}";

        messages.Add(new { role = "user", content = userContent });

        var payload = new
        {
            model = _model,
            messages = messages.ToArray(),
            temperature = 0.75,
            max_completion_tokens = 400
        };

        using var req = CreateRequest(url, payload);
        var res = await _http.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);

        if (!res.IsSuccessStatusCode)
            throw new HttpRequestException(
                $"Pandit Arjun chat failed: {(int)res.StatusCode} {res.ReasonPhrase}. Body: {body}");

        using var doc = JsonDocument.Parse(body);
        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "{}";

        using var parsed = JsonDocument.Parse(content);
        var root = parsed.RootElement;

        static string S(JsonElement e, string key, string fallback)
            => e.TryGetProperty(key, out var p) && p.ValueKind == JsonValueKind.String
               ? p.GetString() ?? fallback
               : fallback;

        return new AstrologerChatResponse(
            Reply: S(root, "reply", "Namaste! The stars guide us to clarity. Please ask your question."),
            Tone: S(root, "tone", "friendly"),
            Emoji: S(root, "emoji", "🙏"));
    }
}
