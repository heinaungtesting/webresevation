# Database Indexes Analysis

## Current Index Structure

### User Table
| Index | Columns | Purpose |
|-------|---------|---------|
| Primary | `id` | Unique identifier |
| Unique | `email` | Fast email lookup for auth |
| Unique | `username` | Fast username lookup |
| Unique | `phone_number` | Phone verification |
| Index | `reliability_score` | Sorting users by reliability |
| Index | `is_banned` | Filter banned users |

**Recommendation**: Add composite index for `(is_banned, reliability_score)` for finding reliable, non-banned users.

### Session Table
| Index | Columns | Purpose |
|-------|---------|---------|
| Primary | `id` | Unique identifier |
| Index | `sport_type` | Filter by sport |
| Index | `skill_level` | Filter by skill |
| Index | `date_time` | Filter/sort by date |
| Index | `sport_center_id` | Join with sport centers |
| Index | `created_by` | Find user's sessions |
| Index | `vibe` | Filter by atmosphere |
| Index | `primary_language` | Filter by language |
| Index | `allow_english` | Find English-friendly sessions |

**Recommendation**: Add composite indexes:
- `(date_time, sport_type)` - Common filter combination
- `(date_time, sport_center_id)` - Find sessions at a venue
- `(sport_type, skill_level, date_time)` - Full filter query

### Message Table
| Index | Columns | Purpose |
|-------|---------|---------|
| Primary | `id` | Unique identifier |
| Index | `conversation_id` | Get messages in conversation |
| Index | `sender_id` | Get user's messages |
| Index | `created_at` | Sort messages by time |

**Recommendation**: Add composite index `(conversation_id, created_at)` for paginated message retrieval.

### Notification Table
| Index | Columns | Purpose |
|-------|---------|---------|
| Primary | `id` | Unique identifier |
| Index | `user_id` | Get user's notifications |
| Index | `read` | Filter read/unread |
| Index | `created_at` | Sort by time |

**Recommendation**: Composite index `(user_id, read, created_at)` already exists.

## Query Performance Analysis

### High-Frequency Queries

1. **Session Discovery** (GET /api/sessions)
   ```sql
   SELECT * FROM "Session"
   WHERE date_time >= NOW()
     AND sport_type = ?
     AND skill_level = ?
   ORDER BY date_time ASC
   LIMIT 20 OFFSET ?
   ```
   **Optimization**: Composite index on `(date_time, sport_type, skill_level)`

2. **User's Sessions** (GET /api/users/me/sessions)
   ```sql
   SELECT * FROM "UserSession"
   INNER JOIN "Session" ON ...
   WHERE user_id = ?
   ORDER BY date_time DESC
   ```
   **Status**: Well indexed with `user_id` index

3. **Conversation Messages** (GET /api/conversations/:id/messages)
   ```sql
   SELECT * FROM "Message"
   WHERE conversation_id = ?
   ORDER BY created_at DESC
   LIMIT 50
   ```
   **Optimization**: Composite index on `(conversation_id, created_at DESC)`

4. **Unread Notifications** (GET /api/users/me/notifications)
   ```sql
   SELECT * FROM "Notification"
   WHERE user_id = ? AND read = false
   ORDER BY created_at DESC
   ```
   **Status**: Would benefit from `(user_id, read, created_at)` composite index

## Recommendations

### Add These Composite Indexes

```prisma
// Session discovery optimization
@@index([date_time, sport_type])
@@index([date_time, sport_center_id])
@@index([sport_type, skill_level, date_time])

// Message pagination optimization
@@index([conversation_id, created_at(sort: Desc)])

// Notification queries
@@index([user_id, read, created_at])
```

### Consider Partial Indexes (PostgreSQL)

For queries that frequently filter active/future sessions:
```sql
CREATE INDEX idx_future_sessions ON "Session" (date_time, sport_type)
WHERE date_time >= NOW();
```

### Maintenance Tasks

1. **VACUUM ANALYZE** - Run regularly to update statistics
2. **REINDEX** - Rebuild fragmented indexes periodically
3. **Monitor with pg_stat_user_indexes** - Track index usage

## Performance Monitoring

### Check Index Usage
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Find Missing Indexes
```sql
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY seq_scan DESC;
```

### Check Slow Queries
Enable pg_stat_statements and review:
```sql
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;
```
