namespace Application.DTOs
{
    public class PurchaseTokensDto
    {
        /// <summary>
        /// Id of a pack in the server-side catalog (Domain.Entities.TokenPack).
        /// The token amount and coin cost are resolved from that catalog — they are
        /// deliberately NOT accepted from the caller.
        /// </summary>
        public string PackId { get; set; } = string.Empty;
    }
}
