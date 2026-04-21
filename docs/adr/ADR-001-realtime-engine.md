# ADR-001: Real-time Engine — Supabase Realtime

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2024-01-15 |
| **Deciders** | Hein Aung |
| **Tags** | real-time, websocket, chat, notifications |

---

## Context

SportsMatch Tokyo requires two distinct real-time capabilities:

1. **Session group chat** — participants in the same session need instant message delivery without polling.
2. **Notifications** — users need live alerts (new join requests, session updates, chat mentions) while browsing any page of the app.

The application is deployed on **Vercel** (serverless/edge functions), which means:

- Long-lived TCP server sockets are not available on the deployment platform.
- Each function invocation is stateless and ephemeral.
- A managed, external real-time service is required.

---

## Decision

We will use **Supabase Realtime** as the real-time engine for both chat and notifications.

Supabase Realtime exposes a **WebSocket gateway** (maintained by the Supabase infrastructure) that forwards **Postgres Change Data Capture (CDC)** events directly to subscribed browser clients. The application never needs to maintain its own WebSocket server.

### Implementation pattern

```typescript
// lib/realtime/client.ts
const channel = supabase
  .channel(`conversation:${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'Message',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => onNewMessage(payload.new)
  )
  .subscribe();

// Cleanup on unmount
return () => supabase.removeChannel(channel);
```

Each React hook (`useConversationMessages`, `useNotifications`, `useTypingIndicator`) subscribes to a scoped channel and cleans up on unmount, preventing memory leaks and ghost subscriptions.

### Broadcast vs. Postgres Changes

| Use case | Mechanism | Rationale |
|---|---|---|
| Chat messages | `postgres_changes` (INSERT on `Message`) | Durable — messages are persisted before broadcast; late-joiners can query history |
| Typing indicators | `broadcast` (ephemeral) | No persistence needed; lower latency than waiting for a DB write |
| Notifications | `postgres_changes` (INSERT on `Notification`) | Persisted for the notification centre; real-time delivery is a bonus |

---

## Alternatives Considered

### 1. Pusher / Ably

**Pros:** Mature SDKs, generous free tiers, excellent documentation.  
**Cons:** An additional paid vendor with separate billing; messages would need to be pushed from the API layer after the DB write, adding an extra network hop and a potential delivery gap if the API call fails after the DB commit.

### 2. Socket.io / native WebSockets on a persistent server

**Pros:** Full control; supports arbitrary event types.  
**Cons:** Incompatible with Vercel serverless model. Would require a separate long-running Node process (e.g., a Railway/Fly.io container), significantly increasing infrastructure complexity and cost.

### 3. HTTP long-polling / Server-Sent Events (SSE)

**Pros:** Works in serverless environments.  
**Cons:** SSE connections are unidirectional (server→client only); long-polling has high latency and heavy server-side resource consumption at scale.

### 4. Next.js Route Handlers with streaming responses

**Pros:** Zero additional dependencies.  
**Cons:** Vercel limits streaming response duration; not suitable for persistent subscriptions.

---

## Consequences

### Positive

- **No additional infrastructure** — Supabase is already used for auth and PostgreSQL; Realtime is included in every Supabase project at no extra cost on the free tier.
- **Serverless-compatible** — WebSocket connections are managed entirely on the client side; API routes remain stateless.
- **Delivery guarantee** — Because the source of truth is the database, a client that reconnects can always replay missed messages by fetching the history from the REST API.
- **Row-Level Security** — Supabase Realtime respects Postgres RLS policies, so users can only subscribe to channels they are authorised to access.

### Negative / Trade-offs

- **Supabase vendor lock-in** — migrating away from Supabase would require replacing both the auth layer and the real-time layer simultaneously.
- **Realtime replication must be explicitly enabled** per table in the Supabase dashboard (see `SUPABASE_REALTIME_SETUP.md`).
- **Maximum concurrent connections** are capped by the Supabase plan tier. At scale, upgrading the Supabase plan or moving to a dedicated Realtime cluster would be required.
- **Client-only subscriptions** — there is no server-side WebSocket listener; backend jobs (e.g., cron tasks) cannot react to real-time events without polling.

---

## References

- [Supabase Realtime documentation](https://supabase.com/docs/guides/realtime)
- [`lib/realtime/client.ts`](../../lib/realtime/client.ts) — application hooks
- [`SUPABASE_REALTIME_SETUP.md`](../../SUPABASE_REALTIME_SETUP.md) — setup & Supabase configuration
- [`SUPABASE_REALTIME_EXAMPLES.md`](../../SUPABASE_REALTIME_EXAMPLES.md) — usage examples
