using Microsoft.AspNetCore.Mvc;
using NfcMenuSaas.Data;

namespace NfcMenuSaas.Controllers;

/// <summary>
/// Controlador de compatibilidad directa para entidades y clientes que consumen BusinessController / api/business
/// Hereda e implementa todos los endpoints de gestión integral de clientes.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Route("[controller]")]
public class BusinessController : Api.BusinessApiController
{
    public BusinessController(AppDbContext context) : base(context)
    {
    }
}
