using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NfcMenuSaas.Data;
using NfcMenuSaas.Models;

namespace NfcMenuSaas.Controllers;

[Route("site")]
public class SiteController : Controller
{
    private readonly AppDbContext _context;

    public SiteController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Portada / Landing Page de Bienvenida del Restaurante (ej. ben10.com.pe o /site/{slug})
    /// </summary>
    [HttpGet("{slug}")]
    public async Task<IActionResult> Index(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug)) return NotFound();

        var business = await _context.Businesses
            .AsNoTracking()
            .Include(b => b.Categories)
                .ThenInclude(c => c.Dishes)
            .FirstOrDefaultAsync(b => b.Slug.ToLower() == slug.ToLower() || b.CustomDomain == slug);

        if (business == null)
        {
            return NotFound("Restaurante o dominio no encontrado.");
        }

        return View("Landing", business);
    }

    /// <summary>
    /// Carta Digital Interactiva del Restaurante en Tiempo Real (ej. ben10.com.pe/menu o /site/{slug}/menu)
    /// </summary>
    [HttpGet("{slug}/menu")]
    public async Task<IActionResult> Menu(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug)) return NotFound();

        // Consulta en tiempo real sin caché para reflejar los cambios instantáneos de la app móvil
        var business = await _context.Businesses
            .AsNoTracking()
            .Include(b => b.Categories.OrderBy(c => c.DisplayOrder))
                .ThenInclude(c => c.Dishes.Where(d => d.IsAvailable))
            .FirstOrDefaultAsync(b => b.Slug.ToLower() == slug.ToLower() || b.CustomDomain == slug);

        if (business == null)
        {
            return NotFound("Menú no encontrado.");
        }

        return View("~/Views/Menu/MenuDigital.cshtml", business);
    }
}

