# FitTrack Backend Deployment Readiness

## Purpose

This document explains how to deploy the FitTrack backend for real users, keep user data in managed PostgreSQL, and connect the Android application to the production API.

## Current backend

- Framework: ASP.NET Core 10
- Database: PostgreSQL
- Authentication: JWT access tokens and refresh tokens
- Deployment format: Docker container
- Container port: `8080`
- Health endpoint: `/health/live`
- Readiness endpoint: `/health/ready`
- Dockerfile: `services/api/Dockerfile`
- Local compose file: `docker-compose.yml`

The API already models user-owned data and applies per-user EF Core query filters. This protects normal queries from returning another user's rows, but production still requires secure secrets, HTTPS, backups, and database migrations.

## Verification completed

- ASP.NET Core Release build passed.
- All 33 backend tests passed.
- The Dockerfile structure is valid for the current solution layout.
- Docker image execution could not be tested on the development machine because Docker is not installed there.

## Dockerfile verdict

The Dockerfile is correct when the build context is `services/api`:

```powershell
docker build -t fitness-api ./services/api
docker run --rm -p 8080:8080 fitness-api
```

The image performs a multi-stage build, publishes the API in Release mode, runs on the ASP.NET runtime image, and listens on port `8080`.

### Hosting configuration

For a platform such as Render, use:

```text
Root directory: services/api
Dockerfile: Dockerfile
Port: 8080
Health check: /health/live
```

Do not set the repository root as the Docker build context unless the Dockerfile is changed, because its `COPY` paths are relative to `services/api`.

## Local Docker Compose versus production

`docker-compose.yml` is suitable for local development. It is not a production deployment definition because it:

- sets `ASPNETCORE_ENVIRONMENT` to `Development`;
- contains development database defaults;
- publishes PostgreSQL directly on host port `5432`;
- expects `JWT_KEY` to be supplied externally;
- stores PostgreSQL in a local Docker volume.

For production, use a managed PostgreSQL database and keep it private. Only the API should be publicly reachable through HTTPS.

## Recommended production architecture

```text
Android application
        |
        | HTTPS
        v
Public API domain, for example https://api.fittrack.com
        |
        | private database connection
        v
ASP.NET Core Docker service
        |
        v
Managed PostgreSQL with backups
```

Render is a simple first production option for this repository because it can build the Dockerfile from Git and provide a managed PostgreSQL service. Azure Container Apps with Azure Database for PostgreSQL is a stronger option when more advanced networking, autoscaling, or enterprise controls are required.

## Required production environment variables

Configure these in the hosting provider's secret/environment settings, not in Git:

```text
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_FORWARDEDHEADERS_ENABLED=true
ConnectionStrings__Postgres=<managed PostgreSQL connection string>
Jwt__Key=<long random signing key>
Jwt__Issuer=FitnessCompanion
Jwt__Audience=FitnessCompanion
```

Never use the development JWT key or the default PostgreSQL password in production.

## HTTPS and reverse proxy handling

The API currently calls `UseHttpsRedirection()`. Managed platforms normally terminate HTTPS at their load balancer and forward HTTP to the container. Configure forwarded headers before HTTPS redirection, or set the hosting platform's supported forwarded-header setting:

```text
ASPNETCORE_FORWARDEDHEADERS_ENABLED=true
```

Without this, the API may not recognize that the original request was HTTPS and can produce redirect loops behind a reverse proxy.

## Database migrations

The repository contains EF Core migrations under:

```text
services/api/src/FitnessCompanion.Api/Migrations
```

The API does not currently apply migrations automatically at startup. Before the first production release, run the migration step against the managed database. Use a controlled deployment or one-off migration job rather than allowing multiple API replicas to migrate concurrently.

The migration process must be verified before accepting real user traffic.

## Android API configuration

The Android application must not use `localhost` or a private LAN IP in a production build. Configure the public HTTPS API URL in EAS:

```powershell
cd apps/mobile

npx eas-cli@latest env:set `
  --name API_BASE_URL `
  --value https://api.fittrack.com `
  --environment production `
  --visibility plaintext
```

Then create the production Android App Bundle:

```powershell
npx eas-cli@latest build --platform android --profile production
```

The current LAN URL `http://10.220.126.19:5000` is only for local testing while the phone and development computer are on the same Wi-Fi network.

## Production deployment checklist

- [ ] Create the managed PostgreSQL database.
- [ ] Configure database backups and recovery.
- [ ] Deploy the API from `services/api/Dockerfile`.
- [ ] Set the container port to `8080`.
- [ ] Configure `/health/live` as the liveness check.
- [ ] Set all production environment variables.
- [ ] Configure forwarded HTTPS headers.
- [ ] Run EF Core migrations once against production PostgreSQL.
- [ ] Verify `/health/live` and `/health/ready`.
- [ ] Test registration, login, refresh-token flow, sync, and account deletion.
- [ ] Confirm two test users cannot access each other's records.
- [ ] Configure `API_BASE_URL` in the EAS production environment.
- [ ] Build and test the production Android App Bundle.
- [ ] Commit and push the release code before publishing.
- [ ] Monitor logs, errors, database usage, and backup status.

## Security and reliability items to address

1. Add a `.dockerignore` file to exclude `bin`, `obj`, `.git`, local environment files, and other unnecessary build context.
2. Review the reported vulnerable transitive cryptography packages before production release.
3. Ensure production JWT secrets are long, random, and stored only in the hosting provider's secret manager.
4. Do not expose PostgreSQL to the public internet.
5. Add rate limiting and monitoring alerts for authentication and synchronization endpoints.
6. Test database restore procedures before relying on the system for user data.

## References

- [ASP.NET Core proxy and load balancer configuration](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-10.0)
- [Render Docker deployment](https://render.com/docs/docker)
- [Render web services](https://render.com/docs/web-services)
- [Render PostgreSQL](https://render.com/docs/postgresql)
