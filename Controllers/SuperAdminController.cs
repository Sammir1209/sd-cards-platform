using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NfcMenuSaas.Data;
using NfcMenuSaas.Models;
using NfcMenuSaas.Services;

namespace NfcMenuSaas.Controllers;

[Route("superadmin")]
public class SuperAdminController : Controller
{
    private readonly AppDbContext _context;

    public SuperAdminController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var businesses = await _context.Businesses
            .Include(b => b.Cards)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        ViewBag.TotalCards = await _context.NfcCards.CountAsync();
        ViewBag.TotalTaps = await _context.NfcCards.SumAsync(c => c.TapCount);

        return View(businesses);
    }

    [HttpPost("create-client")]
    public async Task<IActionResult> CreateClient(
        string name, 
        string slug, 
        string? city,
        string? placeId,
        string? ownerName, 
        string? ownerPhone, 
        string? customDomain,
        BusinessSector sector, 
        TemplateType templateType, 
        int cardQuantity)
    {
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(slug))
        {
            TempData["Error"] = "El nombre y el slug del negocio son obligatorios.";
            return RedirectToAction(nameof(Index));
        }

        string cleanSlug = slug.Trim().ToLower().Replace(" ", "-");
        
        if (await _context.Businesses.AnyAsync(b => b.Slug == cleanSlug))
        {
            TempData["Error"] = $"El slug '{cleanSlug}' ya está en uso. Elige otro.";
            return RedirectToAction(nameof(Index));
        }

        string? cleanDomain = string.IsNullOrWhiteSpace(customDomain) ? null : customDomain.Trim().ToLower();

        if (cleanDomain != null && await _context.Businesses.AnyAsync(b => b.CustomDomain == cleanDomain))
        {
            TempData["Error"] = $"El dominio '{cleanDomain}' ya pertenece a otro cliente.";
            return RedirectToAction(nameof(Index));
        }

        // Generar automáticamente la URL de Google Maps a partir del Nombre, Ciudad y Place ID
        string generatedMapsUrl = GoogleReviewUrlBuilder.BuildReviewUrl(name, city, placeId, null);

        var business = new Business
        {
            Name = name.Trim(),
            Slug = cleanSlug,
            City = string.IsNullOrWhiteSpace(city) ? null : city.Trim(),
            GooglePlaceId = string.IsNullOrWhiteSpace(placeId) ? null : placeId.Trim(),
            GoogleMapsUrl = generatedMapsUrl,
            OwnerName = string.IsNullOrWhiteSpace(ownerName) ? null : ownerName.Trim(),
            OwnerPhone = string.IsNullOrWhiteSpace(ownerPhone) ? null : ownerPhone.Trim(),
            CustomDomain = cleanDomain,
            Sector = sector,
            TemplateType = templateType,
            PrimaryColor = sector == BusinessSector.Cevicheria ? "#0284C7" : (sector == BusinessSector.Polleria ? "#D97706" : "#2563EB")
        };

        _context.Businesses.Add(business);
        await _context.SaveChangesAsync();

        int qty = Math.Max(1, Math.Min(cardQuantity, 50));
        var random = new Random();

        for (int i = 1; i <= qty; i++)
        {
            string prefix = templateType == TemplateType.GoogleReviews ? "SD-REV" : "SD-MEN";
            string uniqueNum = random.Next(1000, 9999).ToString();
            string cardCode = $"{prefix}-{uniqueNum}";

            while (await _context.NfcCards.AnyAsync(c => c.CardCode == cardCode))
            {
                uniqueNum = random.Next(1000, 9999).ToString();
                cardCode = $"{prefix}-{uniqueNum}";
            }

            var card = new NfcCard
            {
                BusinessId = business.Id,
                CardCode = cardCode,
                CardType = templateType,
                Label = templateType == TemplateType.GoogleReviews ? "Caja Principal" : $"Mesa {i}",
                IsConfigured = true, // Al generar la URL automáticamente ya queda lista para operar
                ActivationPin = random.Next(1000, 9999).ToString()
            };
            _context.NfcCards.Add(card);
        }

        await _context.SaveChangesAsync();
        TempData["Success"] = $"Cliente '{business.Name}' registrado con éxito. URL de Google Maps autogenerada para {city ?? "su ubicación"}.";

        return RedirectToAction(nameof(Index));
    }
}
