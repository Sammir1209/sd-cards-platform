using Microsoft.AspNetCore.Mvc;

namespace NfcMenuSaas.Controllers.Api;

public class AppVersionInfo
{
    public string Version { get; set; } = "1.1.0";
    public int BuildNumber { get; set; } = 2;
    public string ReleaseDate { get; set; } = "2026-10-31";
    public string ApkUrl { get; set; } = "https://expo.dev/accounts/viel14/projects/sd_cards_mobile/builds";
    public string DirectDownloadUrl { get; set; } = "https://sd-cards-platform.onrender.com/app/latest.apk";
    public List<string> Changelog { get; set; } = new List<string>
    {
        "Redireccion directa 0ms a Google Maps (5 estrellas) y Carta Digital sin pantallas intermedias.",
        "Refactorizacion completa de interfaz con diseno grado Flutter / Fintech.",
        "Taller de hardware NFC con radar animado de deteccion y grabacion en silicio.",
        "Sistema de notificaciones y actualizacion in-app de 1 toque.",
        "Expansion de 5 modulos de administracion y telemetria en tiempo real."
    };
    public bool ForceUpdate { get; set; } = false;
    public string MinSupportedVersion { get; set; } = "1.0.0";
}

public class UpdateVersionRequest
{
    public string? Version { get; set; }
    public int? BuildNumber { get; set; }
    public string? ApkUrl { get; set; }
    public string? DirectDownloadUrl { get; set; }
    public List<string>? Changelog { get; set; }
    public bool? ForceUpdate { get; set; }
}

[ApiController]
[Route("api/[controller]")]
public class SystemApiController : ControllerBase
{
    private static AppVersionInfo _currentVersionInfo = new AppVersionInfo();

    [HttpGet("version")]
    public IActionResult GetVersion()
    {
        return Ok(new
        {
            success = true,
            data = _currentVersionInfo
        });
    }

    [HttpPut("version")]
    public IActionResult UpdateVersion([FromBody] UpdateVersionRequest request)
    {
        if (request == null) return BadRequest(new { success = false, error = "Peticion invalida." });

        if (!string.IsNullOrWhiteSpace(request.Version)) _currentVersionInfo.Version = request.Version.Trim();
        if (request.BuildNumber.HasValue) _currentVersionInfo.BuildNumber = request.BuildNumber.Value;
        if (!string.IsNullOrWhiteSpace(request.ApkUrl)) _currentVersionInfo.ApkUrl = request.ApkUrl.Trim();
        if (!string.IsNullOrWhiteSpace(request.DirectDownloadUrl)) _currentVersionInfo.DirectDownloadUrl = request.DirectDownloadUrl.Trim();
        if (request.Changelog != null && request.Changelog.Count > 0) _currentVersionInfo.Changelog = request.Changelog;
        if (request.ForceUpdate.HasValue) _currentVersionInfo.ForceUpdate = request.ForceUpdate.Value;
        _currentVersionInfo.ReleaseDate = DateTime.UtcNow.ToString("yyyy-MM-dd");

        return Ok(new
        {
            success = true,
            message = "Version de la aplicacion actualizada exitosamente en el servidor.",
            data = _currentVersionInfo
        });
    }

    [HttpGet("health")]
    public IActionResult HealthCheck()
    {
        return Ok(new
        {
            success = true,
            status = "HEALTHY",
            timestamp = DateTime.UtcNow,
            server = "Render Cloud Production"
        });
    }
}

