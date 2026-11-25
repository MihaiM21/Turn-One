using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <summary>
    /// BUG-019: sessions whose stored best lap is not a believable lap (under 20 s, or faster than
    /// the track length at 360 km/h) get their best recomputed from their own valid, believable
    /// laps, or 0 when they have none. Sessions with a believable best are not touched. The
    /// thresholds match <c>Domain.Telemetry.LapPlausibility</c>.
    /// </summary>
    public partial class RepairImplausibleSessionBestLaps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "TelemetrySessions" AS s
                SET "BestLapMs" = COALESCE((
                    SELECT MIN(l."LapTimeMs")
                    FROM "TelemetryLaps" AS l
                    WHERE l."SessionId" = s."Id"
                      AND l."IsValid"
                      AND l."LapTimeMs" >= 20000
                      AND (s."TrackLengthM" IS NULL OR s."TrackLengthM" <= 0
                           OR l."LapTimeMs" >= s."TrackLengthM" / 100.0 * 1000.0)
                ), 0)
                WHERE s."BestLapMs" > 0
                  AND (s."BestLapMs" < 20000
                       OR (s."TrackLengthM" > 0 AND s."BestLapMs" < s."TrackLengthM" / 100.0 * 1000.0));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Data repair: the implausible values it replaced are not worth restoring.
        }
    }
}
