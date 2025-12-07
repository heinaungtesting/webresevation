# Row-Level Security (RLS) Implementation for _prisma_migrations

## Summary
Successfully secured the `public._prisma_migrations` table by enabling Row-Level Security (RLS) and implementing restrictive access policies.

## Problem
The `_prisma_migrations` table was exposed to PostgREST API without RLS protection, creating potential security risks:
- **Information Leakage**: Migration history could reveal database schema evolution and business logic
- **Unauthorized Access**: `authenticated` and `anon` roles could potentially read/modify migration metadata
- **Compliance Risk**: System tables should never be accessible via public APIs

## Solution Implemented

### Migration: `20251127000001_secure_prisma_migrations`

Applied the following security measures:

1. **Revoked Public Access**
   ```sql
   REVOKE ALL ON TABLE public._prisma_migrations FROM authenticated, anon, public;
   ```
   - Removes all privileges from API-accessible roles
   - Prevents direct table access via PostgREST

2. **Enabled Row-Level Security**
   ```sql
   ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
   ```
   - Activates RLS enforcement on the table
   - Ensures all queries are subject to policy checks

3. **Created Restrictive Policy**
   ```sql
   CREATE POLICY deny_all_api_access ON public._prisma_migrations
     FOR ALL
     TO public, authenticated, anon
     USING (false)
     WITH CHECK (false);
   ```
   - Explicitly denies all operations (SELECT, INSERT, UPDATE, DELETE)
   - Applies to `public`, `authenticated`, and `anon` roles
   - `USING (false)` blocks reads
   - `WITH CHECK (false)` blocks writes

## Impact

### ✅ What Still Works
- **Prisma Migrations**: Continue to work normally
  - `service_role` and `postgres` superuser bypass RLS by design
  - Migration commands (`prisma migrate deploy`, `prisma migrate dev`) unaffected
- **Database Administration**: Full access for database owners and service roles

### 🚫 What's Now Blocked
- **API Access**: `authenticated` and `anon` roles cannot access the table
- **PostgREST Queries**: All API queries to `_prisma_migrations` will return empty results
- **Unauthorized Reads**: No information leakage about migration history

## Verification

Run the verification script to confirm security configuration:

```bash
# In Supabase SQL Editor, run:
cat scripts/verify-rls-security.sql
```

Expected results:
1. ✅ `rls_enabled = TRUE`
2. ✅ Policy `deny_all_api_access` exists with `USING (false)`
3. ✅ No grants to `authenticated` or `anon` roles

## Best Practices Applied

1. **Defense in Depth**
   - Combined REVOKE (removes privileges) + RLS (enforces policies)
   - Multiple layers of protection

2. **Principle of Least Privilege**
   - Only database owners and service roles have access
   - API roles have zero access

3. **Explicit Deny**
   - Policy explicitly denies access rather than relying on absence of GRANT
   - More secure than implicit denial

## Alternative Approaches (Not Implemented)

### Option A: Move to Internal Schema
```sql
ALTER TABLE public._prisma_migrations SET SCHEMA internal;
```
**Pros**: Completely removes from PostgREST exposure
**Cons**: Requires schema management, may break existing tools

### Option B: Service-Role-Only Policy
```sql
CREATE POLICY service_only ON public._prisma_migrations
  FOR ALL TO service_role USING (true);
```
**Pros**: More explicit about who has access
**Cons**: `service_role` is a JWT role, not a DB role in Supabase

## Maintenance

### Adding New System Tables
When adding new system/admin tables, follow this pattern:

```sql
-- 1. Revoke public access
REVOKE ALL ON TABLE public.your_system_table FROM authenticated, anon, public;

-- 2. Enable RLS
ALTER TABLE public.your_system_table ENABLE ROW LEVEL SECURITY;

-- 3. Create deny policy
CREATE POLICY deny_all_api_access ON public.your_system_table
  FOR ALL TO public, authenticated, anon
  USING (false) WITH CHECK (false);
```

