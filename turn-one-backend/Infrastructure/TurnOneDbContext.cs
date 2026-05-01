using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure;

public class TurnOneDbContext : DbContext
{
    public TurnOneDbContext(DbContextOptions<TurnOneDbContext> options) : base(options)
    {
    }
    
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Prediction> Predictions { get; set; } = null!;
    public DbSet<Trivia> Trivias { get; set; } = null!;
    public DbSet<TriviaAttempt> TriviaAttempts { get; set; } = null!;
    public DbSet<Leaderboard> Leaderboards { get; set; } = null!;
    public DbSet<CoinTransaction> CoinTransactions { get; set; } = null!;
    public DbSet<ApiWishlist> ApiWishlists { get; set; } = null!;

    public DbSet<Media> Media { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<UserNotification> UserNotifications { get; set; } = null!;
    public DbSet<PageStatus> PageStatuses { get; set; } = null!;
    
    // Simracing telemetry entities
    public DbSet<SimUser> SimUsers { get; set; } = null!;
    public DbSet<TelemetrySession> TelemetrySessions { get; set; } = null!;
    public DbSet<TelemetryLap> TelemetryLaps { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired();
            entity.Property(e => e.Username).IsRequired();
            entity.Property(e => e.Password).IsRequired();
            entity.Property(e => e.AvatarUrl).IsRequired(false);

            entity.Property(e => e.Plan).IsRequired().HasDefaultValue(PlanType.BASIC);
            entity.Property(e => e.Role).IsRequired().HasDefaultValue(Role.USER);
            entity.Property(e => e.PlanStartDate).IsRequired();
            entity.Property(e => e.PlanEndDate).IsRequired(false);
            entity.Property(e => e.AutoRenew).IsRequired().HasDefaultValue(false);

            entity.Property(e => e.Tokens).IsRequired().HasDefaultValue(30);
            entity.Property(e => e.LastTokenRefillDate).IsRequired();

            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.LastLogin).IsRequired(false);

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Username).IsUnique();
            
            // Email confirmation
            entity.Property(e => e.IsEmailConfirmed).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.EmailConfirmationToken).IsRequired(false);
            entity.Property(e => e.EmailConfirmationTokenExpires).IsRequired(false);
            
            // Password reset
            entity.Property(e => e.PasswordResetToken).IsRequired(false);
            entity.Property(e => e.PasswordResetTokenExpires).IsRequired(false);
        });

        modelBuilder.Entity<Prediction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            entity.Property(e => e.Status).IsRequired();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<Trivia>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Question).IsRequired();
            entity.Property(e => e.CorrectAnswer).IsRequired();
        });

        modelBuilder.Entity<TriviaAttempt>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Trivia).WithMany(t => t.Attempts).HasForeignKey(e => e.TriviaId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.TriviaId);
        });

        modelBuilder.Entity<Leaderboard>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Season);
            entity.HasIndex(e => e.GlobalRank);
        });

        modelBuilder.Entity<CoinTransaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            entity.Property(e => e.Type).IsRequired();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<ApiWishlist>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired();
            entity.Property(e => e.SubscribedAt).IsRequired();
            entity.Property(e => e.IsNotified).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.IpAddress).IsRequired(false);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.SubscribedAt);
        });

        modelBuilder.Entity<Media>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).IsRequired();
            entity.Property(e => e.OriginalFileName).IsRequired();
            entity.Property(e => e.AltText).IsRequired().HasDefaultValue("");
            entity.Property(e => e.FilePath).IsRequired();
            entity.Property(e => e.FileType).IsRequired();
            entity.Property(e => e.FileSize).IsRequired();
            entity.Property(e => e.UploadedAt).IsRequired();
            entity.HasIndex(e => e.FileName);
            entity.HasIndex(e => e.UploadedAt);
        });

        modelBuilder.Entity<PageStatus>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PageName).IsRequired();
            entity.HasIndex(e => e.PageName).IsUnique();
        });

        modelBuilder.Entity<SimUser>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithOne().HasForeignKey<SimUser>(e => e.UserId);
            entity.HasIndex(e => e.UserId).IsUnique();
        });

        modelBuilder.Entity<TelemetrySession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            entity.HasMany(e => e.Laps).WithOne(l => l.Session).HasForeignKey(l => l.SessionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.StartedAt);
        });

        modelBuilder.Entity<TelemetryLap>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SessionId, e.LapNumber }).IsUnique();
        });
    }
}