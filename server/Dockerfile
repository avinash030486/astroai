FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY AstroAI.Api/AstroAI.Api.csproj AstroAI.Api/
COPY AstroAI.Core/AstroAI.Core.csproj AstroAI.Core/
COPY AstroAI.Infrastructure/AstroAI.Infrastructure.csproj AstroAI.Infrastructure/
RUN dotnet restore AstroAI.Api/AstroAI.Api.csproj

COPY . .
RUN dotnet publish AstroAI.Api/AstroAI.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}
ENTRYPOINT ["dotnet", "AstroAI.Api.dll"]