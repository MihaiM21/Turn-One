﻿using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationsSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create Notifications table if it doesn't exist
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Notifications') THEN
                        CREATE TABLE ""Notifications"" (
                            ""Id"" uuid NOT NULL,
                            ""Title"" text NOT NULL,
                            ""Message"" text NOT NULL,
                            ""Type"" text NOT NULL,
                            ""TargetAudience"" text NOT NULL,
                            ""TargetPlans"" text NULL,
                            ""TargetRoles"" text NULL,
                            ""CreatedAt"" timestamp with time zone NOT NULL,
                            ""CreatedById"" uuid NOT NULL,
                            ""IsActive"" boolean NOT NULL,
                            CONSTRAINT ""PK_Notifications"" PRIMARY KEY (""Id""),
                            CONSTRAINT ""FK_Notifications_Users_CreatedById"" FOREIGN KEY (""CreatedById"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                        );
                        
                        CREATE INDEX ""IX_Notifications_CreatedById"" ON ""Notifications"" (""CreatedById"");
                    END IF;
                END $$;
            ");

            // Create UserNotifications table if it doesn't exist
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'UserNotifications') THEN
                        CREATE TABLE ""UserNotifications"" (
                            ""Id"" uuid NOT NULL,
                            ""UserId"" uuid NOT NULL,
                            ""NotificationId"" uuid NOT NULL,
                            ""IsRead"" boolean NOT NULL,
                            ""ReadAt"" timestamp with time zone NULL,
                            ""ReceivedAt"" timestamp with time zone NOT NULL,
                            CONSTRAINT ""PK_UserNotifications"" PRIMARY KEY (""Id""),
                            CONSTRAINT ""FK_UserNotifications_Notifications_NotificationId"" FOREIGN KEY (""NotificationId"") REFERENCES ""Notifications"" (""Id"") ON DELETE CASCADE,
                            CONSTRAINT ""FK_UserNotifications_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                        );
                        
                        CREATE INDEX ""IX_UserNotifications_NotificationId"" ON ""UserNotifications"" (""NotificationId"");
                        CREATE INDEX ""IX_UserNotifications_UserId"" ON ""UserNotifications"" (""UserId"");
                    END IF;
                END $$;
            ");

            // If Notifications exists but has old CreatedByUserId column, drop it
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_schema = 'public' 
                        AND table_name = 'Notifications' 
                        AND column_name = 'CreatedByUserId'
                    ) THEN
                        ALTER TABLE ""Notifications"" DROP COLUMN ""CreatedByUserId"";
                    END IF;
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserNotifications");

            migrationBuilder.DropTable(
                name: "Notifications");
        }
    }
}