namespace Application.DTOs
{
    public class ExportPresetDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SessionType { get; set; } = string.Empty;
        public List<string> ChartKeys { get; set; } = new();
        public List<string> OutputSizes { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string CreatedByUsername { get; set; } = string.Empty;
    }

    public class CreateExportPresetDto
    {
        public string Name { get; set; } = string.Empty;
        public string SessionType { get; set; } = "RACE";
        public List<string> ChartKeys { get; set; } = new();
        public List<string> OutputSizes { get; set; } = new();
    }

    public class UpdateExportPresetDto
    {
        public string? Name { get; set; }
        public string? SessionType { get; set; }
        public List<string>? ChartKeys { get; set; }
        public List<string>? OutputSizes { get; set; }
    }
}
