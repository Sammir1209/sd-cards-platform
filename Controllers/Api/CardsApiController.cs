using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NfcMenuSaas.Data;
using NfcMenuSaas.Models;
using NfcMenuSaas.Services;

namespace NfcMenuSaas.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class CardsApiController : ControllerBase
{
    private readonly AppDbContext _context;

    public CardsApiController(AppDbContext context)
    {
        _context = context;
    }

    private string GetBaseUrl()
    {
        string? envUrl = Environment.GetEnvironmentVariable("PUBLIC_APP_URL");
        if (!string.IsNullOrWhiteSpace(envUrl))
        {
            return envUrl.TrimEnd('/');
        }

        string scheme = Request.Headers.TryGetValue("X-Forwarded-Proto", out var proto) && !string.IsNullOrWhiteSpace(proto)
            ? proto.ToString()
            : Request.Scheme;

        string host = Request.Headers.TryGetValue("X-Forwarded-Host", out var fHost) && !string.IsNullOrWhiteSpace(fHost)
            ? fHost.ToString()
            : Request.Host.Value ?? "127.0.0.1:5000";

        return $"{scheme}://{host}";
    }

    /// <summary>
    /// Obtiene las tarjetas NFC asignadas a un negocio (Multi-tarjeta)
    /// </summary>
    [HttpGet("business/{businessId:int}")]
    public async Task<IActionResult> GetByBusiness(int businessId)
    {
        var cards = await _context.NfcCards
            .Where(c => c.BusinessId == businessId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.CardCode,
                c.Label,
                CardType = c.CardType.ToString(),
                Status = c.Status.ToString(),
                c.NfcUid,
                c.IsConfigured,
                c.ActivationPin,
                c.TapCount,
                c.IsActive,
                c.ProgrammedAt,
                c.ActivatedAt,
                TargetUrl = $"{GetBaseUrl()}/t/{c.CardCode}"
            })
            .ToListAsync();

