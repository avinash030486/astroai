using System;

namespace AstroAI.Api.Models
{
    public class SubscriptionRecord
    {
        public string id { get; set; } = Guid.NewGuid().ToString();
        // Partition key field - must match container partition key path /individual
        public string individual { get; set; } = "individual";

        public string email { get; set; } = string.Empty;

        public string name { get; set; } = string.Empty;

        // "O", "W", "M"
        public string subscriptionType { get; set; } = string.Empty;

        public string dateOfBirth { get; set; } = string.Empty;
        public string timeOfBirth { get; set; } = string.Empty;
        public string placeOfBirth { get; set; } = string.Empty;

        // Store the generated horoscope chart data
        public object? horoscope { get; set; }

        public DateTime createdUtc { get; set; } = DateTime.UtcNow;
    }
}
