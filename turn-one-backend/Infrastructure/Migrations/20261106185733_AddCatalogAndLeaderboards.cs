using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogAndLeaderboards : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LeaderboardVisibility",
                table: "SimUsers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "CarClasses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CarClasses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LapValidations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LapId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Source = table.Column<int>(type: "integer", nullable: false),
                    TrackLayoutId = table.Column<Guid>(type: "uuid", nullable: true),
                    CarId = table.Column<Guid>(type: "uuid", nullable: true),
                    CarClassId = table.Column<Guid>(type: "uuid", nullable: true),
                    ConditionKey = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    LapTimeMs = table.Column<int>(type: "integer", nullable: true),
                    RecordedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Eligible = table.Column<bool>(type: "boolean", nullable: false),
                    Reasons = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    ValidatorVersion = table.Column<int>(type: "integer", nullable: false),
                    CheckedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LapValidations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LapValidations_TelemetryLaps_LapId",
                        column: x => x.LapId,
                        principalTable: "TelemetryLaps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrackLayouts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Country = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    LengthM = table.Column<float>(type: "real", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackLayouts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Cars",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CarClassId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cars", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cars_CarClasses_CarClassId",
                        column: x => x.CarClassId,
                        principalTable: "CarClasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TrackAliases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Source = table.Column<int>(type: "integer", nullable: false),
                    SimTrackId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    TrackLayoutId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackAliases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrackAliases_TrackLayouts_TrackLayoutId",
                        column: x => x.TrackLayoutId,
                        principalTable: "TrackLayouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CarAliases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Source = table.Column<int>(type: "integer", nullable: false),
                    SimCarId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CarId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CarAliases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CarAliases_Cars_CarId",
                        column: x => x.CarId,
                        principalTable: "Cars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CarAliases_CarId",
                table: "CarAliases",
                column: "CarId");

            migrationBuilder.CreateIndex(
                name: "IX_CarAliases_Source_SimCarId",
                table: "CarAliases",
                columns: new[] { "Source", "SimCarId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CarClasses_Slug",
                table: "CarClasses",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cars_CarClassId",
                table: "Cars",
                column: "CarClassId");

            migrationBuilder.CreateIndex(
                name: "IX_Cars_Slug",
                table: "Cars",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LapValidations_LapId",
                table: "LapValidations",
                column: "LapId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LapValidations_Source_TrackLayoutId_CarClassId_Eligible_Lap~",
                table: "LapValidations",
                columns: new[] { "Source", "TrackLayoutId", "CarClassId", "Eligible", "LapTimeMs" });

            migrationBuilder.CreateIndex(
                name: "IX_LapValidations_Source_TrackLayoutId_CarId_Eligible_LapTimeMs",
                table: "LapValidations",
                columns: new[] { "Source", "TrackLayoutId", "CarId", "Eligible", "LapTimeMs" });

            migrationBuilder.CreateIndex(
                name: "IX_LapValidations_UserId",
                table: "LapValidations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TrackAliases_Source_SimTrackId",
                table: "TrackAliases",
                columns: new[] { "Source", "SimTrackId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrackAliases_TrackLayoutId",
                table: "TrackAliases",
                column: "TrackLayoutId");

            migrationBuilder.CreateIndex(
                name: "IX_TrackLayouts_Slug",
                table: "TrackLayouts",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CarAliases");

            migrationBuilder.DropTable(
                name: "LapValidations");

            migrationBuilder.DropTable(
                name: "TrackAliases");

            migrationBuilder.DropTable(
                name: "Cars");

            migrationBuilder.DropTable(
                name: "TrackLayouts");

            migrationBuilder.DropTable(
                name: "CarClasses");

            migrationBuilder.DropColumn(
                name: "LeaderboardVisibility",
                table: "SimUsers");
        }
    }
}
