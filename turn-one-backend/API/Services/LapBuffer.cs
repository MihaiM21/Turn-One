using System.Collections.Concurrent;
using Application.Telemetry;

namespace API.Services;

/// <summary>
/// Accumulates one in-progress lap's ticks for protocol-v2 ingestion until the lap-cut rule closes it
/// into a <c>LapJob</c>. Bounded so a stuck lap counter (or a runaway session) can't grow memory without limit —
/// beyond the cap it keeps only the first and last tick and reports <see cref="Overflowed"/>, and the
/// processor records a Skipped row instead of a real lap. See <c>docs/architecture/sim-telemetry-protocol-v2.md</c> §6.
/// </summary>
public sealed class LapBuffer
{
    /// <summary>Hard cap on tick count — well above a realistic lap (24 000 ticks at 20 Hz ≈ 20 minutes).</summary>
    public const int MaxTicks = 24_000;

    /// <summary>Hard cap on lap duration, seconds — guards against a lap that never gets a cut (e.g. missing lap_complete and a stuck counter).</summary>
    public const int MaxSpanSeconds = 1200;

    private readonly List<TickV2> _ticks = new(4096);
    private TickV2? _first;
    private TickV2? _last;

    /// <summary>True once the buffer hit a cap; only the first and last tick are retained from that point on.</summary>
    public bool Overflowed { get; private set; }

    /// <summary>Ticks collected so far, in arrival order. When <see cref="Overflowed"/>, this is just [first, last].</summary>
    public IReadOnlyList<TickV2> Ticks
    {
        get
        {
            if (!Overflowed) return _ticks;
            var kept = new List<TickV2>(2);
            if (_first != null) kept.Add(_first);
            if (_last != null && !ReferenceEquals(_last, _first)) kept.Add(_last);
            return kept;
        }
    }

    public int Count => Overflowed ? Ticks.Count : _ticks.Count;

    /// <summary>Most recently added tick, or null when empty.</summary>
    public TickV2? Last => _last;

    /// <summary>Rough memory footprint: 4 bytes per channel per tick, plus a small fixed overhead.</summary>
    public long ApproxBytes => (long)_ticks.Count * 4 * TickLayout.Count + 64;

    /// <summary>Appends a tick. Returns false once the buffer is (or just became) overflowed — the caller
    /// should treat the eventual lap as a Skipped/overflow job rather than a normally-processed one.</summary>
    public bool Add(TickV2 tick)
    {
        if (Overflowed)
        {
            _last = tick;
            return false;
        }

        if (_ticks.Count == 0) _first = tick;

        var overflowingBySize = _ticks.Count >= MaxTicks;
        var overflowingBySpan = _ticks.Count > 0 && tick.T - _ticks[0].T > MaxSpanSeconds * 1000L;

        if (overflowingBySize || overflowingBySpan)
        {
            Overflowed = true;
            _last = tick;
            _ticks.Clear();
            return false;
        }

        _ticks.Add(tick);
        _last = tick;
        return true;
    }

    /// <summary>Forces an overflow (used by <see cref="LapBufferRegistry"/> to shed the largest buffer under memory pressure).</summary>
    public void MarkOverflowed()
    {
        if (Overflowed) return;
        Overflowed = true;
        _last ??= _first;
        _ticks.Clear();
    }
}

/// <summary>
/// Tracks the aggregate approximate byte size of all live <see cref="LapBuffer"/>s across sessions and
/// sheds the largest one when the configured total is exceeded. Registered as a singleton so it sees
/// every session's buffer regardless of which connection is handling it.
/// </summary>
public sealed class LapBufferRegistry
{
    /// <summary>Default aggregate cap across all in-flight lap buffers, bytes. Configurable via <c>LapBuffer:MaxTotalBytes</c>.</summary>
    public const long DefaultMaxTotalBytes = 256L * 1024 * 1024;

    private readonly ConcurrentDictionary<Guid, LapBuffer> _buffers = new();
    private readonly long _maxTotalBytes;

    public LapBufferRegistry(IConfiguration configuration)
    {
        _maxTotalBytes = configuration.GetValue<long?>("LapBuffer:MaxTotalBytes") ?? DefaultMaxTotalBytes;
    }

    public void Register(Guid sessionId, LapBuffer buffer)
    {
        _buffers[sessionId] = buffer;
        EnforceLimit();
    }

    public void Unregister(Guid sessionId) => _buffers.TryRemove(sessionId, out _);

    /// <summary>Call after any buffer grows (e.g. on each tick) to keep the aggregate in check.</summary>
    public void EnforceLimit()
    {
        long total = 0;
        foreach (var b in _buffers.Values) total += b.ApproxBytes;
        if (total <= _maxTotalBytes) return;

        LapBuffer? largest = null;
        long largestBytes = -1;
        foreach (var b in _buffers.Values)
        {
            if (b.Overflowed) continue;
            var bytes = b.ApproxBytes;
            if (bytes > largestBytes) { largestBytes = bytes; largest = b; }
        }
        largest?.MarkOverflowed();
    }
}
