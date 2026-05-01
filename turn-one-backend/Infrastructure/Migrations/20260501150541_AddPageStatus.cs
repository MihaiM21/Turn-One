using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPageStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Guard: the table may already exist if it was created in a prior
            // deployment before this migration was tracked.
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_schema = 'public'
                        AND table_name = 'PageStatuses'
                    ) THEN
                        CREATE TABLE ""PageStatuses"" (
                            ""Id"" serial PRIMARY KEY,
                            ""PageSlug"" text NOT NULL,
                            ""IsDisabled"" boolean NOT NULL DEFAULT false,
                            ""MaintenanceMessage"" text,
                            ""UpdatedAt"" timestamp with time zone NOT NULL,
                            ""UpdatedByUsername"" text
                        );
                        CREATE UNIQUE INDEX ""IX_PageStatuses_PageSlug"" ON ""PageStatuses"" (""PageSlug"");
                    END IF;
                END
                $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PageStatuses");
        }
    }
}
