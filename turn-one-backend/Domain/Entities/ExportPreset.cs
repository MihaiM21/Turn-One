using Domain.Enums;

namespace Domain.Entities
{
    public class ExportPreset
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public SessionType SessionType { get; set; }
        public string ChartKeys { get; set; } = "[]";
        public string OutputSizes { get; set; } = "[]";
        public Guid CreatedByUserId { get; set; }
        public User CreatedBy { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
