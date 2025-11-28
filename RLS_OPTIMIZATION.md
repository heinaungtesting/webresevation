# RLS Policy Performance Optimization

## Overview
This document describes the performance optimizations applied to Row Level Security (RLS) policies in the Supabase database.

## Issues Identified
The Supabase database linter identified two critical performance issues:

### 1. Auth RLS Initialization Plan (48 policies affected)
**Problem:** Calls to `auth.uid()` in RLS policies were being re-evaluated for each row, causing significant performance degradation at scale.

**Solution:** Wrapped all `auth.uid()` calls with a subquery: `(select auth.uid())`. This ensures the authentication check is performed once per query instead of once per row.

**Impact:** Affects all tables with RLS policies that check user authentication.

### 2. Multiple Permissive Policies (8 tables affected)
**Problem:** Several tables had duplicate or overlapping permissive policies for the same role and action, causing unnecessary policy evaluations.

**Solution:** Consolidated duplicate policies into single, comprehensive policies using OR conditions where appropriate.

**Tables affected:**
- Conversation
- ConversationParticipant
- Notification
- Report
- SportCenter
- UserSession
- Waitlist

## Migration Details

### File Location
`prisma/migrations/20241128000000_optimize_rls_policies/migration.sql`

### Tables Updated
1. **User** - Optimized 2 policies
2. **Notification** - Consolidated 5 policies into 3
3. **Conversation** - Consolidated 4 policies into 3
4. **ConversationParticipant** - Consolidated 5 policies into 4
5. **Message** - Optimized 4 policies
6. **Session** - Optimized 4 policies
7. **UserSession** - Consolidated 5 policies into 4
8. **Favorite** - Optimized 3 policies
9. **Review** - Optimized 4 policies
10. **Report** - Consolidated 4 policies into 3
11. **Waitlist** - Consolidated 4 policies into 3
12. **SportCenter** - Consolidated 2 policies into 2 (with better naming)

## Performance Benefits

### Before Optimization
- `auth.uid()` evaluated for **every row** in query results
- Multiple policies executed even when they protected the same operation
- Suboptimal query plans with repeated authentication checks

### After Optimization
- `auth.uid()` evaluated **once per query**
- Single policy per operation (where possible)
- Optimized query plans with cached authentication results

### Expected Improvements
- **Reduced CPU usage** on database queries
- **Faster query execution** especially for tables with many rows
- **Lower latency** for user-facing operations
- **Better scalability** as data grows

## Security Considerations

All optimizations maintain the **exact same security semantics** as the original policies:
- Users can only access their own data where applicable
- Session creators maintain control over their sessions
- Admins retain elevated privileges
- Conversation participants can only see their conversations
- All existing access controls remain intact

## How to Apply

### For Local Development
```bash
# Apply the migration
npx prisma migrate deploy
```

### For Production (Supabase)
```bash
# Push to Supabase
npx prisma db push
```

Or apply directly in Supabase SQL editor by running the migration file.

## Verification

After applying the migration, you can verify the changes:

1. **Check Policy Count:**
   ```sql
   SELECT schemaname, tablename, COUNT(*) as policy_count
   FROM pg_policies
   WHERE schemaname = 'public'
   GROUP BY schemaname, tablename
   ORDER BY tablename;
   ```

2. **Verify Optimized Syntax:**
   ```sql
   SELECT tablename, policyname, qual
   FROM pg_policies
   WHERE schemaname = 'public'
   AND qual LIKE '%auth.uid()%'
   AND qual NOT LIKE '%(select auth.uid())%';
   ```
   This should return 0 rows if all policies are optimized.

3. **Run Supabase Linter:**
   Check the Supabase dashboard's database linter to confirm all warnings are resolved.

## Testing Recommendations

1. **Functional Testing:**
   - Verify users can still access their own data
   - Confirm users cannot access others' private data
   - Test admin operations still work correctly
   - Validate conversation and message permissions

2. **Performance Testing:**
   - Monitor query execution times before and after
   - Check database CPU and memory usage
   - Test with larger datasets to see performance improvements

3. **Security Testing:**
   - Attempt to access unauthorized data
   - Verify all RLS policies are enforced correctly
   - Test edge cases (deleted users, banned users, etc.)

## Rollback Plan

If issues arise, you can rollback by:

1. Creating a new migration that restores the old policies
2. Or manually restore policies through Supabase SQL editor
3. Keep backup of old policy definitions if needed

## References

- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [Database Linter Documentation](https://supabase.com/docs/guides/database/database-linter)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
