# 🔬 Supabase + Prisma Research — Issue #9

> **Branch:** `feature/supabase-integration`
> **Date:** 2026-05-15
> **Purpose:** Document research findings for integrating Supabase as the real database backend, replacing the current mock Prisma client.

---

## 📌 Problem Statement

The project currently uses a **mock Prisma client** (`src/lib/prisma.ts`) that returns empty/safe defaults. All data (jobs, CVs, profiles, history) is lost between pipeline runs. The app needs a real PostgreSQL database.

**Root cause of deferral:** Supabase hostname (`db.xxx.supabase.co`) resolves to IPv6-only on some cloud providers. Windows + Node.js `pg` driver fails to connect, returning:
```
getaddrinfo ENOTFOUND db.xxx.supabase.co
```
or connection timeouts on IPv6 routes.

---

## 🧪 Prisma 7 + Supabase Setup

### Current installed dependencies ✅ (already in `package.json`)

```json
{
  "@prisma/adapter-pg": "^7.5.0",
  "@prisma/client": "^7.5.0",
  "pg": "^8.20.0",
  "prisma": "^7.5.0"
}
```

### Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider   = "prisma-client"
  output     = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}
```

### ⚠️ Missing: `url` and `directUrl` in datasource

The current schema has NO `url` or `directUrl` defined in the datasource block. These must be added:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## 🛠️ Solution 1: Supabase Connection Pooler (PgBouncer) ✅ RECOMMENDED

Supabase provides a **built-in PgBouncer connection pooler** on separate infrastructure that supports IPv4:

### How to find your pooler hostname

```
Project Settings → Database → Connection string → URI → PGBOUNCER (port 6543)
```

Format:
```
aws-0-[region].pooler.supabase.com
```

### .env configuration

```env
# Transaction mode via pooler (IPv4-compatible) ✅
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Session mode for migrations (direct connection — may still have IPv6)
DIRECT_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### Why the pooler works

| Feature | Direct | Pooler |
|---------|--------|--------|
| **IPv4** | ⚠️ May only resolve to IPv6 | ✅ Separate infra with IPv4 |
| **Port** | 5432 | 6543 (transaction) / 5432 (session) |
| **Connection limit** | 15 direct | Unlimited via pooling |
| **Prisma compatible** | ✅ | ✅ with `pgbouncer=true` |
| **For migrations** | ✅ DIRECT_URL | ❌ Use DIRECT_URL instead |

### For migrations (Prisma Migrate)

Prisma Migrate requires a **session-mode** connection (not transaction pooler):

```env
# Session mode pooler (port 5432)
DIRECT_URL=postgresql://postgres:[pass]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

**OR** use the direct connection (may have IPv6 issues):

```env
DIRECT_URL=postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres
```

---

## 🛠️ Solution 2: IPv4 Workarounds

### Option A: `?family=4` query parameter

```env
DATABASE_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres?family=4
```

- **Pro:** Simple, one-line change
- **Con:** Not all versions of `pg` driver support this parameter
- **Result:** Skipped — unreliable

### Option B: Windows hosts file override

1. Resolve the Supabase hostname to its IPv4 address:
```bash
nslookup db.xxx.supabase.co
```
2. Add to `C:\Windows\System32\drivers\etc\hosts`:
```
203.0.113.1 db.xxx.supabase.co
```

- **Pro:** Guaranteed IPv4
- **Con:** IP can change — fragile
- **Result:** Workaround, but not for production

### Option C: Node.js `--dns-result-order=ipv4first`

```bash
NODE_OPTIONS="--dns-result-order=ipv4first" npx tsx script.ts
```

- **Pro:** Forces DNS to prefer IPv4 without code changes
- **Con:** Experimental flag, may not work in all Node.js versions
- **Result:** Worth trying as first test

---

## 🛠️ Solution 3: Neon.tech (Alternative)

**Neon** is a serverless PostgreSQL alternative with better Windows/IPv4 support:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

| Feature | Supabase | Neon |
|---------|----------|------|
| **IPv4** | ⚠️ Requires pooler | ✅ Direct |
| **Free tier** | 500 MB, 2 projects | 500 MB, branch limit |
| **Compute** | Always-on | Pauses after 5min idle (wakes on query) |
| **Prisma** | ✅ + pooler config | ✅ Direct, simpler |
| **Pooling** | Built-in PgBouncer | Auto (configurable) |
| **Windows** | ⚠️ IPv6 issues | ✅ Confirmed working |

**Con of Neon:** Database pauses after inactivity (free tier). First query after idle takes ~2s to wake up.

---

## 🛠️ Solution 4: Local PostgreSQL + WSL (Development Only)

```env
# Local Postgres via WSL
DATABASE_URL=postgresql://localhost:5432/seahorse
DIRECT_URL=postgresql://localhost:5432/seahorse
```

**Setup:**
```bash
# Inside WSL
sudo apt install postgresql
sudo -u postgres createuser --superuser $USER
createdb seahorse

# From Windows
npx prisma migrate dev
```

**Best for:** Development and testing before deploying to Supabase.

---

## 🧩 Implementation Plan

### Fase 2 — Conexión (próximo paso)

1. Agregar `url` y `directUrl` al schema de Prisma
2. Crear archivo `.env` (o actualizar el existente) con:
   - `DATABASE_URL` → pooler (transaction mode)
   - `DIRECT_URL` → direct connection
3. Reemplazar `src/lib/prisma.ts` con `PrismaClient` real usando `@prisma/adapter-pg`:

```typescript
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export { prisma }
```

4. Probar con: `npx prisma db push` (si falla → probar pooler)
5. Agregar `npx prisma generate` + `npx prisma migrate dev` al setup

### Fase 3 — Pipeline integration

- Modificar `src/automation/orchestrator.ts` para guardar jobs en DB (upsert por URL)
- Modificar `scripts/run-profile-pipeline.ts` para persistir perfiles extraídos
- Implementar deduplicación real (no pasar todos los jobs)
- Implementar cleanup (borrar jobs >3 meses)

### Fase 4 — CI

- Agregar `DATABASE_URL` + `DIRECT_URL` como secrets en GitHub
- Agregar `npx prisma generate` al workflow `main.yml`
- Opcional: `npx prisma migrate deploy` en CI

---

## 📋 Testing Checklist

| Test | Command | Expected |
|------|---------|----------|
| Conexión pooler | `npx prisma db push` | ✅ Success |
| Generar client | `npx prisma generate` | ✅ Client generated |
| Pipeline con DB | `npx tsx scripts/run-profile-pipeline.ts test.pdf` | Jobs persisted |
| Duplicados | Same pipeline twice | No duplicate jobs |
| Cleanup | Check jobs >90 days | Deleted |
| CI | Push to main | Workflow passes |

---

## 🔗 References

- [Supabase Prisma Guide](https://supabase.com/docs/guides/integrations/prisma)
- [Supabase Connection Pooler](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma 7 + @prisma/adapter-pg](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [Prisma Multiple Schema with Supabase](https://www.prisma.io/docs/orm/prisma-schema/overview)
- [Neon Prisma Setup](https://neon.tech/docs/guides/prisma)
- Issue #9: https://github.com/byAyes/SeaHorse/issues/9
- Issue #8 (frontend depende de DB): https://github.com/byAyes/SeaHorse/issues/8
