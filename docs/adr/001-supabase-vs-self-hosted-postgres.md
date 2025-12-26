# ADR 001: Supabase vs Self-Hosted PostgreSQL

**Date:** 2024-12-23  
**Status:** Accepted  
**Deciders:** Team

## Context
VERTEX OS requires a PostgreSQL database with real-time capabilities, authentication, and file storage.

## Decision
We will use **Supabase** as our backend platform.

## Consequences

### Positive
- Built-in authentication (reduces custom auth code)
- Real-time subscriptions out of the box
- File storage included
- Automatic API generation via PostgREST
- Row Level Security (RLS) for data isolation
- Generous free tier, scales with usage

### Negative
- Vendor lock-in considerations
- Need to manage RLS policies alongside Prisma models
- Must decide: Supabase client vs Prisma client
- Additional learning curve for team

## Implementation Notes
- Use Prisma for schema management and migrations
- Use Supabase client for auth and real-time features
- Document RLS policies in separate file
- Set up local Supabase instance for development

## Alternatives Considered
1. **Self-hosted PostgreSQL + custom auth** - Too much DevOps overhead
2. **Firebase** - NoSQL doesn't fit our relational needs
3. **AWS RDS + Cognito** - More expensive, more complex



