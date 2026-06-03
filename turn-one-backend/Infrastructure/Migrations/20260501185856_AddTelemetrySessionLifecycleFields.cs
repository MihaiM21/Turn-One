using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTelemetrySessionLifecycleFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Clear existing rows — IDs were server-generated and are unknown to the client
            migrationBuilder.Sql("DELETE FROM \"TelemetryLaps\";");
            migrationBuilder.Sql("DELETE FROM \"TelemetrySessions\";");

            migrationBuilder.AddColumn<int>(
                name: "BestLapMs",
                table: "TelemetrySessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ClientVersion",
                table: "TelemetrySessions",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSeenAt",
                table: "TelemetrySessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "TelemetrySessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_TelemetrySessions_LastSeenAt",
                table: "TelemetrySessions",
                column: "LastSeenAt",
                filter: "\"Status\" <> 2");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BestLapMs",
                table: "TelemetrySessions");

            migrationBuilder.DropColumn(
                name: "ClientVersion",
                table: "TelemetrySessions");

            migrationBuilder.DropColumn(
                name: "LastSeenAt",
                table: "TelemetrySessions");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "TelemetrySessions");

            migrationBuilder.DropIndex(
                name: "IX_TelemetrySessions_LastSeenAt",
                table: "TelemetrySessions");
        }
    }
}
