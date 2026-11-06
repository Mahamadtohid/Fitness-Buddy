# Hosting

## Running the dev stack locally

Requires Docker Desktop (not yet installed on this machine as of this writing).

```bash
cp .env.example .env     # fill in real values, at least JWT_KEY
docker compose up --build
```

This starts `postgres:16` and the API container (PRD §7.7). The API listens on
`http://localhost:8080`; Postgres on `localhost:5432`.

Once running, apply migrations (see `services/api/src/FitnessCompanion.Api/Migrations/README.md`)
before hitting any endpoint that touches the database.

## Production hosting — open decision (PRD §14)

Not yet decided. Compare current pricing/limits before committing — these change often and the
PRD deliberately left this open. Checklist:

- [ ] **Compute (API container host)** — candidates: Railway, Render, Fly.io, or a small
      Hetzner/DigitalOcean VM running Docker Compose + Caddy for HTTPS. Prefer an **Asia region**
      close to India for latency (primary user is in Pune).
- [ ] **Managed PostgreSQL** — candidates: Neon, Supabase Postgres, or the chosen host's own
      managed Postgres. Needs automated daily backups + point-in-time recovery. Match region to
      the API's.
- [ ] **Secrets** — use the host's secret store / environment variables for `Jwt__Key` and (later)
      the AI gateway provider key. Never commit real secrets; `.env` is gitignored.
- [ ] **Domain + HTTPS** — only needed once a host is chosen; Caddy handles this automatically on
      a VPS, managed PaaS hosts usually provide HTTPS out of the box.
- [ ] **Transactional email provider** (Resend or SendGrid, PRD §7.1) — needed before
      forgot/reset-password emails can actually reach the user; `LoggingEmailSender` is a stub
      until this is wired in.

Once chosen: add a `deploy` job to `.github/workflows/backend-ci.yml` that builds the Docker image
and ships it to the chosen host on merge to `main` (PRD §10 CI/CD), and fill in the real
`ConnectionStrings__Postgres` / `Jwt__Key` as host secrets.
