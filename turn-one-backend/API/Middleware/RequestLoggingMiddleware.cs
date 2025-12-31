using System.Diagnostics;

namespace API.Middleware
{
    /// <summary>
    /// Middleware to log HTTP request/response details and measure performance
    /// </summary>
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var sw = Stopwatch.StartNew();
            var requestPath = context.Request.Path;
            var requestMethod = context.Request.Method;
            
            try
            {
                // Log request start
                _logger.LogInformation(
                    "HTTP {Method} {Path} started",
                    requestMethod,
                    requestPath);

                await _next(context);

                sw.Stop();

                // Log request completion with timing
                var statusCode = context.Response.StatusCode;
                var logLevel = statusCode >= 500 ? LogLevel.Error :
                              statusCode >= 400 ? LogLevel.Warning :
                              LogLevel.Information;

                _logger.Log(
                    logLevel,
                    "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs}ms",
                    requestMethod,
                    requestPath,
                    statusCode,
                    sw.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                sw.Stop();
                
                _logger.LogError(
                    ex,
                    "HTTP {Method} {Path} failed after {ElapsedMs}ms",
                    requestMethod,
                    requestPath,
                    sw.ElapsedMilliseconds);
                
                throw;
            }
        }
    }
}
