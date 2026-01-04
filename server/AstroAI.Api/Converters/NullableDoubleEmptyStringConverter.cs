using System;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AstroAI.Api.Converters;

/// <summary>
/// System.Text.Json converter that treats empty strings as null for nullable doubles.
/// Allows payloads with "latitude": "" or "longitude": "" to bind as null.
/// </summary>
public sealed class NullableDoubleEmptyStringConverter : JsonConverter<double?>
{
    public override double? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.Null:
                return null;
            case JsonTokenType.Number:
                return reader.GetDouble();
            case JsonTokenType.String:
                var s = reader.GetString();
                if (string.IsNullOrWhiteSpace(s)) return null;
                if (double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var d))
                    return d;
                throw new JsonException($"Invalid double value: '{s}'");
            default:
                throw new JsonException($"Unexpected token {reader.TokenType} for nullable double");
        }
    }

    public override void Write(Utf8JsonWriter writer, double? value, JsonSerializerOptions options)
    {
        if (value.HasValue) writer.WriteNumberValue(value.Value);
        else writer.WriteNullValue();
    }
}