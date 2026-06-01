using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLapAnalytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "BrakingScore",
                table: "TelemetryLaps",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "ThrottleScore",
                table: "TelemetryLaps",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "ConsistencyScore",
                table: "TelemetryLaps",
                type: "real",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BrakingScore",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "ThrottleScore",
                table: "TelemetryLaps");

            migrationBuilder.DropColumn(
                name: "ConsistencyScore",
                table: "TelemetryLaps");
        }
    }
}
