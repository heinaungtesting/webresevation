# SportsMatch Tokyo - Complete Setup Guide

A comprehensive guide to set up, develop, test, and deploy SportsMatch Tokyo.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Authentication Setup](#authentication-setup)
6. [Development](#development)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Supabase Account**: [supabase.com](https://supabase.com)
- **Git**: For version control

Optional:
- **Redis**: For production rate limiting (Upstash recommended)
- **Sentry**: For error monitoring

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd webresevation

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Configure environment variables (see Environment Setup)

# 5. Generate Prisma client
npm run db:generate

# 6. Push database schema
npm run db:push

# 7. Seed database (optional)
npm run db:seed

# 8. Start development server
npm run dev
```

---

## Environment Setup

### Required Environment Variables

Create `.env.local` with:

```bash
# ===========================================
# SUPABASE CONFIGURATION
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ===========================================
# DATABASE
# ===========================================
# Connection string from Supabase Dashboard > Settings > Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres

# ===========================================
# APPLICATION
# ===========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ===========================================
# OPTIONAL: REDIS (for production rate limiting)
# ===========================================
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# ===========================================
# OPTIONAL: MONITORING
# ===========================================
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### Getting Supabase Credentials

1. Create project at [supabase.com](https://supabase.com)
2. Go to **Project Settings** > **API**
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **Project Settings** > **Database**
   - Copy **Connection string (URI)** → `DATABASE_URL` and `DIRECT_URL`
   - Replace `[YOUR-PASSWORD]` with your database password

---

## Database Setup

### Schema Generation

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Key Tables

| Table | Description |
|-------|-------------|
| `User` | User profiles, preferences, reliability scores |
| `Session` | Sports sessions with location, time, skill level |
| `SportCenter` | Venues with addresses in English/Japanese |
| `UserSession` | Session attendance tracking |
| `Conversation` | Chat threads (direct & session-based) |
| `Message` | Chat messages |
| `Notification` | User notifications |
| `Report` | User reports for trust & safety |
| `Waitlist` | Session waitlist entries |

### Database Indexes

The schema includes optimized indexes for:
- Session discovery (sport_type, skill_level, date_time)
- Message retrieval (conversation_id, created_at)
- Notification queries (user_id, read, created_at)

See `docs/DATABASE_INDEXES.md` for detailed analysis.

---

## Authentication Setup

### Enable Email Auth

1. Go to **Authentication** > **Providers** in Supabase
2. Enable **Email** provider
3. Configure redirect URLs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)

### Social Auth (Optional)

To enable Google OAuth:
1. Create credentials in Google Cloud Console
2. Add to Supabase: **Authentication** > **Providers** > **Google**
3. Configure redirect URLs

---

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Unit tests
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm run test:ui             # Visual UI mode

# E2E tests (Playwright)
npm run test:e2e            # Run E2E tests
npm run test:e2e:ui         # Run with UI
npm run test:e2e:headed     # Run in headed browser
npm run test:e2e:debug      # Debug mode
npm run test:e2e:report     # View test report

# Database
npm run db:generate         # Generate Prisma client
npm run db:push             # Push schema changes
npm run db:seed             # Seed sample data
npm run db:studio           # Open database GUI
```

### Project Structure

```
├── app/
│   ├── [locale]/           # Internationalized pages
│   ├── api/                # API routes
│   └── components/         # React components
├── lib/                    # Shared utilities
├── prisma/                 # Database schema
├── tests/                  # Unit/integration tests
├── e2e/                    # E2E tests (Playwright)
├── public/                 # Static assets
└── docs/                   # Documentation
```

### Code Style

- ESLint 9 flat config (eslint.config.mjs)
- TypeScript strict mode
- React hooks rules enforced

---

## Testing

### Unit & Integration Tests (Vitest)

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

**Test Structure:**
- `tests/lib/` - Utility function tests
- `tests/api/` - API route tests
- `tests/hooks/` - React hook tests
- `tests/components/` - Component tests
- `tests/integration/` - Integration tests

### E2E Tests (Playwright)

```bash
# Install browsers (first time)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with visual UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

**E2E Test Files:**
- `e2e/home.spec.ts` - Home page tests
- `e2e/auth.spec.ts` - Authentication flows
- `e2e/sessions.spec.ts` - Session management
- `e2e/api.spec.ts` - API endpoint tests

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Environment Variables for Production

Set these in Vercel dashboard:
- All variables from `.env.local`
- Update `NEXT_PUBLIC_APP_URL` to production domain
- Update Supabase redirect URLs

### CI/CD Pipeline

The project includes GitHub Actions workflows:

- `.github/workflows/ci.yml` - Continuous Integration
  - Linting & type checking
  - Unit tests
  - Build verification
  - E2E tests
  - Security audit

- `.github/workflows/deploy.yml` - Vercel deployment
  - Preview deployments for PRs
  - Production deployment on merge to main

### Post-Deployment Checklist

- [ ] Update Supabase redirect URLs
- [ ] Enable email confirmation
- [ ] Configure rate limiting (Redis)
- [ ] Set up Sentry error tracking
- [ ] Configure custom domain
- [ ] Enable SSL

---

## Troubleshooting

### Database Connection Error

**Error**: `Error: P1001: Can't reach database server`

**Solution**:
1. Verify `DATABASE_URL` in `.env.local`
2. Check database password is correct
3. Ensure Supabase project is active
4. Check if IP is allowlisted (if using VPN)

### Prisma Client Not Generated

**Error**: `@prisma/client did not initialize`

**Solution**:
```bash
npm run db:generate
```

### Authentication Issues

**Problem**: Login/signup not working

**Solutions**:
1. Verify Supabase URL and keys
2. Check redirect URLs in Supabase dashboard
3. Clear browser cookies
4. Check browser console for errors

### Build Errors

**Solution**:
```bash
rm -rf .next node_modules/.cache
npm run db:generate
npm run build
```

### Rate Limiting in Development

If you hit rate limits during development:
1. Rate limiting falls back to in-memory store without Redis
2. Clear the in-memory store by restarting the dev server
3. Or configure Upstash Redis for persistent limits

### Test Failures

**Unit tests failing**:
```bash
# Clear cache and retry
npm test -- --clearCache
```

**E2E tests failing**:
```bash
# Update Playwright browsers
npx playwright install

# Run in debug mode
npm run test:e2e:debug
```

---

## Additional Resources

- [Architecture Documentation](docs/ARCHITECTURE.md)
- [Database Indexes Analysis](docs/DATABASE_INDEXES.md)
- [API Documentation](/api/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Playwright Docs](https://playwright.dev/docs)

---

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review the error message in browser console
3. Check Supabase logs: Dashboard > Logs
4. Create an issue on GitHub

---

**Happy Coding! 🚀**
