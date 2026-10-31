using Microsoft.EntityFrameworkCore;
using NfcMenuSaas.Models;

namespace NfcMenuSaas.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<NfcCard> NfcCards => Set<NfcCard>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Dish> Dishes => Set<Dish>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Business>(entity =>
        {
            entity.HasIndex(b => b.Slug).IsUnique();

            // Índice único filtrado: SOLO aplica cuando CustomDomain NO sea nulo ni vacío
            // Esto corrige definitivamente el error de SQLite UNIQUE constraint cuando varios negocios no tienen dominio
            entity.HasIndex(b => b.CustomDomain)
                  .IsUnique()
                  .HasFilter("\"CustomDomain\" IS NOT NULL AND \"CustomDomain\" != ''");

            entity.Property(b => b.PrimaryColor).HasMaxLength(7).HasDefaultValue("#2563EB");
            entity.Property(b => b.IsActive).HasDefaultValue(true);

            entity.HasMany(b => b.Categories)
                  .WithOne(c => c.Business)
                  .HasForeignKey(c => c.BusinessId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(b => b.Cards)
                  .WithOne(card => card.Business)
                  .HasForeignKey(card => card.BusinessId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NfcCard>(entity =>
        {
            entity.HasIndex(c => c.CardCode).IsUnique();
            entity.Property(c => c.CardCode).HasMaxLength(50).IsRequired();
            entity.Property(c => c.ActivationPin).HasMaxLength(10).HasDefaultValue("1234");
            entity.Property(c => c.IsConfigured).HasDefaultValue(false);
            entity.Property(c => c.TapCount).HasDefaultValue(0);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasMany(c => c.Dishes)
                  .WithOne(d => d.Category)
                  .HasForeignKey(d => d.CategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Dish>(entity =>
        {
            entity.Property(d => d.Price).HasPrecision(10, 2);
            entity.Property(d => d.IsAvailable).HasDefaultValue(true);
        });
    }
}
