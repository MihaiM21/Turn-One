using Application.Interfaces;
using Domain.Enums;
using Domain.Telemetry;
using InfluxDB.Client.Core.Flux.Domain;
using System.Text.Json;
using InfluxDB.Client;
using InfluxDB.Client.Api.Domain;
using InfluxDB.Client.Writes;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class InfluxTickRepository : ITelemetryTickRepository, IDisposable
{
    private readonly InfluxDBClient _client;
    private readonly ILogger<InfluxTickRepository> _logger;
    private readonly WriteApiAsync _writeApi;
    private readonly string _org;
    private readonly string _bucket;
    /// <summary>Pre-single-bucket per-plan buckets, consulted read-only when the main bucket has no rows for a session.</summary>
    private readonly string[] _legacyBuckets;

    public InfluxTickRepository(IConfiguration configuration, ILogger<InfluxTickRepository> logger)
    {
        _logger = logger;
        var url = configuration["InfluxDB:Url"] ?? "http://localhost:8086";
        var token = configuration["InfluxDB:Token"] ?? "my-token";
        _org = configuration["InfluxDB:Org"] ?? "TurnOne";
        _bucket = configuration["InfluxDB:Bucket"] ?? "telemetry";
        var legacy = configuration.GetSection("InfluxDB:LegacyBuckets").GetChildren().Select(c => c.Value).OfType<string>().ToArray();
        _legacyBuckets = legacy.Length > 0 ? legacy : new[] { "telemetry_basic", "telemetry_pro", "telemetry_elite" };
        
        var options = new InfluxDBClientOptions.Builder()
            .Url(url)
            .AuthenticateToken(token.ToCharArray())
            .Build();

        _client = new InfluxDBClient(options);
        _writeApi = _client.GetWriteApiAsync();
    }

    public async Task BatchWriteTicksAsync(IEnumerable<TickRecord> ticks)
    {
        var points = new List<PointData>();

        foreach (var tick in ticks)
        {
            try
            {
                var point = PointData
                    .Measurement("telemetry")
                    .Tag("sessionId", tick.SessionId.ToString())
                    .Tag("msgType", tick.MessageType)
                    .Timestamp(tick.Timestamp, WritePrecision.Ms);

                // Flatten the JSON payload into fields
                var dict = JsonSerializer.Deserialize<Dictionary<string, object>>(tick.Payload.GetRawText());
                if (dict != null)
                {
                    foreach (var kvp in dict)
                    {
                        if (kvp.Value is JsonElement jsonElement)
                        {
                            switch (jsonElement.ValueKind)
                            {
                                case JsonValueKind.Number:
                                    point = point.Field(kvp.Key, jsonElement.GetDouble());
                                    break;
                                case JsonValueKind.String:
                                    point = point.Field(kvp.Key, jsonElement.GetString());
                                    break;
                                case JsonValueKind.True:
                                    point = point.Field(kvp.Key, true);
                                    break;
                                case JsonValueKind.False:
                                    point = point.Field(kvp.Key, false);
                                    break;
                                case JsonValueKind.Array:
                                    point = FlattenArray(point, kvp.Key, jsonElement);
                                    break;
                            }
                        }
                    }
                }

                points.Add(point);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse tick payload for InfluxDB");
            }
        }

        if (points.Any())
        {
            await _writeApi.WritePointsAsync(points, _bucket, _org);
        }
    }

    /// <summary>
    /// Expands numeric arrays into suffixed scalar fields so they are queryable: 4-element corner
    /// arrays become <c>{key}_fl/_fr/_rl/_rr</c> and 3-element vectors become <c>{key}_x/_y/_z</c>.
    /// Without this, <c>accG_x/_y/_z</c> were declared as channels but never actually written.
    /// </summary>
    private static PointData FlattenArray(PointData point, string key, JsonElement array)
    {
        var suffixes = array.GetArrayLength() switch
        {
            4 when ChannelRegistry.CornerArrayFields.Contains(key) => ChannelRegistry.CornerSuffixes,
            3 when ChannelRegistry.VectorArrayFields.Contains(key) => ChannelRegistry.AxisSuffixes,
            _ => null
        };
        if (suffixes == null) return point;

        var i = 0;
        foreach (var element in array.EnumerateArray())
        {
            if (i >= suffixes.Count) break;
            if (element.ValueKind == JsonValueKind.Number)
                point = point.Field(key + suffixes[i], element.GetDouble());
            i++;
        }

        return point;
    }

    public async Task<List<ChartPoint>> GetSessionPhysicsChartAsync(PlanType planType, Guid sessionId)
    {
        string Query(string bucket) => $@"
            from(bucket: ""{bucket}"")
            |> range(start: 0, stop: 2100-01-01T00:00:00Z)
            |> filter(fn: (r) => r.sessionId == ""{sessionId}"" and r.msgType == ""physics"")
            |> filter(fn: (r) => r._field == ""speedKmh"" or r._field == ""rpms"" or r._field == ""gas"" or r._field == ""brake"" or r._field == ""gear"")
            |> aggregateWindow(every: 1s, fn: mean, createEmpty: false)
            |> pivot(rowKey:[""_time""], columnKey: [""_field""], valueColumn: ""_value"")
        ";

        var points = new List<ChartPoint>();

        try
        {
            var records = await QueryWithLegacyFallbackAsync(Query);
            foreach (var record in records)
            {
                var pt = new ChartPoint
                {
                    Timestamp = record.GetTimeInDateTime()?.ToUniversalTime().Subtract(new DateTime(1970, 1, 1)).Ticks / 10000 ?? 0
                };
                
                if (record.Values.ContainsKey("speedKmh") && record.Values["speedKmh"] != null)
                    pt.SpeedKmh = Convert.ToDouble(record.Values["speedKmh"]);
                if (record.Values.ContainsKey("rpms") && record.Values["rpms"] != null)
                    pt.Rpms = Convert.ToDouble(record.Values["rpms"]);
                if (record.Values.ContainsKey("gas") && record.Values["gas"] != null)
                    pt.Gas = Convert.ToDouble(record.Values["gas"]);
                if (record.Values.ContainsKey("brake") && record.Values["brake"] != null)
                    pt.Brake = Convert.ToDouble(record.Values["brake"]);
                if (record.Values.ContainsKey("gear") && record.Values["gear"] != null)
                    pt.Gear = Convert.ToInt32(record.Values["gear"]);

                points.Add(pt);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to query InfluxDB for chart");
        }

        return points.OrderBy(p => p.Timestamp).ToList();
    }

    public async Task<MultiChannelChart> GetSessionChannelsAsync(
        PlanType planType,
        Guid sessionId,
        IReadOnlyCollection<string> channels,
        DateTime? from = null,
        DateTime? to = null)
    {
        var requested = ChannelRegistry.ResolveAllowed(planType, channels);
        if (requested.Count == 0)
            requested = ChannelRegistry.ResolveAllowed(planType, ChannelRegistry.AllowedFor(planType).Take(2));

        var windowMs = ChannelRegistry.SampleWindowMs(planType, from, to);
        var fromExpr = from.HasValue ? from.Value.ToUniversalTime().ToString("o") : "0";
        var toClause = to.HasValue ? $", stop: {to.Value.ToUniversalTime():o}" : "";

        var result = new MultiChannelChart { Channels = requested.Select(d => d.Key).ToList() };

        // One query per (msgType, aggregation) pair: channels live in different message types and
        // averaging a gear number or a track-spline position across a window produces nonsense.
        var groups = requested
            .GroupBy(d => (d.MsgType, d.Agg))
            .ToList();

        // timestamp -> channel -> value
        var merged = new SortedDictionary<long, Dictionary<string, double?>>();

        foreach (var group in groups)
        {
            var keys = group.Select(d => d.Key).ToList();
            var fieldFilter = string.Join(" or ", keys.Select(c => $"r._field == \"{c}\""));
            var fn = group.Key.Agg == ChannelAggregation.Last ? "last" : "mean";

            string Query(string bucket) => $@"
                from(bucket: ""{bucket}"")
                |> range(start: {fromExpr}{toClause})
                |> filter(fn: (r) => r.sessionId == ""{sessionId}"" and r.msgType == ""{group.Key.MsgType}"")
                |> filter(fn: (r) => {fieldFilter})
                |> aggregateWindow(every: {windowMs}ms, fn: {fn}, createEmpty: false)
                |> pivot(rowKey:[""_time""], columnKey: [""_field""], valueColumn: ""_value"")
            ";

            try
            {
                var records = await QueryWithLegacyFallbackAsync(Query);
                foreach (var record in records)
                {
                    var time = record.GetTimeInDateTime();
                    if (time == null) continue;

                    var ts = (long)(time.Value.ToUniversalTime() - DateTime.UnixEpoch).TotalMilliseconds;
                    if (!merged.TryGetValue(ts, out var row))
                    {
                        row = new Dictionary<string, double?>();
                        merged[ts] = row;
                    }

                    foreach (var channel in keys)
                    {
                        if (record.Values.TryGetValue(channel, out var raw) && raw != null)
                        {
                            try { row[channel] = Convert.ToDouble(raw); }
                            catch { row[channel] = null; }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to query InfluxDB for channels {Channels} ({MsgType})",
                    string.Join(",", keys), group.Key.MsgType);
            }
        }

        foreach (var (ts, row) in merged)
        {
            var point = new MultiChannelPoint { Timestamp = ts };
            foreach (var def in requested)
                point.Values[def.Key] = row.TryGetValue(def.Key, out var v) ? v : null;
            result.Points.Add(point);
        }

        return result;
    }

    public async Task<(DateTime? start, DateTime? end)> GetLapBoundsAsync(PlanType planType, Guid sessionId, int lapNumber)
    {
        string Query(string bucket) => $@"
            from(bucket: ""{bucket}"")
            |> range(start: 0, stop: 2100-01-01T00:00:00Z)
            |> filter(fn: (r) => r.sessionId == ""{sessionId}"" and r.msgType == ""graphics"" and r._field == ""completedLaps"")
            |> filter(fn: (r) => r._value == {lapNumber - 1} or r._value == {lapNumber})
            |> keep(columns: [""_time"", ""_value""])
        ";

        try
        {
            var records = await QueryWithLegacyFallbackAsync(Query);
            DateTime? start = null;
            DateTime? end = null;

            foreach (var record in records.OrderBy(r => r.GetTimeInDateTime()))
            {
                var time = record.GetTimeInDateTime();
                if (time == null) continue;
                var value = Convert.ToInt32(record.GetValue());

                if (start == null && value == lapNumber - 1) start = time;
                if (value == lapNumber) { end = time; break; }
            }

            return (start, end);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to query InfluxDB for lap bounds");
            return (null, null);
        }
    }

    public async Task<List<RawTick>> GetLapTicksRawAsync(Guid sessionId, DateTime from, DateTime to)
    {
        var fromExpr = from.ToUniversalTime().ToString("o");
        var toExpr = to.ToUniversalTime().ToString("o");

        string Query(string bucket) => $@"
            from(bucket: ""{bucket}"")
            |> range(start: {fromExpr}, stop: {toExpr})
            |> filter(fn: (r) => r.sessionId == ""{sessionId}"")
            |> pivot(rowKey:[""_time""], columnKey: [""_field""], valueColumn: ""_value"")
        ";

        var result = new List<RawTick>();
        try
        {
            var records = await QueryWithLegacyFallbackAsync(Query);
            foreach (var record in records)
            {
                var time = record.GetTimeInDateTime();
                if (time == null) continue;

                var msgType = record.Values.TryGetValue("msgType", out var mt) ? mt?.ToString() ?? "" : "";
                var tick = new RawTick { Time = time.Value.ToUniversalTime(), MsgType = msgType };
                foreach (var (key, value) in record.Values)
                {
                    if (key is "_time" or "_start" or "_stop" or "_measurement" or "result" or "table" or "sessionId" or "msgType") continue;
                    if (value == null) continue;
                    try { tick.Fields[key] = Convert.ToDouble(value); }
                    catch { /* non-numeric field (e.g. a string tag) — skip */ }
                }
                result.Add(tick);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to query InfluxDB for raw lap ticks");
        }

        return result.OrderBy(t => t.Time).ToList();
    }

    public async Task<List<(DateTime start, DateTime end)>> GetV2LapBoundsAsync(Guid sessionId)
    {
        string Query(string bucket) => $@"
            from(bucket: ""{bucket}"")
            |> range(start: 0, stop: 2100-01-01T00:00:00Z)
            |> filter(fn: (r) => r.sessionId == ""{sessionId}"" and r.msgType == ""tick"" and r._field == ""lap"")
            |> keep(columns: [""_time"", ""_value""])
        ";

        try
        {
            var records = await QueryWithLegacyFallbackAsync(Query);
            var byLap = new SortedDictionary<int, (DateTime min, DateTime max)>();
            foreach (var record in records)
            {
                var time = record.GetTimeInDateTime();
                if (time == null) continue;
                int lap;
                try { lap = Convert.ToInt32(record.GetValue()); }
                catch { continue; }

                var t = time.Value.ToUniversalTime();
                if (byLap.TryGetValue(lap, out var range))
                    byLap[lap] = (range.min < t ? range.min : t, range.max > t ? range.max : t);
                else
                    byLap[lap] = (t, t);
            }

            return byLap.Select(kv => (kv.Value.min, kv.Value.max)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to query InfluxDB for v2 lap bounds");
            return new List<(DateTime, DateTime)>();
        }
    }

    /// <summary>
    /// Runs <paramref name="queryFor"/> against the main bucket; if it yields no rows, tries each legacy
    /// per-plan bucket in turn. Sessions recorded before the single-bucket change live in one of those,
    /// and a user's plan at read time no longer says which — so we look rather than guess.
    /// </summary>
    private async Task<List<FluxRecord>> QueryWithLegacyFallbackAsync(Func<string, string> queryFor)
    {
        var api = _client.GetQueryApi();
        foreach (var bucket in new[] { _bucket }.Concat(_legacyBuckets))
        {
            List<FluxRecord> records;
            try
            {
                var tables = await api.QueryAsync(queryFor(bucket), _org);
                records = tables.SelectMany(t => t.Records).ToList();
            }
            catch (Exception ex) when (bucket != _bucket)
            {
                // A missing legacy bucket is expected on fresh deployments.
                _logger.LogDebug(ex, "Legacy bucket {Bucket} unavailable", bucket);
                continue;
            }
            if (records.Count > 0) return records;
        }
        return new List<FluxRecord>();
    }

    public void Dispose()
    {
        _client.Dispose();
    }
}
