using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExportPresets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExportPresets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    SessionType = table.Column<int>(type: "integer", nullable: false),
                    ChartKeys = table.Column<string>(type: "text", nullable: false),
                    OutputSizes = table.Column<string>(type: "text", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExportPresets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExportPresets_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExportPresets_CreatedByUserId",
                table: "ExportPresets",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ExportPresets_SessionType",
                table: "ExportPresets",
                column: "SessionType");

            migrationBuilder.CreateIndex(
                name: "IX_ExportPresets_UpdatedAt",
                table: "ExportPresets",
                column: "UpdatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExportPresets");
        }
    }
}