### Monitoring
Periodically audit RLS status:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false;
```

## References
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgREST Security](https://postgrest.org/en/stable/auth.html)

## Migration Applied
- **Date**: 2025-11-27
- **Migration**: `20251127000001_secure_prisma_migrations`
- **Status**: ✅ Successfully Applied
- **Database**: Supabase PostgreSQL (aws-1-ap-northeast-1)

---

# RLS Performance Optimization

## Summary
Successfully optimized all RLS policies by wrapping `auth.uid()` calls in scalar subqueries to prevent per-row re-evaluation and improve query performance at scale.

## Problem
Direct calls to `auth.uid()` in RLS policy expressions can be treated as volatile functions and re-evaluated for every row processed by a query, causing:
- **Performance degradation** on large result sets
- **Increased CPU usage** due to repeated function calls
- **Slower query execution** especially for joins and scans

## Solution Implemented

### Migration: `20251127000002_optimize_rls_policies`

Applied comprehensive RLS policy optimization across all tables:

1. **Wrapped auth.uid() in Scalar Subqueries**
   ```sql
   -- Before (per-row evaluation)
   USING (user_id = auth.uid())
   
   -- After (single evaluation per statement)
   USING (user_id = (SELECT auth.uid()::text))
   ```

2. **Added Type Casting**
   - All `auth.uid()` calls now include `::text` cast
   - Matches the `TEXT` type of `User.id` column
   - Prevents type mismatch errors

3. **Optimized Subquery Patterns**
   ```sql
   -- Optimized EXISTS pattern
   USING (
     EXISTS (
       SELECT 1 FROM public."ConversationParticipant" cp
       WHERE cp.conversation_id = conversation_id
         AND cp.user_id = (SELECT auth.uid()::text)
     )
   )
   ```

## Tables Optimized

All RLS policies have been optimized on the following tables:
- ✅ **User** - Profile access and updates
- ✅ **Session** - Session creation and management
- ✅ **UserSession** - Attendance tracking
- ✅ **Conversation** - Chat conversations
- ✅ **ConversationParticipant** - Conversation membership
- ✅ **Message** - Chat messages (primary focus)
- ✅ **Favorite** - Bookmarked sessions
- ✅ **Review** - Session feedback
- ✅ **Notification** - User notifications
- ✅ **Report** - Trust & safety reports
- ✅ **Waitlist** - Session waitlists
- ✅ **SportCenter** - Venue information

## Performance Impact

### Expected Improvements
- **Query Execution Time**: 30-70% faster for queries with RLS
- **CPU Usage**: Reduced by avoiding repeated `auth.uid()` calls
- **Scalability**: Better performance with large datasets (1000+ rows)

### Critical Indexes Added
```sql
-- Composite indexes for optimal policy performance
CREATE INDEX "ConversationParticipant_conversation_user_idx" 
  ON "ConversationParticipant"(conversation_id, user_id);

CREATE INDEX "Message_conversation_sender_idx" 
  ON "Message"(conversation_id, sender_id);

CREATE INDEX "UserSession_session_user_status_idx" 
  ON "UserSession"(session_id, user_id, status);

CREATE INDEX "User_is_admin_idx" 
  ON "User"(is_admin) WHERE is_admin = true;
```

## Verification

Run the performance testing script to verify optimization:

```bash
# In Supabase SQL Editor
cat scripts/test-rls-performance.sql
```

Expected results:
1. ✅ All policies show `(SELECT auth.uid()::text)` pattern
2. ✅ `EXPLAIN ANALYZE` shows InitPlan/SubPlan for auth.uid()
3. ✅ Index scans instead of sequential scans
4. ✅ Execution time < 50ms for typical queries

## Best Practices Applied

### 1. Scalar Subquery Pattern
```sql
-- ✅ GOOD: Evaluated once per statement
user_id = (SELECT auth.uid()::text)

-- ❌ BAD: Evaluated per row
user_id = auth.uid()::text
```

### 2. EXISTS Over IN
```sql
-- ✅ GOOD: More efficient, stops at first match
EXISTS (
  SELECT 1 FROM table WHERE condition
)

-- ❌ LESS OPTIMAL: Builds full result set
column IN (SELECT column FROM table)
```

### 3. Proper Indexing
- All foreign keys indexed
- Composite indexes for multi-column lookups
- Partial indexes for filtered queries (e.g., `is_admin = true`)

## Monitoring & Maintenance

### Check Policy Performance
```sql
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM "Message" 
WHERE conversation_id = 'some-id'
LIMIT 50;
```

Look for:
- **InitPlan** or **SubPlan** for `auth.uid()` - indicates single evaluation
- **Index Scan** - good performance
- **Seq Scan** - may need additional indexes

### Audit RLS Status
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false
  AND tablename NOT LIKE '_prisma_%';
```

## Migration History
- **2025-11-27**: `20251127000002_optimize_rls_policies` - Optimized all RLS policies with scalar subqueries
- **2025-11-28**: `20251128000001_fix_function_search_path` - Secured `is_conversation_participant` function

---

# Function Security

## Summary
Secured the `is_conversation_participant` function by setting an explicit `search_path`.

## Problem
The function was flagged with "Function Search Path Mutable", meaning it ran with the caller's `search_path`. This creates risks:
- **Security**: Malicious users could manipulate `search_path` to make the function execute code from a different schema
- **Predictability**: Function behavior could change depending on who calls it
- **Stability**: Naming collisions could break the function

## Solution Implemented

### Migration: `20251128000001_fix_function_search_path`

Dynamically updated the function configuration:

```sql
ALTER FUNCTION public.is_conversation_participant 
SET search_path = public, pg_catalog;
```

### Impact
- ✅ Function now always resolves objects in `public` first, then `pg_catalog`
- ✅ Immune to `search_path` manipulation attacks
- ✅ Deterministic behavior regardless of caller

## Verification

Run the verification script:
```bash
# In Supabase SQL Editor
cat scripts/verify-function-security.sql
```

Expected result: `status = '✅ Secured'`
