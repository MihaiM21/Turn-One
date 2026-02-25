namespace Application.Interfaces
{
    public interface ITurnstileService
    {
        Task<bool> VerifyTokenAsync(string token);
    }
}
