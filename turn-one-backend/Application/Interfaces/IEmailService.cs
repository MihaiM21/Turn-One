using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toAddress, string subject, string body);
        Task SendPasswordResetEmailAsync(string toAddress, string resetLink);
        Task SendEmailConfirmationAsync(string toAddress, string confirmationLink);
    }
}