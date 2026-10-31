using System.ComponentModel.DataAnnotations;

namespace NfcMenuSaas.Models;

public enum CardStatus
{
    INVENTORY = 0,   // En bodega / virgen
    ASSIGNED = 1,    // Asignada a un negocio
    PROGRAMMING = 2, // En proceso de sesión de grabación física
    PROGRAMMED = 3,  // Chip grabado con NDEF verificado físicamente
    ACTIVE = 4,      // En operación normal autorizada
    SUSPENDED = 5,   // Pausada temporalmente / negocio inactivo
    REVOKED = 6,     // Extraviada / revocada por seguridad
    DEFECTIVE = 7,   // Chip dañado / error de I/O
    PROGRAMMED_PENDING_ACTIVATION = 8 // Grabado en silicio pero pendiente de confirmación en servidor
}

public class NfcCard
{
    public int Id { get; set; }

    /// <summary>
    /// Código público corto grabado en el chip NTAG215. Ej: "SD-8492" o "SD-7F92K"
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string CardCode { get; set; } = string.Empty;

    public int BusinessId { get; set; }
    public Business Business { get; set; } = null!;

    public TemplateType CardType { get; set; } = TemplateType.GoogleReviews;

    /// <summary>
    /// Etiqueta física: "Mesa 1", "Mesa 2", "Caja Principal", "Barra"
    /// </summary>
    [MaxLength(50)]
    public string Label { get; set; } = "Caja Principal";

    /// <summary>
    /// Estado del ciclo de vida industrial
    /// </summary>
    public CardStatus Status { get; set; } = CardStatus.ACTIVE;

    public bool IsConfigured { get; set; } = true;

    /// <summary>
    /// UID hexadecimal único del chip físico NTAG215
    /// </summary>
    [MaxLength(50)]
    public string? NfcUid { get; set; }

    [MaxLength(10)]
    public string ActivationPin { get; set; } = "1234";

    [MaxLength(100)]
    public string? ProvisionToken { get; set; }

    public DateTime? ProvisionExpiresAt { get; set; }

    public int TapCount { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProgrammedAt { get; set; }
    public DateTime? ActivatedAt { get; set; }
}
