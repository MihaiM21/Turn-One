using Domain.Enums;

namespace Application.DTOs
{
    public class CoinTransactionDto
    {
        public Guid Id { get; set; }
        public int Amount { get; set; }
        public CoinTransactionType Type { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
