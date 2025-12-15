using Domain.Enums;

namespace Domain.Entities
{
    public class Prediction
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public string RaceId { get; set; } = string.Empty;
        public string RaceName { get; set; } = string.Empty;
        public string Season { get; set; } = string.Empty;
        
        // Prediction details
        public string? PodiumP1 { get; set; } // Driver name/number
        public string? PodiumP2 { get; set; }
        public string? PodiumP3 { get; set; }
        public string? FastestLapDriver { get; set; }
        public string? PolePositionDriver { get; set; }
        public int? FirstRetirementLap { get; set; }
        public bool? WillThereBeASafetyCar { get; set; }
        public int? NumberOfDnfs { get; set; }
        
        // Betting
        public int CoinsWagered { get; set; }
        public int PotentialPayout { get; set; }
        
        // Status
        public PredictionStatus Status { get; set; } = PredictionStatus.PENDING;
        public int PointsEarned { get; set; }
        public int CoinsEarned { get; set; }
        
        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SettledAt { get; set; }
        public DateTime RaceDateTime { get; set; }
    }
}
