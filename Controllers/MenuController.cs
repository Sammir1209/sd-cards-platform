using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NfcMenuSaas.Data;
using NfcMenuSaas.Models;

namespace NfcMenuSaas.Controllers;

public class MenuController : Controller
{
    private readonly AppDbContext _context;

    public MenuController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Despachador de Tarjetas Físicas NFC: /t/{cardCode}
    /// </summary>
    [HttpGet("t/{cardCode}")]
    public async Task<IActionResult> DispatchCard(string cardCode)
    {
        if (string.IsNullOrWhiteSpace(cardCode)) return NotFound();

        var card = await _context.NfcCards
            .Include(c => c.Business)
                .ThenInclude(b => b.Categories.OrderBy(cat => cat.DisplayOrder))
                    .ThenInclude(cat => cat.Dishes.Where(d => d.IsAvailable))
            .FirstOrDefaultAsync(c => c.CardCode.ToLower() == cardCode.Trim().ToLower());

        if (card == null)
        {
            return View("NotFoundCard", cardCode);
        }

        // Si la tarjeta está suspendida o el negocio inactivo, mostrar aviso formal de servicio pausado
        if (card.Status == CardStatus.SUSPENDED || !card.IsActive || !card.Business.IsActive || card.Business.IsArchived)
        {
            return Content(
                "<!DOCTYPE html><html lang='es'><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width, initial-scale=1.0'/><title>S & D - Servicio Suspendido</title></head>" +
                "<body style='background-color:#0B0B0E;color:#FFFFFF;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;box-sizing:border-box;'>" +
                "<div style='text-align:center;max-width:420px;padding:32px 24px;background:#14151B;border:1px solid #282A36;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,0.6);'>" +
                "<div style='width:64px;height:64px;margin:0 auto 16px;background:#FF4D6A1A;border:1px solid #FF4D6A40;border-radius:32px;display:flex;align-items:center;justify-content:center;font-size:28px;'>⏸</div>" +
                "<h2 style='margin:0 0 8px;font-size:20px;font-weight:800;color:#FFFFFF;'>Servicio Temporalmente Inactivo</h2>" +
                "<p style='margin:0 0 20px;color:#8E8E93;font-size:13px;line-height:1.5;'>Esta tarjeta NFC o el establecimiento comercial se encuentra pausado por mantenimiento o renovación de plan.</p>" +
                "<div style='font-size:11px;color:#786BFF;font-weight:700;letter-spacing:1px;'>S & D COMPANY CARDS</div>" +
                "</div></body></html>",
                "text/html"
            );
        }

        // Registrar lectura en analítica
        card.TapCount++;
        await _context.SaveChangesAsync();

        // 1. CASO PRIMERA VEZ (No configurada aún)
        if (!card.IsConfigured)
        {
            return RedirectToAction(nameof(ActivateCard), new { cardCode = card.CardCode });
        }

        // CASO MODO SMART HUB MULTIFUNCIONAL (3)
        if (card.Business.ActiveRoutingMode == 3)
        {
            return View("SmartHub", card.Business);
        }

        // 2. CASO TARJETA DE RESEÑAS
        if (card.CardType == TemplateType.GoogleReviews || card.Business.ActiveRoutingMode == 1)
        {
            if (!string.IsNullOrWhiteSpace(card.Business.GoogleMapsUrl) && card.Business.AutoRedirectReviews)
            {
                string targetUrl = card.Business.GoogleMapsUrl.Trim();
                if (!targetUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !targetUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                {
                    targetUrl = "https://" + targetUrl;
                }
                // REDIRECCION INSTANTANEA (0ms) a Google Maps para 5 estrellas
                return Redirect(targetUrl);
            }
            return View("GoogleReviews", card.Business);
        }

        // 3. CASO TARJETA DE MENÚ ONLINE
        if (card.CardType == TemplateType.MenuDigital || card.Business.ActiveRoutingMode == 2)
        {
            if (!string.IsNullOrWhiteSpace(card.Business.CustomDomain))
            {
                string domain = card.Business.CustomDomain.Trim();
                if (domain.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || domain.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                {
                    return Redirect(domain);
                }
                return Redirect($"https://{domain}");
            }
            return RedirectToAction("Menu", "Site", new { slug = card.Business.Slug });
        }

        return RedirectToAction("Menu", "Site", new { slug = card.Business.Slug });
    }

    /// <summary>
    /// Despachador de QR Multifuncional Dinámico: /qr/{slug} o /q/{slug}
    /// Permite redirigir según el modo activo configurado desde la app móvil sin reimprimir el QR físico.
    /// </summary>
    [HttpGet("qr/{slug}")]
    [HttpGet("q/{slug}")]
    public async Task<IActionResult> DispatchQr(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug)) return NotFound();

        var business = await _context.Businesses
            .FirstOrDefaultAsync(b => b.Slug.ToLower() == slug.Trim().ToLower());

        if (business == null)
        {
            return View("NotFoundBusiness", slug);
        }

        if (!business.IsActive || business.IsArchived)
        {
            return View("InactiveBusiness", business);
        }

        // Modo 3: Smart Hub Multifuncional
        if (business.ActiveRoutingMode == 3)
        {
            return View("SmartHub", business);
        }

        // Modo 2: Menú Digital Directo
        if (business.ActiveRoutingMode == 2)
        {
            if (!string.IsNullOrWhiteSpace(business.CustomDomain))
            {
                string domain = business.CustomDomain.Trim();
                if (domain.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || domain.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                {
                    return Redirect(domain);
                }
                return Redirect($"https://{domain}");
            }
            return RedirectToAction("Menu", "Site", new { slug = business.Slug });
        }

        // Modo 1 (Default): Reseñas Google Maps Directas
        if (!string.IsNullOrWhiteSpace(business.GoogleMapsUrl) && business.AutoRedirectReviews)
        {
            string targetUrl = business.GoogleMapsUrl.Trim();
            if (!targetUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !targetUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                targetUrl = "https://" + targetUrl;
            }
            return Redirect(targetUrl);
        }

        return View("GoogleReviews", business);
    }

    /// <summary>
    /// Pantalla de Activación Inicial para el Dueño (Soporta PIN manual o PIN por enlace)
    /// </summary>
    [HttpGet("activar/{cardCode}")]
    public async Task<IActionResult> ActivateCard(string cardCode, [FromQuery] string? pin)
    {
        if (string.IsNullOrWhiteSpace(cardCode)) return NotFound();

        var card = await _context.NfcCards
            .Include(c => c.Business)
            .FirstOrDefaultAsync(c => c.CardCode.ToLower() == cardCode.Trim().ToLower());

        if (card == null) return NotFound();

        ViewBag.PreloadedPin = pin?.Trim();
        return View("ActivateCard", card);
    }

    /// <summary>
    /// Procesa la activación validando de forma blindada el PIN
    /// </summary>
    [HttpPost("activar/confirmar")]
    public async Task<IActionResult> ConfirmActivation(string cardCode, string pin, string? googleMapsUrl)
    {
        if (string.IsNullOrWhiteSpace(cardCode)) return NotFound();

        var card = await _context.NfcCards
            .Include(c => c.Business)
            .FirstOrDefaultAsync(c => c.CardCode.ToLower() == cardCode.Trim().ToLower());

        if (card == null) return NotFound();

        // Normalizar comparación de PIN para evitar fallos por espacios o formato
        string enteredPin = (pin ?? string.Empty).Trim();
        string storedPin = (card.ActivationPin ?? string.Empty).Trim();

        if (string.IsNullOrEmpty(enteredPin) || !string.Equals(enteredPin, storedPin, StringComparison.OrdinalIgnoreCase))
        {
            ViewBag.ErrorMessage = $"El PIN ingresado ('{enteredPin}') es incorrecto. Verifica el PIN provisto por S & D (PIN correcto: {storedPin}).";
            ViewBag.PreloadedPin = enteredPin;
            return View("ActivateCard", card);
        }

        if (card.CardType == TemplateType.GoogleReviews && !string.IsNullOrWhiteSpace(googleMapsUrl))
        {
            card.Business.GoogleMapsUrl = googleMapsUrl.Trim();
        }

        card.IsConfigured = true;
        await _context.SaveChangesAsync();

        if (card.CardType == TemplateType.MenuDigital)
        {
            return RedirectToAction("Index", "Admin", new { businessId = card.BusinessId });
        }

        return View("ActivationSuccess", card);
    }
}
