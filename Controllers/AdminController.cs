using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NfcMenuSaas.Data;
using NfcMenuSaas.Models;
using NfcMenuSaas.Services;

namespace NfcMenuSaas.Controllers;

[Route("admin")]
public class AdminController : Controller
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Panel principal mobile-first para el dueño del negocio: /admin/{businessId}
    /// </summary>
    [HttpGet("{businessId:int}")]
    public async Task<IActionResult> Index(int businessId)
    {
        var business = await _context.Businesses
            .Include(b => b.Categories.OrderBy(c => c.DisplayOrder))
                .ThenInclude(c => c.Dishes)
            .FirstOrDefaultAsync(b => b.Id == businessId);

        if (business == null)
        {
            return NotFound("Negocio no encontrado.");
        }

        ViewBag.SectorPresets = SectorPresets.GetCategoriesForSector(business.Sector.ToString());
        return View(business);
    }

    /// <summary>
    /// Guarda ajustes básicos de la tarjeta o negocio (Google Maps URL, Redirección, Color, Logo)
    /// </summary>
    [HttpPost("update-settings")]
    public async Task<IActionResult> UpdateSettings(int id, string name, string? googleMapsUrl, bool autoRedirectReviews, string primaryColor, string? logoUrl, BusinessSector sector)
    {
        var business = await _context.Businesses.FindAsync(id);
        if (business == null) return NotFound();

        business.Name = name;
        business.GoogleMapsUrl = googleMapsUrl;
        business.AutoRedirectReviews = autoRedirectReviews;
        business.PrimaryColor = string.IsNullOrEmpty(primaryColor) ? "#2563EB" : primaryColor;
        business.LogoUrl = logoUrl;
        business.Sector = sector;

        await _context.SaveChangesAsync();
        TempData["Message"] = "Ajustes actualizados correctamente";
        return RedirectToAction(nameof(Index), new { businessId = id });
    }

    /// <summary>
    /// Agrega una categoría sugerida del rubro con 1-click
    /// </summary>
    [HttpPost("add-category")]
    public async Task<IActionResult> AddCategory(int businessId, string categoryName)
    {
        if (string.IsNullOrWhiteSpace(categoryName))
        {
            return RedirectToAction(nameof(Index), new { businessId });
        }

        var business = await _context.Businesses
            .Include(b => b.Categories)
            .FirstOrDefaultAsync(b => b.Id == businessId);

        if (business != null)
        {
            var nextOrder = (business.Categories.Any() ? business.Categories.Max(c => c.DisplayOrder) : 0) + 1;
            business.Categories.Add(new Category
            {
                Name = categoryName.Trim(),
                DisplayOrder = nextOrder
            });
            await _context.SaveChangesAsync();
        }

        return RedirectToAction(nameof(Index), new { businessId });
    }

    /// <summary>
    /// Agrega un plato rápidamente
    /// </summary>
    [HttpPost("add-dish")]
    public async Task<IActionResult> AddDish(int businessId, int categoryId, string name, string? description, decimal price, string? imageUrl)
    {
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == categoryId && c.BusinessId == businessId);
        if (category != null)
        {
            category.Dishes.Add(new Dish
            {
                Name = name,
                Description = description,
                Price = price,
                ImageUrl = imageUrl,
                IsAvailable = true
            });
            await _context.SaveChangesAsync();
        }

        return RedirectToAction(nameof(Index), new { businessId });
    }

    /// <summary>
    /// Alterna disponibilidad del plato con 1 toque
    /// </summary>
    [HttpPost("toggle-dish")]
    public async Task<IActionResult> ToggleDish(int businessId, int dishId)
    {
        var dish = await _context.Dishes
            .Include(d => d.Category)
            .FirstOrDefaultAsync(d => d.Id == dishId && d.Category.BusinessId == businessId);

        if (dish != null)
        {
            dish.IsAvailable = !dish.IsAvailable;
            await _context.SaveChangesAsync();
        }

        return RedirectToAction(nameof(Index), new { businessId });
    }

    /// <summary>
    /// Elimina un plato
    /// </summary>
    [HttpPost("delete-dish")]
    public async Task<IActionResult> DeleteDish(int businessId, int dishId)
    {
        var dish = await _context.Dishes
            .Include(d => d.Category)
            .FirstOrDefaultAsync(d => d.Id == dishId && d.Category.BusinessId == businessId);

        if (dish != null)
        {
            _context.Dishes.Remove(dish);
            await _context.SaveChangesAsync();
        }

        return RedirectToAction(nameof(Index), new { businessId });
    }
}

