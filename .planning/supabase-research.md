# Issue #9 — Integración de Base de Datos: Migración a Neon.tech

**Fecha:** 2026-05-15
**Estado:** ✅ **Migración completada — Supabase reemplazado por Neon.tech**

---

## Decisión final: Neon.tech 🥇

**Razones:**
1. IPv4 incluido — funciona en Windows sin add-ons de $10/mes
2. Pooling automático — sin necesidad de configurar Supavisor/PgBouncer
3. Mismo stack: PostgreSQL + Prisma — migración trivial
4. No usamos Auth/Storage/Realtime de Supabase — no hay pérdida

---

## Conexión actual (Neon.tech)

```env
DATABASE_URL=postgresql://neondb_owner:[PASSWORD]@ep-morning-bread-aqerv5kb.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:[PASSWORD]@ep-morning-bread-aqerv5kb.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Host:** `ep-morning-bread-aqerv5kb.c-8.us-east-1.aws.neon.tech`
**Database:** `neondb`
**User:** `neondb_owner`
**SSL:** `sslmode=require`

---

## Stack final

```
PrismaClient 7.8.0 → @prisma/adapter-pg → pg.Pool → Neon.tech PostgreSQL
```

---

## Pruebas de verificación

| Prueba | Resultado |
|--------|:---------:|
| `pg.Pool` → `SELECT 1` | ✅ Conexión IPv4 directa |
| `npx prisma db push` | ✅ Schema sincronizado |
| `prisma.userProfile.findMany()` | ✅ Query real devuelve datos |
| `npx prisma generate` | ✅ Cliente generado |

---

## Archivos modificados

| Archivo | Cambio | Git |
|---------|--------|:---:|
| `.env` | Supabase URLs → Neon URLs | 🔒 gitignored |
| `src/lib/prisma.ts` | Sin cambios (lee DATABASE_URL de env) | ✅ ya commiteado |

---

## Historial de decisiones

| Fecha | Decisión |
|-------|----------|
| 2026-05-15 | Fase 1: Research completado (Supabase pooler, IPv4 workarounds) |
| 2026-05-15 | Fase 2: Mock → PrismaClient real con Supabase directa ✅ |
| 2026-05-15 | **Migración a Neon.tech** — IPv4, pooling automático, $0 |
