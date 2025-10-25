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
                    <body style='margin:0; padding:0; font-family:'Segoe UI', Arial, sans-serif; background-color:#0b0b0b; color:#e6e6e6;'>
                        <div style='max-width:600px; margin:0 auto; background-color:#141414; border-radius:10px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.6);'>
                        
                        <!-- Header -->
                        <div style='background:linear-gradient(135deg,#cc0000,#ff1a1a); padding:30px; text-align:center;'>
                            <!-- <img src='https://t1f1.com/logo.png' alt='Turn One Logo' style='max-width:180px; filter:brightness(0) invert(1);'> -->
                            <p style='font-size:28px; color:#fff; margin:0; font-weight:700; letter-spacing:1px;'>Turn One</p>
                        </div>

                        <!-- Body -->
                        <div style='padding:35px 30px; background-color:#141414;'>
                            <h2 style='color:#ff1a1a; margin-top:0; text-align:center; font-size:22px; letter-spacing:0.5px;'>
                            Password Reset Request
                            </h2>

                            <p style='font-size:15px; line-height:1.7; color:#c7c7c7;'>
                            We received a request to reset the password associated with your <strong>Turn One</strong> account.  
                            If you made this request, please click the button below to securely reset your password.
                            </p>

                            <div style='text-align:center; margin:35px 0;'>
                            <a href='{resetLink}' style='background-color:#cc0000; color:#fff; padding:14px 36px; text-decoration:none; border-radius:6px; font-weight:600; letter-spacing:0.6px; display:inline-block; box-shadow:0 4px 12px rgba(204,0,0,0.4); transition:all 0.2s;'>
                                Reset Your Password
                            </a>
                            </div>

                            <p style='font-size:14px; color:#a0a0a0; line-height:1.6; margin-top:25px;'>
                            If you didn’t request this password reset, you can safely ignore this email — your account will remain secure.
                            </p>

                            <p style='font-size:13px; color:#888; line-height:1.6;'>
                            For security reasons, this link will expire in <strong>1 hour</strong>.  
                            If you continue to experience issues, please contact our support team at  
                            <a href='mailto:support@t1f1.com' style='color:#ff1a1a; text-decoration:none;'>support@t1f1.com</a>.
                            </p>

                            <hr style='border:0; border-top:1px solid #222; margin:35px 0;'>

                            <p style='font-size:13px; color:#777; text-align:center; line-height:1.6;'>
                            Stay connected with <strong>Turn One F1</strong> — explore our latest telemetry analyses,  
                            shop unique Formula 1 collectibles, and join our community of racing enthusiasts at  
                            <a href='https://turnonehub.com' style='color:#cc0000; text-decoration:none;'>turnonehub.com</a>
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style='background-color:#0b0b0b; text-align:center; padding:22px; font-size:12px; color:#666;'>
                            <p style='margin:5px 0;'>© {DateTime.UtcNow.Year} <strong>Turn One F1</strong> — All rights reserved.</p>
                            <p style='margin:5px 0;'>This is an automated message. Please do not reply directly.</p>
                        </div>

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
                    <body style='margin:0; padding:0; font-family:'Segoe UI', Arial, sans-serif; background-color:#0b0b0b; color:#e6e6e6;'>
                        <div style='max-width:600px; margin:0 auto; background-color:#141414; border-radius:10px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.6);'>
                        
                        <!-- Header -->
                        <div style='background:linear-gradient(135deg,#cc0000,#ff1a1a); padding:30px; text-align:center;'>
                            <!-- <img src='https://t1f1.com/logo.png' alt='Turn One Logo' style='max-width:180px; filter:brightness(0) invert(1);'> -->
                            <p style='font-size:28px; color:#fff; margin:0; font-weight:700; letter-spacing:1px;'>Turn One</p>
                        </div>

                        <!-- Body -->
                        <div style='padding:35px 30px; background-color:#141414;'>
                            <h2 style='color:#ff1a1a; margin-top:0; text-align:center; font-size:22px; letter-spacing:0.5px;'>
                            Welcome to Turn One!
                            </h2>

                            <p style='font-size:15px; line-height:1.7; color:#c7c7c7; text-align:center; margin-top:20px;'>
                            Thank you for joining <strong>Turn One</strong>, your hub for Formula 1 telemetry, analysis, and racing insights.
                            </p>

                            <p style='font-size:15px; line-height:1.7; color:#c7c7c7; text-align:center;'>
                            To complete your registration and access your personalized telemetry dashboard, please confirm your email address below.
                            </p>

                            <div style='text-align:center; margin:35px 0;'>
                            <a href='{confirmationLink}' style='background-color:#cc0000; color:#fff; padding:14px 36px; text-decoration:none; border-radius:6px; font-weight:600; letter-spacing:0.6px; display:inline-block; box-shadow:0 4px 12px rgba(204,0,0,0.4); transition:all 0.2s;'>
                                Confirm Your Email
                            </a>
                            </div>

                            <p style='font-size:14px; color:#a0a0a0; line-height:1.6; text-align:center; margin-top:25px;'>
                            If you did not create an account with Turn One, please ignore this message — no further action is required.
                            </p>

                            <p style='font-size:13px; color:#888; line-height:1.6; text-align:center;'>
                            For security reasons, this confirmation link will expire in <strong>24 hours</strong>.
                            </p>

                            <hr style='border:0; border-top:1px solid #222; margin:35px 0;'>

                            <p style='font-size:13px; color:#777; text-align:center; line-height:1.6;'>
                            Discover the world of <strong>Turn One F1</strong> — explore telemetry insights, shop exclusive F1-inspired collectibles,  
                            and stay updated with our latest racing analyses at  
                            <a href='https://turnonehub.com' style='color:#cc0000; text-decoration:none;'>turnonehub.com</a>.
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style='background-color:#0b0b0b; text-align:center; padding:22px; font-size:12px; color:#666;'>
                            <p style='margin:5px 0;'>© {DateTime.UtcNow.Year} <strong>Turn One F1</strong> — All rights reserved.</p>
                            <p style='margin:5px 0;'>This is an automated message. Please do not reply directly.</p>
                        </div>

                        </div>
                    </body>
                    </html>

            ";

            await SendEmailAsync(toAddress, subject, body);
        }
    }
}