        return Ok(cards);
    }

    /// <summary>
    /// Permite al comprador actualizar la etiqueta (Ej. "Mesa 1", "Mesa VIP", "Caja 2")
    /// </summary>
    [HttpPut("{cardId:int}/label")]
    public async Task<IActionResult> UpdateLabel(int cardId, [FromBody] UpdateCardLabelRequest request)
    {
        var card = await _context.NfcCards.FindAsync(cardId);
        if (card == null) return NotFound(new { error = "Tarjeta no encontrada." });

        card.Label = request.Label.Trim();
        await _context.SaveChangesAsync();

        return Ok(new { success = true, card.Id, card.Label });
    }

    /// <summary>
    /// Endpoint para la App Móvil: Generar N tarjetas NFC nuevas para un cliente existente
    /// </summary>
    [HttpPost("generate-batch")]
    public async Task<IActionResult> GenerateBatch([FromBody] GenerateBatchRequest request)
    {
        var business = await _context.Businesses.FindAsync(request.BusinessId);
        if (business == null) return NotFound(new { error = "Negocio no encontrado." });

        int qty = Math.Max(1, Math.Min(request.Quantity, 50));
        var random = new Random();
        var generatedCards = new List<NfcCard>();

        for (int i = 1; i <= qty; i++)
        {
            string prefix = request.CardType == TemplateType.GoogleReviews ? "SD-REV" : "SD-MEN";
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
                CardType = request.CardType,
                Label = request.CardType == TemplateType.GoogleReviews 
                    ? $"Caja {i}" 
                    : $"Mesa Adicional {i}",
                IsConfigured = true,
                ActivationPin = random.Next(1000, 9999).ToString()
            };

            _context.NfcCards.Add(card);
            generatedCards.Add(card);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            totalCreated = generatedCards.Count,
            cards = generatedCards.Select(c => new
            {
                c.Id,
                c.CardCode,
                c.Label,
                NdefUrl = $"{GetBaseUrl()}/t/{c.CardCode}"
            })
        });
    }

    /// <summary>
    /// Asigna una tarjeta individualmente con etiqueta específica (Ej. "Mesa 1", "Caja Principal")
    /// </summary>
    [HttpPost("assign-single")]
    public async Task<IActionResult> AssignSingle([FromBody] AssignSingleCardRequest request)
    {
        var business = await _context.Businesses.FindAsync(request.BusinessId);
        if (business == null) return NotFound(new { error = "Negocio no encontrado." });

        string prefix = request.CardType == TemplateType.GoogleReviews ? "SD-REV" : "SD-MEN";
        string cardCode = string.IsNullOrWhiteSpace(request.CustomCode)
            ? $"{prefix}-{new Random().Next(1000, 9999)}"
            : request.CustomCode.Trim().ToUpper();

        if (await _context.NfcCards.AnyAsync(c => c.CardCode == cardCode))
        {
            return BadRequest(new { error = $"El código de tarjeta {cardCode} ya está registrado en el sistema." });
        }

        var card = new NfcCard
        {
            BusinessId = business.Id,
            CardCode = cardCode,
            CardType = request.CardType,
            Label = string.IsNullOrWhiteSpace(request.Label) ? "Punto Principal" : request.Label.Trim(),
            Status = CardStatus.ASSIGNED,
            IsConfigured = true,
            ActivationPin = new Random().Next(1000, 9999).ToString()
        };

        _context.NfcCards.Add(card);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            cardId = card.Id,
            cardCode = card.CardCode,
            label = card.Label,
            status = card.Status.ToString(),
            ndefUrl = $"{GetBaseUrl()}/t/{card.CardCode}"
        });
    }

    /// <summary>
    /// Paso 1 de Provisión: Inicia una sesión de programación de hardware y entrega el payload canónico
    /// </summary>
    [HttpPost("{cardId:int}/provision-session")]
    public async Task<IActionResult> StartProvisionSession(int cardId)
    {
        var card = await _context.NfcCards.FindAsync(cardId);
        if (card == null) return NotFound(new { error = "Tarjeta no encontrada." });

        string token = "PRV-" + Guid.NewGuid().ToString("N")[..12].ToUpper();
        card.ProvisionToken = token;
        card.ProvisionExpiresAt = DateTime.UtcNow.AddMinutes(15);
        card.Status = CardStatus.PROGRAMMING;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            cardId = card.Id,
            cardCode = card.CardCode,
            provisionToken = token,
            expectedUrl = $"{GetBaseUrl()}/t/{card.CardCode}",
            status = card.Status.ToString(),
            expiresInSeconds = 900
        });
    }

    /// <summary>
    /// Paso 2 de Provisión: Valida la lectura Read-Back del chip, registra el UID del fabricante y activa la tarjeta
    /// </summary>
    [HttpPost("{cardId:int}/confirm-provision")]
    public async Task<IActionResult> ConfirmProvision(int cardId, [FromBody] ConfirmProvisionRequest request)
    {
        var card = await _context.NfcCards.FindAsync(cardId);
        if (card == null) return NotFound(new { error = "Tarjeta no encontrada." });

        if (string.IsNullOrWhiteSpace(request.ProvisionToken) || card.ProvisionToken != request.ProvisionToken)
        {
            return BadRequest(new { error = "Token de sesión de provisión inválido o sesión expirada." });
        }

        if (card.ProvisionExpiresAt.HasValue && card.ProvisionExpiresAt.Value < DateTime.UtcNow)
        {
            return BadRequest(new { error = "La sesión de provisión ha caducado. Inicie una nueva sesión." });
        }

        string expectedPath = $"/t/{card.CardCode.ToLower()}";
        if (string.IsNullOrWhiteSpace(request.ReadBackUrl) || !request.ReadBackUrl.ToLower().Contains(expectedPath))
        {
            return BadRequest(new { error = $"La URL leída por Read-Back ({request.ReadBackUrl}) no coincide con el código de la tarjeta ({card.CardCode})." });
        }

        card.NfcUid = request.NfcUid;
        card.Status = CardStatus.ACTIVE;
        card.IsActive = true;
        card.ProgrammedAt = DateTime.UtcNow;
        card.ActivatedAt = DateTime.UtcNow;
        card.ProvisionToken = null; // Invalida el token tras el éxito

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            cardId = card.Id,
            cardCode = card.CardCode,
            status = card.Status.ToString(),
            nfcUid = card.NfcUid,
            chipFamily = request.ChipFamily ?? "NTAG215",
            activatedAt = card.ActivatedAt,
            message = "Hardware NFC verificado físicamente y activado en producción."
        });
    }

    /// <summary>
    /// Cancela la sesión de provisión y revierte el estado de la tarjeta a ASSIGNED
    /// </summary>
    [HttpPost("{cardId:int}/cancel-provision")]
    public async Task<IActionResult> CancelProvision(int cardId)
    {
        var card = await _context.NfcCards.FindAsync(cardId);
        if (card == null) return NotFound(new { error = "Tarjeta no encontrada." });

        if (card.Status == CardStatus.PROGRAMMING)
        {
            card.Status = CardStatus.ASSIGNED;
        }
        card.ProvisionToken = null;
        card.ProvisionExpiresAt = null;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            cardId = card.Id,
            cardCode = card.CardCode,
            status = card.Status.ToString(),
            message = "Sesión de provisión cancelada. Tarjeta devuelta a estado Asignado."
        });
    }

    /// <summary>
    /// Reintento de activación tras fallo de red cuando el chip ya fue grabado en silicio
    /// </summary>
    [HttpPost("{cardId:int}/retry-activation")]
    public async Task<IActionResult> RetryActivation(int cardId)
    {
        var card = await _context.NfcCards.FindAsync(cardId);
        if (card == null) return NotFound(new { error = "Tarjeta no encontrada." });

        if (card.Status != CardStatus.PROGRAMMED && card.Status != CardStatus.PROGRAMMED_PENDING_ACTIVATION)
        {
            return BadRequest(new { error = $"La tarjeta no se encuentra en estado pendiente de activación (Estado actual: {card.Status})." });
        }

        card.Status = CardStatus.ACTIVE;
        card.IsActive = true;
        card.ActivatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            cardId = card.Id,
            cardCode = card.CardCode,
            status = card.Status.ToString(),
            activatedAt = card.ActivatedAt,
            message = "Activación completada con éxito."
        });
    }

    /// <summary>
    /// Confirmación y activación de hardware tras lectura física de verificación
    /// </summary>
    [HttpPost("{cardId:int}/verify-activation")]
    public async Task<IActionResult> VerifyActivation(int cardId, [FromBody] VerifyActivationRequest request)
    {
        var card = await _context.NfcCards.FindAsync(cardId);
        if (card == null) return NotFound(new { error = "Tarjeta no encontrada." });

        card.NfcUid = request.NfcUid;
        card.Status = CardStatus.ACTIVE;
        card.IsActive = true;
        card.ProgrammedAt = DateTime.UtcNow;
        card.ActivatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            cardId = card.Id,
            cardCode = card.CardCode,
            status = card.Status.ToString(),
            activatedAt = card.ActivatedAt
        });
    }

    /// <summary>
    /// Elimina o desvincula una tarjeta física
    /// </summary>
    [HttpDelete("{cardId:int}")]
    public async Task<IActionResult> DeleteCard(int cardId)
    {
        var card = await _context.NfcCards.FindAsync(cardId);
        if (card == null) return NotFound(new { error = "Tarjeta no encontrada." });

        _context.NfcCards.Remove(card);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Tarjeta eliminada exitosamente." });
    }
}

public record UpdateCardLabelRequest(string Label);
public record GenerateBatchRequest(int BusinessId, TemplateType CardType, int Quantity);
public record AssignSingleCardRequest(int BusinessId, TemplateType CardType, string? Label, string? CustomCode);
public record VerifyActivationRequest(string? NfcUid, string? VerifiedUrl);
public record ConfirmProvisionRequest(string ProvisionToken, string NfcUid, string? ChipFamily, int? MemoryBytes, string ReadBackUrl);


