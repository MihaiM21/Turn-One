using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAnonymousGenerationAndFunnelAnalytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnonGenerationQuotas");

            migrationBuilder.DropTable(
                name: "FunnelEvents");

            migrationBuilder.DropTable(
                name: "RaceWeekends");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnonGenerationQuotas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AnonId = table.Column<string>(type: "text", nullable: false),
                    Count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Day = table.Column<DateOnly>(type: "date", nullable: false),
                    IpHash = table.Column<string>(type: "text", nullable: false),
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
                    AnonId = table.Column<string>(type: "text", nullable: true),
                    Campaign = table.Column<string>(type: "text", nullable: true),
                    IsRaceWeekend = table.Column<bool>(type: "boolean", nullable: false),
                    Medium = table.Column<string>(type: "text", nullable: true),
                    Name = table.Column<string>(type: "character varying(48)", maxLength: 48, nullable: false),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Path = table.Column<string>(type: "text", nullable: true),
                    PlotSlug = table.Column<string>(type: "text", nullable: true),
                    ReferrerHost = table.Column<string>(type: "text", nullable: true),
                    Source = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true)
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
                    EndUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EventSlug = table.Column<string>(type: "text", nullable: false),
                    StartUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Year = table.Column<int>(type: "integer", nullable: false)
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
        }
    }
}
