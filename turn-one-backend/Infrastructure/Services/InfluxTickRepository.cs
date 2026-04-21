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

    public void Dispose()
    {
        _client.Dispose();
    }
}
