using System.Net;

namespace NfcMenuSaas.Services;

public static class GoogleReviewUrlBuilder
{
    /// <summary>
    /// Construye la URL exacta que abre el diálogo nativo de 5 estrellas de Google en Android e iOS.
    /// Soporta URLs directas de Google Search con el disparador #ebo=3
    /// </summary>
    public static string BuildReviewUrl(string businessName, string? city, string? placeId, string? customUrl)
    {
        // 1. Si ya se pegó una URL exacta con el disparador de popup (#ebo=3 o writereview o &si=)
        if (!string.IsNullOrWhiteSpace(customUrl) && customUrl.Contains("http", StringComparison.OrdinalIgnoreCase))
        {
            string url = customUrl.Trim();
            // Asegurar que si es una búsqueda de opiniones de Google, tenga el disparador #ebo=3
            if (url.Contains("google.com/search", StringComparison.OrdinalIgnoreCase) && !url.Contains("#ebo="))
            {
                url += "#ebo=3";
            }
            return url;
        }

        // 2. Si tiene Place ID oficial
        if (!string.IsNullOrWhiteSpace(placeId))
        {
            return $"https://search.google.com/local/writereview?placeid={placeId.Trim()}";
        }

        // 3. GENERADOR DE URL CON EL DISPARADOR NATIVO #ebo=3 (Google Search Reviews Dialog):
        // Este es el formato EXACTO que abre la ficha con la ventana emergente de calificar en Android
        string query = string.IsNullOrWhiteSpace(city) 
            ? $"opiniones de {businessName}" 
            : $"opiniones de {businessName} {city}";

        string encodedQuery = WebUtility.UrlEncode(query.Trim());

        // Al agregar #ebo=3 al final, el navegador móvil de Android abre el modal directo de enviar reseña
        return $"https://www.google.com/search?q={encodedQuery}#ebo=3";
    }
}
