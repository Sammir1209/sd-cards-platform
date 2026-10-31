namespace NfcMenuSaas.Services;

public static class SectorPresets
{
    public static readonly Dictionary<string, List<string>> Presets = new()
    {
        ["Cevicheria"] = new List<string>
        {
            "Ceviches Clásicos & Mixtos",
            "Tiraditos & Causas Marinas",
            "Chicharrones, Jaleas & Piqueos",
            "Arroces, Tacu Tacu & Chaufa de Mariscos",
            "Parihuelas, Chilcanos & Sudados",
            "Bebidas, Chilcano & Cervezas"
        },
        ["Polleria"] = new List<string>
        {
            "Pollos a la Brasa & Combos",
            "Parrillas, Carnes & Brochetas",
            "Porciones de Papas & Guarniciones",
            "Ensaladas Frescas & Cremas",
            "Bebidas & Gaseosas"
        },
        ["Jugueria"] = new List<string>
        {
            "Jugos Especiales & Combinados",
            "Extractos Detox Energéticos",
            "Sándwiches Artesanales & Triples",
            "Bowls de Frutas, Yogur & Granola",
            "Snacks, Empanadas & Cafés"
        },
        ["CafeteriaBakery"] = new List<string>
        {
            "Cafés de Especialidad & Espressos",
            "Bebidas Frías & Frappés",
            "Pastelería Fina & Tortas",
            "Desayunos, Tostadas & Waffles",
            "Tés & Infusiones Naturales"
        },
        ["RestauranteGourmet"] = new List<string>
        {
            "Entradas & Piqueos de Autor",
            "Platos de Fondo & Carnes",
            "Pastas Artesanales & Risottos",
            "Coctelería Clásica & Vinos",
            "Postres de la Casa"
        },
        ["SalondeBelleza"] = new List<string>
        {
            "Corte, Peinado & Styling",
            "Colorimetría & Mechas",
            "Manicure, Pedicure & Spa",
            "Tratamientos Capilares",
            "Barbería Clásica"
        }
    };

    public static List<string> GetCategoriesForSector(string sector)
    {
        if (Presets.TryGetValue(sector, out var categories))
        {
            return categories;
        }
        return new List<string> { "Platos Principales", "Bebidas", "Postres" };
    }
}
