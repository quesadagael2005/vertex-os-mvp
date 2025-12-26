# ADR 002: Prisma as ORM Layer

**Date:** 2024-12-23  
**Status:** Accepted  
**Deciders:** Team

## Context
Need type-safe database access with migrations and strong TypeScript integration.

## Decision
Use **Prisma** as the ORM layer on top of Supabase PostgreSQL.

## Rationale
1. **Type Safety:** Auto-generated TypeScript types from schema
2. **Migration Management:** Version-controlled schema changes
3. **Developer Experience:** Excellent VS Code integration, query builder
4. **Performance:** Optimized query generation, connection pooling
5. **Supabase Compatibility:** Works seamlessly with Supabase PostgreSQL

## Implementation Strategy

```typescript
// Use Prisma for CRUD operations
const member = await prisma.members.findUnique({ where: { id } });

// Use Supabase client for auth and real-time
const { data: { user } } = await supabase.auth.getUser();
const subscription = supabase
  .channel('jobs')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs' }, handler)
  .subscribe();
```

## Trade-offs
- **Pro:** Type safety, migrations, excellent DX
- **Con:** Dual client approach (Prisma + Supabase)
- **Con:** Must keep RLS policies in sync with Prisma schema

## Alternatives Considered
1. **Supabase client only** - Lacks type safety and migration management
2. **Drizzle ORM** - Less mature ecosystem
3. **TypeORM** - Decorator-based approach less clean than Prisma


