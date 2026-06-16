# Quick Guide: Supabase (Free Postgres) + Upstash (Free Redis)

Your Supabase Postgres database **is already migrated** (all Alembic migrations applied — version `ded3420b30bc`).  
You still need a Redis instance for caching and locks. This guide covers the Redis setup.

---

## Upstash Redis — ✅ Already Provisioned

A Redis database has already been created via the CLI and configured in `backend/.env`.

| Detail | Value |
|---|---|
| Name | `cup-budd-cache` |
| Endpoint | `trusting-sawfly-149468.upstash.io:6379` |
| TLS | yes |
| REDIS_URL | `backend/.env` is already set |

To verify the connection:

```bash
cd backend
python -c "import redis, os; r = redis.from_url(os.environ['REDIS_URL']); print(r.ping())"
```

---

## Connecting to Supabase Postgres (reference)

Your Supabase project is already migrated (alembic version `ded3420b30bc`).  
To switch from local SQLite to the cloud Postgres, update `backend/.env`:

```
DATABASE_URL="postgresql+asyncpg://postgres:<password>@db.anvbdlfdkylpfrryxhzs.supabase.co:5432/postgres"
```

---

## Local Docker fallback (no cloud services needed for dev)

Run Postgres and Redis locally:

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    ports:
      - '5432:5432'
  redis:
    image: redis:7
    command: redis-server --save "" --appendonly no
    ports:
      - '6379:6379'
```

Then `backend/.env`:

```
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"
REDIS_URL="redis://localhost:6379"
```

---

## Production tips

- Keep credentials out of the repo. Use your host's secret manager or CI/CD secrets.
- For Redis locks / leader election (scheduler), Upstash free tier connection limits may be reached at higher traffic; upgrade if needed.
- Configure CORS for your frontend domains in `CORS_ORIGINS`.

---

## References

- Upstash Redis docs: https://docs.upstash.com/redis
- Supabase docs: https://supabase.com/docs
- SQLAlchemy asyncpg docs: https://docs.sqlalchemy.org/en/14/dialects/postgresql.html#module-sqlalchemy.dialects.postgresql.asyncpg
