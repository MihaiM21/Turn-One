using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<ContactController> _logger;
    private readonly ITurnstileService _turnstileService;

    public ContactController(IEmailService emailService, ILogger<ContactController> logger, ITurnstileService turnstileService)
    {
        _emailService = emailService;
        _logger = logger;
        _turnstileService = turnstileService;
    }

    [HttpPost]
    public async Task<ActionResult> SendContactForm([FromBody] ContactFormDto contactForm)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!await _turnstileService.VerifyTokenAsync(contactForm.TurnstileToken))
        {
            return BadRequest(new { success = false, message = "Invalid captcha. Please try again." });
        }

        try
        {
            var emailBody = $@"
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
        .field {{ margin-bottom: 20px; }}
        .label {{ font-weight: bold; color: #374151; margin-bottom: 5px; display: block; }}
        .value {{ color: #1f2937; padding: 10px; background: white; border-left: 3px solid #dc2626; }}
        .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>New Contact Form Submission</h1>
            <p>Turn One - Formula 1 Analysis Platform</p>
        </div>
        <div class='content'>
            <div class='field'>
                <span class='label'>From:</span>
                <div class='value'>{contactForm.FirstName} {contactForm.LastName}</div>
            </div>
            <div class='field'>
                <span class='label'>Email:</span>
                <div class='value'>{contactForm.Email}</div>
            </div>
            {(!string.IsNullOrEmpty(contactForm.Company) ? $@"
            <div class='field'>
                <span class='label'>Company:</span>
                <div class='value'>{contactForm.Company}</div>
            </div>" : "")}
            <div class='field'>
                <span class='label'>Subject:</span>
                <div class='value'>{contactForm.Subject}</div>
            </div>
            <div class='field'>
                <span class='label'>Message:</span>
                <div class='value'>{contactForm.Message}</div>
            </div>
            <div class='footer'>
                <p>This email was sent from the Turn One contact form.</p>
                <p>Reply directly to {contactForm.Email} to respond to the sender.</p>
            </div>
        </div>
    </div>
</body>
</html>";

            await _emailService.SendEmailAsync(
                "contact@t1f1.com",
                $"Contact Form: {contactForm.Subject}",
                emailBody
            );

            _logger.LogInformation(
                "Contact form submitted successfully from {Email} - Subject: {Subject}",
                contactForm.Email,
                contactForm.Subject
            );

            return Ok(new { success = true, message = "Message sent successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send contact form email from {Email}", contactForm.Email);
            return StatusCode(500, new { success = false, message = "Failed to send message. Please try again later." });
        }
    }
}
