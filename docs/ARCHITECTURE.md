# SportsMatch Tokyo - Architecture Documentation

## Overview

SportsMatch Tokyo is a Next.js 16 application that connects sports enthusiasts in Tokyo to find and organize pickup sports sessions. The application uses a modern stack with Supabase for authentication, PostgreSQL for data storage, and real-time features.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TailwindCSS 4 |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL (via Supabase) |
| Authentication | Supabase Auth |
| Real-time | Supabase Realtime |
| Caching | Redis (Upstash) with in-memory fallback |
| Monitoring | Sentry |
| Internationalization | next-intl |

## Directory Structure

```
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized pages
│   │   ├── sessions/      # Session discovery & management
│   │   ├── messages/      # Direct messaging
│   │   ├── profile/       # User profile
│   │   └── ...
│   ├── api/               # API routes
│   │   ├── sessions/      # Session CRUD
│   │   ├── conversations/ # Messaging API
│   │   ├── users/         # User management
│   │   └── health/        # Health check
│   └── components/        # React components
├── lib/                   # Shared utilities
│   ├── supabase/         # Supabase client setup
│   ├── prisma.ts         # Prisma client with connection pooling
│   ├── rate-limit.ts     # Rate limiting (Redis/in-memory)
│   ├── cache.ts          # Caching layer
│   ├── tracing.ts        # Request tracing
│   ├── csrf.ts           # CSRF protection
│   └── api-version.ts    # API versioning
├── prisma/               # Database schema & migrations
├── tests/                # Unit & integration tests
├── e2e/                  # E2E tests (Playwright)
└── docs/                 # Documentation
```

## Core Features

### 1. Session Management
- Create, edit, delete sports sessions
- Filter by sport type, skill level, date, vibe
- Join/leave sessions with waitlist support
- Attendance tracking for hosts

### 2. Real-time Chat
- Direct messaging between users
- Session group chats
- Typing indicators
- Read receipts

### 3. User Profiles
- Sport preferences
- Reliability scoring
- Language preferences (for language exchange sessions)

### 4. Trust & Safety
- User reporting system
- No-show tracking
- Admin moderation panel

## Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  API Routes  │────▶│   Prisma    │
│  (React)    │◀────│  (Next.js)   │◀────│    ORM      │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │                    │
       │                   │                    ▼
       │                   │            ┌─────────────┐
       │                   │            │ PostgreSQL  │
       │                   │            │ (Supabase)  │
       │                   │            └─────────────┘
       │                   │
       │                   ▼
       │           ┌──────────────┐
       └──────────▶│   Supabase   │
                   │   Realtime   │
                   └──────────────┘
```

## Security Layers

1. **Authentication**: Supabase Auth with JWT tokens
2. **CSRF Protection**: Double-submit cookie pattern
3. **Rate Limiting**: Redis-backed with in-memory fallback
4. **Input Validation**: Zod schemas on all API routes
5. **SQL Injection Prevention**: Prisma ORM parameterized queries

## Performance Optimizations

1. **Database**
   - Optimized composite indexes for common queries
   - Connection pooling via Supabase pgBouncer
   - Query caching with configurable TTL

2. **API**
   - Response caching with Redis
   - Request tracing for debugging
   - Efficient pagination

3. **Frontend**
   - React Server Components
   - Dynamic imports for code splitting
   - Image optimization via Next.js

## Monitoring & Observability

- **Error Tracking**: Sentry integration
- **Request Tracing**: Correlation IDs across requests
- **Health Checks**: `/api/health` endpoint
- **Logging**: Structured logging with Pino

## Testing Strategy

| Type | Tool | Coverage |
|------|------|----------|
| Unit | Vitest | lib/, components |
| Integration | Vitest + MSW | API routes |
| E2E | Playwright | User flows |

## Deployment

- **Platform**: Vercel (recommended)
- **Database**: Supabase PostgreSQL
- **Cache**: Upstash Redis
- **CI/CD**: GitHub Actions

## API Versioning

The API supports versioning via:
- URL path: `/api/v1/sessions`
- Header: `Accept-Version: v1`
- Query: `?version=1`

Current version: `v1`
