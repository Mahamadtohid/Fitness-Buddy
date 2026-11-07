# Export module

`GET /api/v1/export` (PRD §11 Phase 5, §7.4) — a full JSON export of every table the caller owns,
scoped automatically by AppDbContext's per-user query filter. Distinct from the sync mechanism: a
plain authenticated read, no outbox/idempotency/paging.
