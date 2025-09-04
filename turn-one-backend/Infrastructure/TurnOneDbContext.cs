using Domain.Entities;
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
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.PasswordSalt).IsRequired();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Username).IsUnique();
        });
    }
}