using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace API.Middleware
{
    /// <summary>
    /// Middleware to add security headers to HTTP responses for enhanced security
    /// </summary>
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Add security headers
            
            // Prevent clickjacking attacks
            context.Response.Headers.Append("X-Frame-Options", "DENY");
            
            // Prevent MIME type sniffing
            context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
            
            // Enable XSS protection
            context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
            
            // Referrer policy
            context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
            
            // Content Security Policy (adjust as needed for your application)
            context.Response.Headers.Append("Content-Security-Policy", 
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self' data:; " +
                "connect-src 'self' wss: https:; " +
                "frame-ancestors 'none';");
            
            // Permissions Policy (formerly Feature-Policy)
            context.Response.Headers.Append("Permissions-Policy", 
                "geolocation=(), microphone=(), camera=()");

            await _next(context);
        }
    }
}
