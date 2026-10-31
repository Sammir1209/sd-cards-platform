using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NfcMenuSaas.Data;
using NfcMenuSaas.Models;

namespace NfcMenuSaas.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class BusinessApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public BusinessApiController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var businesses = await _context.Businesses
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                b.Id,
                b.Name,
                b.Slug,
                b.OwnerName,
                b.OwnerPhone,
                b.OwnerEmail,
                b.AccessPassword,
                b.City,
                b.Address,
                b.TemplateType,
                b.IsActive,
                b.IsArchived,
                b.WhatsappOptIn,
                b.LastNotificationAt,
                CardsCount = b.Cards.Count
            })
            .ToListAsync();

        return Ok(businesses);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var b = await _context.Businesses
            .Include(x => x.Cards)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (b == null) return NotFound(new { error = "Negocio no encontrado." });

        return Ok(new
        {
            b.Id,
            b.Name,
            b.Slug,
            b.OwnerName,
            b.OwnerPhone,
            b.OwnerEmail,
            b.AccessPassword,
            b.City,
            b.Address,
            b.GoogleMapsUrl,
            b.AutoRedirectReviews,
            b.CustomDomain,
            b.GooglePlaceId,
            b.ActiveRoutingMode,
            b.WifiPassword,
            b.TemplateType,
            b.IsActive,
            Cards = b.Cards.Select(c => new
            {
                c.Id,
                c.CardCode,
                c.Label,
                CardType = c.CardType.ToString(),
                Status = c.Status.ToString(),
                c.TapCount
            })
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginApiRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Ingresa tu correo y contraseña." });

        string cleanEmail = request.Email.Trim().ToLower();
        string cleanPass = request.Password.Trim();

        // 1. Acceso oficial SuperAdmin
        if (cleanEmail == "samirconter@gmail.com")
        {
            return Ok(new
            {
                success = true,
                role = "superadmin",
                email = cleanEmail,
                name = "Samir Conter"
            });
        }

        // 2. Acceso oficial Cliente / Negocio
        string phoneSearch = cleanEmail.Replace(" ", "").Replace("+", "");
        var business = await _context.Businesses
            .FirstOrDefaultAsync(b => (b.OwnerEmail != null && b.OwnerEmail.ToLower() == cleanEmail) ||
                                      (b.OwnerPhone != null && b.OwnerPhone.Replace(" ", "").Replace("+", "").Contains(phoneSearch)) ||
                                      b.Slug.ToLower() == cleanEmail);

        if (business == null)
            return NotFound(new { error = "No existe ninguna cuenta de negocio asociada a este correo o usuario." });

        if (!business.IsActive || business.IsArchived)
            return StatusCode(403, new { error = "Esta cuenta de negocio se encuentra suspendida o archivada. Contacta a soporte S & D." });

        // Validación estricta de contraseña
        if (!string.IsNullOrEmpty(business.AccessPassword) && business.AccessPassword.Trim() != cleanPass)
        {
            return Unauthorized(new { error = "Contraseña incorrecta. Verifica tus credenciales de acceso." });
        }

        return Ok(new
        {
            success = true,
            role = "buyer",
            businessId = business.Id,
            businessName = business.Name,
            ownerName = business.OwnerName,
            email = business.OwnerEmail ?? cleanEmail,
            slug = business.Slug,
            templateType = (int)business.TemplateType
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterBusinessRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "El nombre del negocio es requerido." });

        string baseSlug = request.Name.ToLower().Trim()
            .Replace(" ", "-")
            .Replace("ñ", "n")
            .Replace("á", "a")
            .Replace("é", "e")
            .Replace("í", "i")
            .Replace("ó", "o")
            .Replace("ú", "u");

        string slug = baseSlug;
        int counter = 1;
        while (await _context.Businesses.AnyAsync(b => b.Slug == slug))
        {
            slug = $"{baseSlug}-{counter++}";
        }

        var random = new Random();
        string cleanPassword = string.IsNullOrWhiteSpace(request.Password)
            ? $"SD#{random.Next(1000, 9999)}!Pass"
            : request.Password.Trim();

        var business = new Business
        {
            Name = request.Name.Trim(),
            Slug = slug,
            OwnerName = request.OwnerName?.Trim() ?? "Propietario",
            OwnerPhone = request.Phone?.Trim() ?? "",
            OwnerEmail = request.Email?.Trim().ToLower(),
            AccessPassword = cleanPassword,
            City = request.City?.Trim() ?? "Lima",
            Address = request.Address?.Trim() ?? "",
            TemplateType = (TemplateType)request.Services,
            IsActive = true
        };

        _context.Businesses.Add(business);
        await _context.SaveChangesAsync();

        string tempPin = random.Next(1000, 9999).ToString();

        return Ok(new
        {
            success = true,
            businessId = business.Id,
            businessName = business.Name,
            slug = business.Slug,
            ownerEmail = business.OwnerEmail,
            accessPassword = business.AccessPassword,
            temporaryPin = tempPin,
            message = "Negocio registrado exitosamente con credenciales de acceso a la app."
        });
    }

    /// <summary>
    /// Desactiva / archiva un negocio (Soft-Delete) suspendiendo sus tarjetas sin destruir datos históricos
    /// </summary>
    [HttpPost("{id:int}/toggle-status")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var business = await _context.Businesses
            .Include(b => b.Cards)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (business == null) return NotFound(new { error = "Negocio no encontrado." });

        business.IsActive = !business.IsActive;
        business.IsArchived = !business.IsActive;

        // Si se desactiva, suspendemos todas sus tarjetas. Si se reactiva, vuelven a estar activas.
        foreach (var card in business.Cards)
        {
            if (business.IsActive)
            {
                if (card.Status == CardStatus.SUSPENDED)
                {
                    card.Status = CardStatus.ACTIVE;
                    card.IsActive = true;
                }
            }
            else
            {
                if (card.Status == CardStatus.ACTIVE)
                {
                    card.Status = CardStatus.SUSPENDED;
                    card.IsActive = false;
                }
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            isActive = business.IsActive,
            isArchived = business.IsArchived,
            message = business.IsActive 
                ? "Negocio y tarjetas reactivados exitosamente."
                : "Negocio archivado y tarjetas suspendidas preventivamente."
        });
    }

    /// <summary>
    /// Elimina o archiva un negocio según el parámetro permanente
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBusiness(int id, [FromQuery] bool permanent = false)
    {
        var business = await _context.Businesses
            .Include(b => b.Cards)
            .Include(b => b.Categories)
                .ThenInclude(c => c.Dishes)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (business == null) return NotFound(new { error = "Negocio no encontrado." });

        if (!permanent)
        {
            // Soft-Delete: Archivar lógicamente
            business.IsActive = false;
            business.IsArchived = true;
            foreach (var card in business.Cards)
            {
                card.Status = CardStatus.SUSPENDED;
                card.IsActive = false;
            }
            await _context.SaveChangesAsync();
            return Ok(new { success = true, archived = true, message = "Negocio archivado y tarjetas suspendidas sin destruir historial." });
        }

        // Eliminación física definitiva sólo si permanent=true
        _context.Businesses.Remove(business);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, archived = false, message = "Negocio y datos eliminados definitivamente de la base de datos." });
    }

    /// <summary>
    /// Actualiza la contraseña de acceso de un cliente
    /// </summary>
    [HttpPut("{id:int}/update-password")]
    public async Task<IActionResult> UpdatePassword(int id, [FromBody] UpdatePasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "La nueva contraseña es requerida." });

        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.Id == id);
        if (business == null) return NotFound(new { error = "Negocio no encontrado." });

        business.AccessPassword = request.Password.Trim();
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            businessId = business.Id,
            accessPassword = business.AccessPassword,
            message = "Contraseña actualizada exitosamente."
        });
    }

    /// <summary>
    /// Actualiza las URLs y opciones de enrutamiento NFC del negocio (Google Reviews y Menú Digital)
    /// </summary>
    [HttpPut("{id:int}/routing")]
    public async Task<IActionResult> UpdateRouting(int id, [FromBody] UpdateRoutingRequest request)
    {
        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.Id == id);
        if (business == null) return NotFound(new { error = "Negocio no encontrado." });

        // Validar permisos según el paquete contratado (TemplateType)
        bool canEditReviews = business.TemplateType == TemplateType.GoogleReviews || business.TemplateType == TemplateType.FullDualHub;
        bool canEditMenu = business.TemplateType == TemplateType.MenuDigital || business.TemplateType == TemplateType.FullDualHub;

        if (request.GoogleMapsUrl != null && canEditReviews)
        {
            string url = request.GoogleMapsUrl.Trim();
            if (!string.IsNullOrEmpty(url) && !url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                url = "https://" + url;
            }
            business.GoogleMapsUrl = string.IsNullOrEmpty(url) ? null : url;
        }

        if (request.AutoRedirectReviews.HasValue && canEditReviews)
        {
            business.AutoRedirectReviews = request.AutoRedirectReviews.Value;
        }

        if (request.ActiveRoutingMode.HasValue && request.ActiveRoutingMode.Value >= 1 && request.ActiveRoutingMode.Value <= 3)
        {
            int requestedMode = request.ActiveRoutingMode.Value;
            // Proteger modos contra el plan contratado
            if (requestedMode == 2 && !canEditMenu)
            {
                // El cliente solo tiene plan de Reseñas, no puede forzar modo menú
                requestedMode = 1;
            }
            else if (requestedMode == 1 && !canEditReviews)
            {
                // El cliente solo tiene plan de Menú, no puede forzar modo reseñas
                requestedMode = 2;
            }
            business.ActiveRoutingMode = requestedMode;
        }

        if (request.WifiPassword != null)
        {
            business.WifiPassword = string.IsNullOrWhiteSpace(request.WifiPassword) ? null : request.WifiPassword.Trim();
        }

        if (request.CustomDomain != null && canEditMenu)
        {
            string domain = request.CustomDomain.Trim();
            business.CustomDomain = string.IsNullOrEmpty(domain) ? null : domain;
        }

        if (!string.IsNullOrWhiteSpace(request.Slug))
        {
            string newSlug = request.Slug.Trim().ToLower().Replace(" ", "-");
            bool slugExists = await _context.Businesses.AnyAsync(b => b.Slug == newSlug && b.Id != id);
            if (!slugExists)
            {
                business.Slug = newSlug;
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            businessId = business.Id,
            templateType = (int)business.TemplateType,
            googleMapsUrl = business.GoogleMapsUrl,
            autoRedirectReviews = business.AutoRedirectReviews,
            customDomain = business.CustomDomain,
            activeRoutingMode = business.ActiveRoutingMode,
            wifiPassword = business.WifiPassword,
            slug = business.Slug,
            message = "Rutas NFC guardadas exitosamente."
        });
    }

    /// <summary>
    /// Actualiza el paquete / plan contratado del negocio (1=MenuDigital, 2=GoogleReviews, 3=FullDualHub)
    /// </summary>
    [HttpPut("{id:int}/template-type")]
    public async Task<IActionResult> UpdateTemplateType(int id, [FromBody] UpdateTemplateTypeRequest request)
    {
        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.Id == id);
        if (business == null) return NotFound(new { error = "Negocio no encontrado." });

        if (request.TemplateType >= 1 && request.TemplateType <= 3)
        {
            business.TemplateType = (TemplateType)request.TemplateType;
            if (business.TemplateType == TemplateType.GoogleReviews && business.ActiveRoutingMode == 2)
            {
                business.ActiveRoutingMode = 1;
            }
            else if (business.TemplateType == TemplateType.MenuDigital && business.ActiveRoutingMode == 1)
            {
                business.ActiveRoutingMode = 2;
            }
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            success = true,
            businessId = business.Id,
            templateType = (int)business.TemplateType,
            message = "Plan y servicios del negocio actualizados exitosamente."
        });
    }
}

public record UpdatePasswordRequest(string Password);
public record UpdateTemplateTypeRequest(int TemplateType);

public record UpdateRoutingRequest(
    string? GoogleMapsUrl,
    bool? AutoRedirectReviews,
    string? CustomDomain,
    string? Slug,
    int? ActiveRoutingMode = null,
    string? WifiPassword = null
);

public record RegisterBusinessRequest(
    string Name,
    string? OwnerName,
    string? Email,
    string? Phone,
    string? Password,
    string? Ruc,
    string? City,
    string? Address,
    int Services = 1
);

public record LoginApiRequest(
    string Email,
    string Password
);

