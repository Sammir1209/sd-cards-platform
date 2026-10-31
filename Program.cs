using Microsoft.EntityFrameworkCore;
using NfcMenuSaas.Data;

var builder = WebApplication.CreateBuilder(args);

// Soporte Híbrido: Si se define SupabaseConnection válida se conecta a Supabase (PostgreSQL), si no usa SQLite local
string? supabaseConn = builder.Configuration.GetConnectionString("SupabaseConnection");
bool useSupabase = !string.IsNullOrWhiteSpace(supabaseConn) && !supabaseConn.Contains("YOUR_PROJECT_REF");

if (useSupabase)
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(supabaseConn));
}
else
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=nfcmenu.db"));
}

builder.Services.AddControllersWithViews();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

// Inicialización de esquema y datos automáticos
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbInitializer.SeedAsync(context);
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
