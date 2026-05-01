using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixPageStatusColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The table was previously created with snake_case column names.
            // Drop and recreate with the PascalCase names EF Core expects.
            migrationBuilder.Sql(@"
                DROP TABLE IF EXISTS ""PageStatuses"" CASCADE;

                CREATE TABLE ""PageStatuses"" (
                    ""Id""                  serial PRIMARY KEY,
                    ""PageSlug""            text NOT NULL,
                    ""IsDisabled""          boolean NOT NULL DEFAULT false,
                    ""MaintenanceMessage""  text,
                    ""UpdatedAt""           timestamp with time zone NOT NULL DEFAULT now(),
                    ""UpdatedByUsername""   text
                );

                CREATE UNIQUE INDEX ""IX_PageStatuses_PageSlug""
                    ON ""PageStatuses"" (""PageSlug"");
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""PageStatuses"" CASCADE;");
        }
    }
}
