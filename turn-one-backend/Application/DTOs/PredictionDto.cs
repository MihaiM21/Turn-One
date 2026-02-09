using Domain.Enums;

namespace Application.DTOs
{
    public class PredictionDto
    {
        public Guid? Id { get; set; }
        public string RaceId { get; set; } = string.Empty;
        public string RaceName { get; set; } = string.Empty;
        public string Season { get; set; } = string.Empty;
        
        public string? PodiumP1 { get; set; }
        public string? PodiumP2 { get; set; }
        public string? PodiumP3 { get; set; }
        public string? FastestLapDriver { get; set; }
        public string? PolePositionDriver { get; set; }
        public int? FirstRetirementLap { get; set; }
        public bool? WillThereBeASafetyCar { get; set; }
        public int? NumberOfDnfs { get; set; }
        
        public int CoinsWagered { get; set; }
        public int PotentialPayout { get; set; }
        public PredictionStatus Status { get; set; }
        public int PointsEarned { get; set; }
        public int CoinsEarned { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime? SettledAt { get; set; }
        public DateTime RaceDateTime { get; set; }
        
        public string? Username { get; set; }
    }
    
    public class CreatePredictionDto
    {
        public string RaceId { get; set; } = string.Empty;
        public string RaceName { get; set; } = string.Empty;
        public string Season { get; set; } = string.Empty;
        
        public string? PodiumP1 { get; set; }
        public string? PodiumP2 { get; set; }
        public string? PodiumP3 { get; set; }
        public string? FastestLapDriver { get; set; }
        public string? PolePositionDriver { get; set; }
        public int? FirstRetirementLap { get; set; }
        public bool? WillThereBeASafetyCar { get; set; }
        public int? NumberOfDnfs { get; set; }
        
        public int CoinsWagered { get; set; }
        public DateTime RaceDateTime { get; set; }
    }

    public class RaceResultsDto
    {
        public string RaceId { get; set; } = string.Empty;
        public string RaceName { get; set; } = string.Empty;
        public string Season { get; set; } = string.Empty;
        
        // Actual race results
        public string? PodiumP1 { get; set; }
        public string? PodiumP2 { get; set; }
        public string? PodiumP3 { get; set; }
        public string? FastestLapDriver { get; set; }
        public string? PolePositionDriver { get; set; }
        public int? FirstRetirementLap { get; set; }
        public bool? WillThereBeASafetyCar { get; set; }
        public int? NumberOfDnfs { get; set; }
    }

    public class RaceValidationResultDto
    {
        public int TotalPredictions { get; set; }
        public int SettledCount { get; set; }
        public int WinnersCount { get; set; }
        public int PartialWinnersCount { get; set; }
        public int LosersCount { get; set; }
        public int TotalCoinsAwarded { get; set; }
        public int TotalPointsAwarded { get; set; }
        public List<string> SettledUsernames { get; set; } = new();
    }
}
