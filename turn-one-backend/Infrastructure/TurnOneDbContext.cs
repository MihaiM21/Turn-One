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
    }
}