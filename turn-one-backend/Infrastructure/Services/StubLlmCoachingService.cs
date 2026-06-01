using Application.Interfaces;
using Domain.Enums;

namespace Infrastructure.Services;

/// LLM-shaped coaching service. Today it delegates to the heuristic implementation;
/// the contract is identical to what a Claude/OpenAI-backed implementation will provide,
/// so swapping providers later doesn't touch callers.
public class StubLlmCoachingService : ICoachingService
{
    private readonly HeuristicCoachingService _inner;

    public StubLlmCoachingService(HeuristicCoachingService inner)
    {
        _inner = inner;
    }

    public Task<List<CoachingTip>> GenerateTipsAsync(PlanType plan, Guid sessionId, int? lapNumber = null)
        => _inner.GenerateTipsAsync(plan, sessionId, lapNumber);

    public async Task<CoachingChatReply> ChatAsync(PlanType plan, Guid sessionId, string message, IEnumerable<CoachingChatMessage>? history = null)
    {
        var inner = await _inner.ChatAsync(plan, sessionId, message, history);
        return new CoachingChatReply
        {
            Content = inner.Content + "\n\n_(stub LLM provider — wire Claude/OpenAI here when ready)_",
            Provider = "stub-llm"
        };
    }
}
