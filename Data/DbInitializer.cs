using Microsoft.EntityFrameworkCore;
using NfcMenuSaas.Models;

namespace NfcMenuSaas.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // Verificación y migración segura de columnas en SQLite
        try
        {
            var conn = context.Database.GetDbConnection();
            if (conn.State != System.Data.ConnectionState.Open)
            {
                await conn.OpenAsync();
            }

            using var cmd = conn.CreateCommand();
            cmd.CommandText = "PRAGMA table_info(Businesses);";
            var existingCols = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    existingCols.Add(reader.GetString(1));
                }
            }

            if (!existingCols.Contains("Ruc"))
            {
                using var alter = conn.CreateCommand();
                alter.CommandText = "ALTER TABLE Businesses ADD COLUMN Ruc TEXT;";
                await alter.ExecuteNonQueryAsync();
            }

            if (!existingCols.Contains("Department"))
            {
                using var alter = conn.CreateCommand();
                alter.CommandText = "ALTER TABLE Businesses ADD COLUMN Department TEXT;";
                await alter.ExecuteNonQueryAsync();
            }

            if (!existingCols.Contains("Province"))
            {
                using var alter = conn.CreateCommand();
                alter.CommandText = "ALTER TABLE Businesses ADD COLUMN Province TEXT;";
                await alter.ExecuteNonQueryAsync();
            }

            if (!existingCols.Contains("District"))
            {
                using var alter = conn.CreateCommand();
                alter.CommandText = "ALTER TABLE Businesses ADD COLUMN District TEXT;";
                await alter.ExecuteNonQueryAsync();
            }

            if (!existingCols.Contains("PlanMonths"))
            {
                using var alter = conn.CreateCommand();
                alter.CommandText = "ALTER TABLE Businesses ADD COLUMN PlanMonths INTEGER NOT NULL DEFAULT 12;";
                await alter.ExecuteNonQueryAsync();
            }

            if (!existingCols.Contains("PlanExpiryDate"))
            {
                using var alter = conn.CreateCommand();
                alter.CommandText = "ALTER TABLE Businesses ADD COLUMN PlanExpiryDate TEXT;";
                await alter.ExecuteNonQueryAsync();
            }
        }
        catch
        {
            // Ignorar excepciones de migración si el motor no es SQLite o las columnas ya existen
        }
    }
}
