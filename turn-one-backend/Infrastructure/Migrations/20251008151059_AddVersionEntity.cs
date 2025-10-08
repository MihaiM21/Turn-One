using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVersionEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Versions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Major = table.Column<int>(type: "INTEGER", nullable: false),
                    Minor = table.Column<int>(type: "INTEGER", nullable: false),
                    Patch = table.Column<int>(type: "INTEGER", nullable: false),
                    PreRelease = table.Column<string>(type: "TEXT", nullable: true),
                    BuildMetadata = table.Column<string>(type: "TEXT", nullable: true),
                    ReleasedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ReleaseNotes = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Versions", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Versions");
        }
    }
}
