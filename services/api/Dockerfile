FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY FitnessCompanion.sln ./
COPY src/FitnessCompanion.Api/FitnessCompanion.Api.csproj src/FitnessCompanion.Api/
COPY tests/FitnessCompanion.Tests/FitnessCompanion.Tests.csproj tests/FitnessCompanion.Tests/
RUN dotnet restore FitnessCompanion.sln

COPY . .
RUN dotnet publish src/FitnessCompanion.Api/FitnessCompanion.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "FitnessCompanion.Api.dll"]
