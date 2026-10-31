using System.ComponentModel.DataAnnotations;

namespace NfcMenuSaas.Models;

public class Category
{
    public int Id { get; set; }

    [Required]
    public int BusinessId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public int DisplayOrder { get; set; } = 0;

    // Relaciones
    public Business Business { get; set; } = null!;
    public ICollection<Dish> Dishes { get; set; } = new List<Dish>();
}

