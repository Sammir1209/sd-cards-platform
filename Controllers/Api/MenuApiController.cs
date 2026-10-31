using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NfcMenuSaas.Data;
using NfcMenuSaas.Models;

namespace NfcMenuSaas.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class MenuApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public MenuApiController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Obtiene las categorías y platos de un negocio para la App Móvil
    /// </summary>
    [HttpGet("business/{businessId:int}")]
    public async Task<IActionResult> GetMenu(int businessId)
    {
        var business = await _context.Businesses
            .Include(b => b.Categories.OrderBy(c => c.DisplayOrder))
                .ThenInclude(c => c.Dishes)
            .FirstOrDefaultAsync(b => b.Id == businessId);

        if (business == null) return NotFound(new { error = "Negocio no encontrado." });

        var categories = business.Categories.Select(c => new
        {
            c.Id,
            c.Name,
            c.DisplayOrder,
            Dishes = c.Dishes.Select(d => new
            {
                d.Id,
                d.Name,
                d.Description,
                d.Price,
                d.ImageUrl,
                d.IsAvailable
            })
        });

        return Ok(new
        {
            businessId = business.Id,
            businessName = business.Name,
            sector = business.Sector.ToString(),
            categories
        });
    }

    /// <summary>
    /// Alterna la disponibilidad de un plato con 1 toque en la App Móvil
    /// </summary>
    [HttpPut("dish/{dishId:int}/toggle")]
    public async Task<IActionResult> ToggleAvailability(int dishId)
    {
        var dish = await _context.Dishes.FindAsync(dishId);
        if (dish == null) return NotFound(new { error = "Plato no encontrado." });

        dish.IsAvailable = !dish.IsAvailable;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, dish.Id, dish.IsAvailable });
    }

    /// <summary>
    /// Crea un nuevo plato desde la App Móvil
    /// </summary>
    [HttpPost("dish")]
    public async Task<IActionResult> CreateDish([FromBody] CreateDishRequest request)
    {
        var category = await _context.Categories.FindAsync(request.CategoryId);
        if (category == null) return NotFound(new { error = "Categoría no encontrada." });

        var dish = new Dish
        {
            CategoryId = request.CategoryId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Price = request.Price,
            ImageUrl = request.ImageUrl?.Trim(),
            IsAvailable = true
        };

        _context.Dishes.Add(dish);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, dish.Id, dish.Name, dish.Price });
    }

    /// <summary>
    /// Elimina un plato desde la App Móvil
    /// </summary>
    [HttpDelete("dish/{dishId:int}")]
    public async Task<IActionResult> DeleteDish(int dishId)
    {
        var dish = await _context.Dishes.FindAsync(dishId);
        if (dish == null) return NotFound(new { error = "Plato no encontrado." });

        _context.Dishes.Remove(dish);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Plato eliminado correctamente." });
    }
}

public record CreateDishRequest(int CategoryId, string Name, string? Description, decimal Price, string? ImageUrl);

