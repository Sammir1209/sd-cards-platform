# ==============================================================================
# Dockerfile para Produccion: ASP.NET Core (.NET 10) - S & D Platform Backend
# Compatible con Render, Railway, Fly.io y cualquier contenedor Linux
# ==============================================================================

# ETAPA 1: Compilacion y publicacion
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar definicion de proyecto y restaurar dependencias
COPY ["NfcMenuSaas.csproj", "./"]
RUN dotnet restore "./NfcMenuSaas.csproj"

# Copiar el resto del codigo fuente
COPY . .

# Compilar release optimizado
RUN dotnet publish "./NfcMenuSaas.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ETAPA 2: Runtime final ligero
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Puerto dinamico para Render (Render inyecta la variable $PORT)
ENV ASPNETCORE_HTTP_PORTS=5000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

# Si existe base de datos inicial, copiarla para no empezar vacio
COPY nfcmenu.db ./nfcmenu.db

# Punto de entrada
ENTRYPOINT ["dotnet", "NfcMenuSaas.dll"]

