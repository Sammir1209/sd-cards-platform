using System.ComponentModel.DataAnnotations;

namespace NfcMenuSaas.Models;

public class Business
{
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Identificador amigable único para URLs (/m/{slug})
    /// </summary>
    [Required]
    [MaxLength(80)]
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Dominio personalizado propio del negocio (ej. 'menuben10.pe')
    /// </summary>
    [MaxLength(150)]
    public string? CustomDomain { get; set; }

    public TemplateType TemplateType { get; set; } = TemplateType.MenuDigital;

    public BusinessSector Sector { get; set; } = BusinessSector.General;

    /// <summary>
    /// RUC o DNI tributario/identificatorio del cliente
    /// </summary>
    [MaxLength(20)]
    public string? Ruc { get; set; }

    /// <summary>
    /// Departamento (Ubigeo Perú)
    /// </summary>
    [MaxLength(100)]
    public string? Department { get; set; }

    /// <summary>
    /// Provincia (Ubigeo Perú)
    /// </summary>
    [MaxLength(100)]
    public string? Province { get; set; }

    /// <summary>
    /// Distrito (Ubigeo Perú)
    /// </summary>
    [MaxLength(100)]
    public string? District { get; set; }

    /// <summary>
    /// Ciudad o distrito para geolocalizar y generar el link exacto de Google Maps
    /// </summary>
    [MaxLength(100)]
    public string? City { get; set; }

    /// <summary>
    /// Dirección del local
    /// </summary>
    [MaxLength(200)]
    public string? Address { get; set; }

    /// <summary>
    /// Google Place ID oficial (ej: ChIJN1t_tDeuEmsRUsoyG83frY4)
    /// </summary>
    [MaxLength(100)]
    public string? GooglePlaceId { get; set; }

    [MaxLength(100)]
    public string? OwnerName { get; set; }

    [MaxLength(30)]
    public string? OwnerPhone { get; set; }

    [MaxLength(150)]
    public string? OwnerEmail { get; set; }

    [MaxLength(100)]
    public string? AccessPassword { get; set; }

    /// <summary>
    /// Duración contratada del plan en meses (ej: 3, 6, 12, 24)
    /// </summary>
    public int PlanMonths { get; set; } = 12;

    /// <summary>
    /// Fecha calculada o fijada de vencimiento del plan
    /// </summary>
    public DateTime? PlanExpiryDate { get; set; }

    /// <summary>
    /// URL directa generada para reseñas de Google Maps
    /// </summary>
    [MaxLength(500)]
    public string? GoogleMapsUrl { get; set; }

    public bool AutoRedirectReviews { get; set; } = true;

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [MaxLength(7)]
    public string PrimaryColor { get; set; } = "#2563EB";

    public bool IsActive { get; set; } = true;
    public bool IsArchived { get; set; } = false;
    public bool WhatsappOptIn { get; set; } = true;
    public DateTime? LastNotificationAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Modo de enrutamiento activo para QR Multifuncional: 1=GoogleReviews, 2=MenuDigital, 3=SmartHub
    /// </summary>
    public int ActiveRoutingMode { get; set; } = 1;

    /// <summary>
    /// Clave Wi-Fi opcional mostrada en el Smart Hub
    /// </summary>
    [MaxLength(100)]
    public string? WifiPassword { get; set; }

    // Relaciones
    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<Category> Categories { get; set; } = new List<Category>();

    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<NfcCard> Cards { get; set; } = new List<NfcCard>();
}
