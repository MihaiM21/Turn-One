using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;


namespace Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _smtpUser;
        private readonly string _smtpPass;
        private readonly string _fromAddress;
        private readonly string _fromName;
        private readonly ILogger<EmailService> _logger;
    private readonly bool _isProduction;
    private readonly bool _sendInDevelopment;
    
        public EmailService(string smtpHost, int smtpPort, string fromEmail, string fromName, string smtpUser, string smtpPass, bool sendInDevelopment, ILogger<EmailService> logger)
        {
            _fromAddress = fromEmail;
            _fromName = fromName;
            _logger = logger;
            _smtpHost = smtpHost;
            _smtpPort = smtpPort;
            _smtpUser = smtpUser;
            _smtpPass = smtpPass;

            // In development, decide whether to actually send emails based on a flag
            _isProduction = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") != "Development";
            _sendInDevelopment = sendInDevelopment;

            if (!(_isProduction || _sendInDevelopment))
            {
                _logger.LogInformation("Email service running in development mode - emails will be logged but not sent");
            }
        }

        public async Task SendEmailAsync(string toAddress, string subject, string body)
        {
            // If not in production and not configured to send in development, log and skip sending
            if (!(_isProduction || _sendInDevelopment))
            {
                // Log the email info
                _logger?.LogInformation($"[DEV] Email would be sent:\nTo: {toAddress}\nSubject: {subject}\nBody: {body}");
                return;
            }
            
            try
            {
                // If not allowed to send in this environment, just log the email
                if (!(_isProduction || _sendInDevelopment))
                {
                    _logger?.LogInformation($"[DEV] Email would be sent:\nTo: {toAddress}\nSubject: {subject}\nBody: {body}");
                    return;
                }

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_fromName, _fromAddress));
                message.To.Add(MailboxAddress.Parse(toAddress));
                message.Subject = subject;

                var builder = new BodyBuilder { HtmlBody = body };
                message.Body = builder.ToMessageBody();

                using var client = new MailKit.Net.Smtp.SmtpClient();

                // Choose the SSL/TLS mode based on port conventions or try StartTls if not 465
                SecureSocketOptions options = _smtpPort == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;

                // Set timeout to 30 seconds for all operations
                client.Timeout = 30000;
                
                int maxRetries = 3;
                int currentTry = 0;
                bool connected = false;

                while (!connected && currentTry < maxRetries)
                {
                    try
                    {
                        currentTry++;
                        _logger?.LogInformation($"Attempting to connect to SMTP server {_smtpHost}:{_smtpPort} (attempt {currentTry}/{maxRetries})");
                        
                        await client.ConnectAsync(_smtpHost, _smtpPort, options);
                        connected = true;
                        
                        _logger?.LogInformation("Successfully connected to SMTP server");
                    }
                    catch (Exception ex) when (currentTry < maxRetries)
                    {
                        _logger?.LogWarning($"Failed to connect on attempt {currentTry}/{maxRetries}: {ex.Message}");
                        await Task.Delay(2000 * currentTry); // Exponential backoff
                    }
                }

                if (!connected)
                {
                    throw new TimeoutException($"Failed to connect to SMTP server after {maxRetries} attempts");
                }

                if (!string.IsNullOrEmpty(_smtpUser) && !string.IsNullOrEmpty(_smtpPass))
                {
                    _logger?.LogInformation("Authenticating with SMTP server...");
                    await client.AuthenticateAsync(_smtpUser, _smtpPass);
                    _logger?.LogInformation("Successfully authenticated with SMTP server");
                }

                _logger?.LogInformation("Sending email message...");
                await client.SendAsync(message);
                _logger?.LogInformation("Email sent successfully");

                await client.DisconnectAsync(true);

                _logger?.LogInformation($"Email sent successfully to {toAddress}");
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, $"Failed to send email to {toAddress}: {ex.Message}");
                throw;
            }
        }

        public async Task SendPasswordResetEmailAsync(string toAddress, string resetLink)
        {
            string subject = "Password Reset Request - Turn One F1";
            string body = $@"
                <html>
                <body style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;'>
                    <div style='background-color: #000; padding: 20px; text-align: center;'>
                        <img src='https://t1f1.com/logo.png' alt='Turn One Logo' style='max-width: 200px;'>
                    </div>
                    <div style='padding: 20px; background-color: #f9f9f9;'>
                        <h2 style='color: #cc0000;'>Password Reset Request</h2>
                        <p>You recently requested to reset your password for your Turn One account. Click the button below to reset it.</p>
                        <p style='text-align: center;'>
                            <a href='{resetLink}' style='display: inline-block; background-color: #cc0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;'>Reset Your Password</a>
                        </p>
                        <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
                        <p>This link will expire in 1 hour for security reasons.</p>
                    </div>
                    <div style='padding: 20px; text-align: center; font-size: 12px; color: #666;'>
                        <p>© {DateTime.UtcNow.Year} Turn One F1 - All rights reserved</p>
                        <p>This is an automated message, please do not reply directly to this email.</p>
                    </div>
                </body>
                </html>
            ";

            await SendEmailAsync(toAddress, subject, body);
        }
        
        public async Task SendEmailConfirmationAsync(string toAddress, string confirmationLink)
        {
            string subject = "Confirm Your Email - Turn One F1";
            string body = $@"
                <html>
                <body style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;'>
                    <div style='background-color: #000; padding: 20px; text-align: center;'>
                        <img src='https://t1f1.com/logo.png' alt='Turn One Logo' style='max-width: 200px;'>
                    </div>
                    <div style='padding: 20px; background-color: #f9f9f9;'>
                        <h2 style='color: #cc0000;'>Welcome to Turn One!</h2>
                        <p>Thank you for registering with us. To complete your registration and access your F1 telemetry dashboard, please confirm your email address.</p>
                        <p style='text-align: center;'>
                            <a href='{confirmationLink}' style='display: inline-block; background-color: #cc0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;'>Confirm Your Email</a>
                        </p>
                        <p>If you did not create an account with Turn One, please ignore this email.</p>
                        <p>This link will expire in 24 hours.</p>
                    </div>
                    <div style='padding: 20px; text-align: center; font-size: 12px; color: #666;'>
                        <p>© {DateTime.UtcNow.Year} Turn One F1 - All rights reserved</p>
                        <p>This is an automated message, please do not reply directly to this email.</p>
                    </div>
                </body>
                </html>
            ";

            await SendEmailAsync(toAddress, subject, body);
        }
    }
}