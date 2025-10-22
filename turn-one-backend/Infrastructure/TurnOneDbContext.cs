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
        });

    }
}