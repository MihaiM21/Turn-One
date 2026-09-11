using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAnonymousGenerationAndFunnelAnalytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TelemetryGenerationRequests_Users_UserId",
                table: "TelemetryGenerationRequests");

            migrationBuilder.AddColumn<int>(
                name: "CreatorTokenAllowance",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "TelemetryGenerationRequests",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.CreateTable(
                name: "AnonGenerationQuotas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AnonId = table.Column<string>(type: "text", nullable: false),
                    IpHash = table.Column<string>(type: "text", nullable: false),
                    Day = table.Column<DateOnly>(type: "date", nullable: false),
                    Count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnonGenerationQuotas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FunnelEvents",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(48)", maxLength: 48, nullable: false),
                    AnonId = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    PlotSlug = table.Column<string>(type: "text", nullable: true),
                    Source = table.Column<string>(type: "text", nullable: true),
                    Medium = table.Column<string>(type: "text", nullable: true),
                    Campaign = table.Column<string>(type: "text", nullable: true),
                    ReferrerHost = table.Column<string>(type: "text", nullable: true),
                    Path = table.Column<string>(type: "text", nullable: true),
                    IsRaceWeekend = table.Column<bool>(type: "boolean", nullable: false),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FunnelEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RaceWeekends",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    EventSlug = table.Column<string>(type: "text", nullable: false),
                    StartUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaceWeekends", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnonGenerationQuotas_AnonId",
                table: "AnonGenerationQuotas",
                column: "AnonId");

            migrationBuilder.CreateIndex(
                name: "IX_AnonGenerationQuotas_IpHash_Day",
                table: "AnonGenerationQuotas",
                columns: new[] { "IpHash", "Day" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FunnelEvents_AnonId",
                table: "FunnelEvents",
                column: "AnonId");

            migrationBuilder.CreateIndex(
                name: "IX_FunnelEvents_Name",
                table: "FunnelEvents",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_FunnelEvents_OccurredAt",
                table: "FunnelEvents",
                column: "OccurredAt");

            migrationBuilder.CreateIndex(
                name: "IX_RaceWeekends_StartUtc_EndUtc",
                table: "RaceWeekends",
                columns: new[] { "StartUtc", "EndUtc" });

            migrationBuilder.AddForeignKey(
                name: "FK_TelemetryGenerationRequests_Users_UserId",
                table: "TelemetryGenerationRequests",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TelemetryGenerationRequests_Users_UserId",
                table: "TelemetryGenerationRequests");

            migrationBuilder.DropTable(
                name: "AnonGenerationQuotas");

            migrationBuilder.DropTable(
                name: "FunnelEvents");

            migrationBuilder.DropTable(
                name: "RaceWeekends");

            migrationBuilder.DropColumn(
                name: "CreatorTokenAllowance",
                table: "Users");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "TelemetryGenerationRequests",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TelemetryGenerationRequests_Users_UserId",
                table: "TelemetryGenerationRequests",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
