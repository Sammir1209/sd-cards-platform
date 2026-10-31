using Microsoft.EntityFrameworkCore;
using NfcMenuSaas.Models;

namespace NfcMenuSaas.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();
        // Base de datos limpia para produccion. No se insertan datos mockup/demo.
    }
}
