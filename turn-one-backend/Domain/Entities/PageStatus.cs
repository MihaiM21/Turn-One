namespace Domain.Entities
{
    public class PageStatus
    {
        public int Id { get; set; }
        public string PageName { get; set; } = string.Empty; // e.g., "/live", "/generator"
        public bool IsClosed { get; set; }
        public string MaintenanceMessage { get; set; } = string.Empty;
    }
}
