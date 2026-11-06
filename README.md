# Fitness Companion

Personal, offline-first fitness/nutrition app for Android and iOS. Full product spec: [`Fitness_Companion_PRD_v2.md`](./Fitness_Companion_PRD_v2.md).

## Repo layout

```
apps/mobile/      Expo (React Native + TypeScript) app — Android & iOS
services/api/     ASP.NET Core modular monolith backend (.NET, PostgreSQL)
docker-compose.yml   Dev stack: API + PostgreSQL
HOSTING.md           Hosting/provider decision checklist for prod
```

## Status

Phase 1 (Foundation) per the PRD's release plan (§11): design tokens, app shell with tabs, API skeleton, Postgres + EF migrations, Identity/JWT auth with invite-code sign-up, and CI are scaffolded. Feature logic (workouts, nutrition, sync engine, etc.) comes in later phases.

## Mobile app

```
cd apps/mobile
npm install
npm run lint
npx tsc --noEmit
npm test
npx expo start
```

## Backend

Requires the .NET 10 SDK.

```
cd services/api
dotnet restore
dotnet build
dotnet test
```

Or run the full dev stack (API + PostgreSQL) with Docker:

```
docker compose up --build
```

See [`HOSTING.md`](./HOSTING.md) for the production hosting decision checklist.
