using Application.Interfaces;
using Domain.Enums;
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

    public InfluxTickRepository(IConfiguration configuration, ILogger<InfluxTickRepository> logger)
    {
        _logger = logger;
        var url = configuration["InfluxDB:Url"] ?? "http://localhost:8086";
        var token = configuration["InfluxDB:Token"] ?? "my-token";
        _org = configuration["InfluxDB:Org"] ?? "TurnOne";
        
        var options = new InfluxDBClientOptions.Builder()
            .Url(url)
            .AuthenticateToken(token.ToCharArray())
            .Build();

        _client = new InfluxDBClient(options);
        _writeApi = _client.GetWriteApiAsync();
    }

    public async Task BatchWriteTicksAsync(PlanType planType, IEnumerable<TickRecord> ticks)
    {
        var bucket = planType switch
        {
            PlanType.BASIC => "telemetry_basic",
            PlanType.PRO => "telemetry_pro",
            PlanType.ELITE => "telemetry_elite",
            _ => "telemetry_basic"
        };

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
                        // Simplistic flattening for the demo (in reality handle nested arrays properly)
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
            await _writeApi.WritePointsAsync(points, bucket, _org);
        }
    }

    public async Task<List<ChartPoint>> GetSessionPhysicsChartAsync(PlanType planType, Guid sessionId)
    {
        var bucket = planType switch
        {
            PlanType.BASIC => "telemetry_basic",
            PlanType.PRO => "telemetry_pro",
            PlanType.ELITE => "telemetry_elite",
            _ => "telemetry_basic"
        };

        var query = $@"
            from(bucket: ""{bucket}"")
            |> range(start: 0)
            |> filter(fn: (r) => r.sessionId == ""{sessionId}"" and r.msgType == ""physics"")
            |> filter(fn: (r) => r._field == ""speedKmh"" or r._field == ""rpms"" or r._field == ""gas"" or r._field == ""brake"" or r._field == ""gear"")
            |> aggregateWindow(every: 1s, fn: mean, createEmpty: false)
            |> pivot(rowKey:[""_time""], columnKey: [""_field""], valueColumn: ""_value"")
        ";

        var points = new List<ChartPoint>();

        try
        {
            var tables = await _client.GetQueryApi().QueryAsync(query, _org);
            foreach (var record in tables.SelectMany(t => t.Records))
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
        var bucket = BucketFor(planType);
        var allowed = TelemetryChannels.AllowedFor(planType);
        var requested = channels.Where(c => allowed.Contains(c)).Distinct().ToList();
        if (requested.Count == 0) requested = allowed.Take(2).ToList();

        var window = TelemetryChannels.SampleWindowSeconds(planType);
        var fromExpr = from.HasValue ? from.Value.ToUniversalTime().ToString("o") : "0";
        var toClause = to.HasValue ? $", stop: {to.Value.ToUniversalTime():o}" : "";
        var fieldFilter = string.Join(" or ", requested.Select(c => $"r._field == \"{c}\""));

        var query = $@"
            from(bucket: ""{bucket}"")
            |> range(start: {fromExpr}{toClause})
            |> filter(fn: (r) => r.sessionId == ""{sessionId}"" and r.msgType == ""physics"")
            |> filter(fn: (r) => {fieldFilter})
            |> aggregateWindow(every: {window}s, fn: mean, createEmpty: false)
            |> pivot(rowKey:[""_time""], columnKey: [""_field""], valueColumn: ""_value"")
        ";

        var result = new MultiChannelChart { Channels = requested };

        try
        {
            var tables = await _client.GetQueryApi().QueryAsync(query, _org);
            foreach (var record in tables.SelectMany(t => t.Records))
            {
                var time = record.GetTimeInDateTime();
                if (time == null) continue;

                var point = new MultiChannelPoint
                {
                    Timestamp = (long)(time.Value.ToUniversalTime() - DateTime.UnixEpoch).TotalMilliseconds
                };

                foreach (var channel in requested)
                {
                    if (record.Values.TryGetValue(channel, out var raw) && raw != null)
                    {
                        try { point.Values[channel] = Convert.ToDouble(raw); }
                        catch { point.Values[channel] = null; }
                    }
                    else
                    {
                        point.Values[channel] = null;
                    }
                }

                result.Points.Add(point);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to query InfluxDB for multi-channel chart");
        }

        result.Points = result.Points.OrderBy(p => p.Timestamp).ToList();
        return result;
    }

    public async Task<(DateTime? start, DateTime? end)> GetLapBoundsAsync(PlanType planType, Guid sessionId, int lapNumber)
    {
        var bucket = BucketFor(planType);
        var query = $@"
            from(bucket: ""{bucket}"")
            |> range(start: 0)
            |> filter(fn: (r) => r.sessionId == ""{sessionId}"" and r.msgType == ""graphics"" and r._field == ""completedLaps"")
            |> filter(fn: (r) => r._value == {lapNumber - 1} or r._value == {lapNumber})
            |> keep(columns: [""_time"", ""_value""])
        ";

        try
        {
            var tables = await _client.GetQueryApi().QueryAsync(query, _org);
            DateTime? start = null;
            DateTime? end = null;

            foreach (var record in tables.SelectMany(t => t.Records).OrderBy(r => r.GetTimeInDateTime()))
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

    private static string BucketFor(PlanType planType) => planType switch
    {
        PlanType.BASIC => "telemetry_basic",
        PlanType.PRO => "telemetry_pro",
        PlanType.ELITE => "telemetry_elite",
        _ => "telemetry_basic"
    };

    public void Dispose()
    {
        _client.Dispose();
    }
}
