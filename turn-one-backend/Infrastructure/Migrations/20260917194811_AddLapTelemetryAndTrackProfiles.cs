using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLapTelemetryAndTrackProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CarId",
                table: "TelemetrySessions",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SchemaVersion",
                table: "TelemetrySessions",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "SectorCount",
                table: "TelemetrySessions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SessionKind",
                table: "TelemetrySessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Source",
                table: "TelemetrySessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TickRateHz",
                table: "TelemetrySessions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrackId",
                table: "TelemetrySessions",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "TrackLengthM",
                table: "TelemetrySessions",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TrackProfileId",
                table: "TelemetrySessions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "AverageSpeedKmh",
                table: "TelemetryLaps",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "BrakingPct",
                table: "TelemetryLaps",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "CoastingPct",
                table: "TelemetryLaps",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "FullThrottlePct",
                table: "TelemetryLaps",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GearShifts",
                table: "TelemetryLaps",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Kind",
                table: "TelemetryLaps",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<float>(
                name: "LapDistanceM",
                table: "TelemetryLaps",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LapStartedAt",
                table: "TelemetryLaps",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "MinSpeedKmh",
                table: "TelemetryLaps",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "PeakGLat",
                table: "TelemetryLaps",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "PeakGLong",
                table: "TelemetryLaps",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProcessingError",
                table: "TelemetryLaps",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProcessingStatus",
                table: "TelemetryLaps",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ProcessorVersion",
                table: "TelemetryLaps",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LapCorners",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TelemetryLapId = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    TrackProfileId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProfileVersion = table.Column<int>(type: "integer", nullable: true),
                    CornerIndex = table.Column<short>(type: "smallint", nullable: false),
                    RefCornerIndex = table.Column<short>(type: "smallint", nullable: true),
                    Direction = table.Column<short>(type: "smallint", nullable: false),
                    IsKink = table.Column<bool>(type: "boolean", nullable: false),
                    Source = table.Column<int>(type: "integer", nullable: false),
                    EntryM = table.Column<float>(type: "real", nullable: false),
                    ApexM = table.Column<float>(type: "real", nullable: false),
                    ExitM = table.Column<float>(type: "real", nullable: false),
                    BrakingPointM = table.Column<float>(type: "real", nullable: true),
                    BrakeReleaseM = table.Column<float>(type: "real", nullable: true),
                    ThrottleOnM = table.Column<float>(type: "real", nullable: true),
                    FullThrottleM = table.Column<float>(type: "real", nullable: true),
                    EntrySpeedKmh = table.Column<float>(type: "real", nullable: false),
                    MinSpeedKmh = table.Column<float>(type: "real", nullable: false),
                    ExitSpeedKmh = table.Column<float>(type: "real", nullable: false),
                    PeakBrake = table.Column<float>(type: "real", nullable: false),
                    PeakGLat = table.Column<float>(type: "real", nullable: false),
                    GearAtApex = table.Column<short>(type: "smallint", nullable: false),
                    MinGear = table.Column<short>(type: "smallint", nullable: false),
                    TimeInCornerMs = table.Column<int>(type: "integer", nullable: false),
                    BrakeToThrottleMs = table.Column<int>(type: "integer", nullable: true),
                    TrailBrakeM = table.Column<float>(type: "real", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LapCorners", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LapCorners_TelemetryLaps_TelemetryLapId",
                        column: x => x.TelemetryLapId,
                        principalTable: "TelemetryLaps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LapTelemetries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TelemetryLapId = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    StepM = table.Column<float>(type: "real", nullable: false),
                    SampleCount = table.Column<int>(type: "integer", nullable: false),
                    Codec = table.Column<short>(type: "smallint", nullable: false),
                    DistanceSource = table.Column<int>(type: "integer", nullable: false),
                    ChannelIndex = table.Column<string>(type: "jsonb", nullable: false),
                    Data = table.Column<byte[]>(type: "bytea", nullable: false),
                    UncompressedBytes = table.Column<int>(type: "integer", nullable: false),
                    ProcessorVersion = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LapTelemetries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LapTelemetries_TelemetryLaps_TelemetryLapId",
                        column: x => x.TelemetryLapId,
                        principalTable: "TelemetryLaps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrackProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Source = table.Column<int>(type: "integer", nullable: false),
                    TrackId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LengthM = table.Column<float>(type: "real", nullable: false),
                    SectorCount = table.Column<short>(type: "smallint", nullable: false),
                    SectorBoundariesM = table.Column<float[]>(type: "real[]", nullable: false),
                    ReferenceCorners = table.Column<string>(type: "jsonb", nullable: false),
                    CornerSamples = table.Column<string>(type: "jsonb", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    LapSampleCount = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    DetectorOverrides = table.Column<string>(type: "jsonb", nullable: true),
                    Centerline = table.Column<byte[]>(type: "bytea", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackProfiles", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TelemetrySessions_TrackProfileId",
                table: "TelemetrySessions",
                column: "TrackProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_TelemetrySessions_UserId_TrackProfileId_StartedAt",
                table: "TelemetrySessions",
                columns: new[] { "UserId", "TrackProfileId", "StartedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TelemetryLaps_SessionId_IsValid_LapTimeMs",
                table: "TelemetryLaps",
                columns: new[] { "SessionId", "IsValid", "LapTimeMs" });

            migrationBuilder.CreateIndex(
                name: "IX_LapCorners_TelemetryLapId_CornerIndex",
                table: "LapCorners",
                columns: new[] { "TelemetryLapId", "CornerIndex" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LapCorners_TrackProfileId_RefCornerIndex",
                table: "LapCorners",
                columns: new[] { "TrackProfileId", "RefCornerIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_LapTelemetries_SessionId",
                table: "LapTelemetries",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_LapTelemetries_TelemetryLapId",
                table: "LapTelemetries",
                column: "TelemetryLapId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrackProfiles_Source_TrackId",
                table: "TrackProfiles",
                columns: new[] { "Source", "TrackId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TelemetrySessions_TrackProfiles_TrackProfileId",
                table: "TelemetrySessions",
                column: "TrackProfileId",
                principalTable: "TrackProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // Legacy sessions (protocol v1) never carried a sim-native track id. ACC's id is the
            // lower-case track name, so derive it here so old sessions can join a TrackProfile and
            // show up in the "my laps on this track" picker once they are reprocessed.
            migrationBuilder.Sql(@"
                UPDATE ""TelemetrySessions""
                SET ""TrackId"" = lower(regexp_replace(trim(""Track""), '\s+', '_', 'g'))
                WHERE ""TrackId"" IS NULL AND ""Track"" <> '';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TelemetrySessions_TrackProfiles_TrackProfileId",
                table: "TelemetrySessions");

            migrationBuilder.DropTable(
                name: "LapCorners");

            migrationBuilder.DropTable(
                name: "LapTelemetries");

            migrationBuilder.DropTable(
                name: "TrackProfiles");

            migrationBuilder.DropIndex(
                name: "IX_TelemetrySessions_TrackProfileId",
                table: "TelemetrySessions");

            migrationBuilder.DropIndex(
                name: "IX_TelemetrySessions_UserId_TrackProfileId_StartedAt",
                table: "TelemetrySessions");

            migrationBuilder.DropIndex(
                name: "IX_TelemetryLaps_SessionId_IsValid_LapTimeMs",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "CarId",
                table: "TelemetrySessions");

            migrationBuilder.DropColumn(
                name: "SchemaVersion",
                table: "TelemetrySessions");

            migrationBuilder.DropColumn(
                name: "SectorCount",
                table: "TelemetrySessions");

            migrationBuilder.DropColumn(
                name: "SessionKind",
                table: "TelemetrySessions");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "TelemetrySessions");

            migrationBuilder.DropColumn(
                name: "TickRateHz",
                table: "TelemetrySessions");

            migrationBuilder.DropColumn(
                name: "TrackId",
                table: "TelemetrySessions");

            migrationBuilder.DropColumn(
                name: "TrackLengthM",
                table: "TelemetrySessions");

            migrationBuilder.DropColumn(
                name: "TrackProfileId",
                table: "TelemetrySessions");

            migrationBuilder.DropColumn(
                name: "AverageSpeedKmh",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "BrakingPct",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "CoastingPct",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "FullThrottlePct",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "GearShifts",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "LapDistanceM",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "LapStartedAt",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "MinSpeedKmh",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "PeakGLat",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "PeakGLong",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "ProcessingError",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "ProcessingStatus",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "ProcessorVersion",
                table: "TelemetryLaps");
        }
    }
}
