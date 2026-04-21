using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSimracingEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SimUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TotalSessions = table.Column<int>(type: "integer", nullable: false),
                    TotalLaps = table.Column<int>(type: "integer", nullable: false),
                    TotalDistanceKm = table.Column<double>(type: "double precision", nullable: false),
                    TotalPlayTimeSeconds = table.Column<int>(type: "integer", nullable: false),
                    HighestSpeedKmh = table.Column<float>(type: "real", nullable: false),
                    LastSessionAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SimUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SimUsers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TelemetrySessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CarModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Track = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DriverName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SessionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Mode = table.Column<int>(type: "integer", nullable: false),
                    Visibility = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    LapCount = table.Column<int>(type: "integer", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TelemetrySessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TelemetrySessions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TelemetryLaps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    LapNumber = table.Column<int>(type: "integer", nullable: false),
                    LapTimeMs = table.Column<int>(type: "integer", nullable: true),
                    Sector1Ms = table.Column<int>(type: "integer", nullable: true),
                    Sector2Ms = table.Column<int>(type: "integer", nullable: true),
                    Sector3Ms = table.Column<int>(type: "integer", nullable: true),
                    IsValid = table.Column<bool>(type: "boolean", nullable: false),
                    MaxSpeedKmh = table.Column<float>(type: "real", nullable: false),
                    MaxRpm = table.Column<int>(type: "integer", nullable: false),
                    AverageThrottle = table.Column<float>(type: "real", nullable: false),
                    AverageBrake = table.Column<float>(type: "real", nullable: false),
                    FuelUsed = table.Column<float>(type: "real", nullable: false),
                    RecordedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TelemetryLaps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TelemetryLaps_TelemetrySessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "TelemetrySessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SimUsers_UserId",
                table: "SimUsers",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TelemetryLaps_SessionId_LapNumber",
                table: "TelemetryLaps",
                columns: new[] { "SessionId", "LapNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TelemetrySessions_StartedAt",
                table: "TelemetrySessions",
                column: "StartedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TelemetrySessions_UserId",
                table: "TelemetrySessions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SimUsers");

            migrationBuilder.DropTable(
                name: "TelemetryLaps");

            migrationBuilder.DropTable(
                name: "TelemetrySessions");
        }
    }
}
