using System.Security.Claims;
using Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TurnOne.Application.Interfaces;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
    {
        var response = await _authService.Register(registerDto);
        
        if (!response.Success)
        {
            return BadRequest(response);
        }
        
        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
    {
        var response = await _authService.Login(loginDto);
        
        if (!response.Success)
        {
            return Unauthorized(response);
        }
        
        return Ok(response);
    }
    
    [Authorize]
    [HttpGet("me")]
    public ActionResult<object> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var username = User.FindFirstValue(ClaimTypes.Name);
        var email = User.FindFirstValue(ClaimTypes.Email);
        
        return Ok(new
        {
            UserId = userId,
            Username = username,
            Email = email,
            Claims = User.Claims.Select(c => new { c.Type, c.Value })
        });
    }
    
}