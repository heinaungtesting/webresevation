# GitHub Copilot Instructions for SportsMatch Tokyo

This document provides context and guidelines for GitHub Copilot when working on this repository.

## Project Overview

SportsMatch Tokyo is a modern web application for organizing and joining sports sessions in Tokyo. It connects sports enthusiasts, enables booking sessions at local sports centers, and facilitates community building through real-time chat and notifications.

## Tech Stack

### Frontend
- **Next.js 15** with App Router (React 19)
- **TypeScript** for type-safe development
- **Tailwind CSS** for styling
- **Lucide Icons** for icons
- **next-intl** for internationalization (English and Japanese)

### Backend
- **Next.js API Routes** (serverless)
- **Prisma** as the ORM
- **PostgreSQL** database (via Supabase)
- **Supabase Auth** for authentication
- **Supabase Realtime** for real-time features (chat, notifications)
- **Resend** for transactional emails

### Testing & Quality
- **Vitest** for unit tests
- **Playwright** for E2E tests
- **ESLint** for linting
- **TypeScript** strict mode enabled

## Code Style & Conventions

### General
- Use **TypeScript** for all new files
- Follow **strict type checking** - no `any` types unless absolutely necessary
- Use **async/await** for asynchronous operations
- Prefer **functional components** and React hooks
- Use **server components** by default in Next.js App Router (add `'use client'` only when necessary)

### File Naming
- Components: PascalCase (e.g., `SessionCard.tsx`)
- Utilities/Hooks: camelCase (e.g., `useAuth.ts`)
- API routes: kebab-case (e.g., `api/sessions/[id]/route.ts`)
- Test files: Same name as source with `.test.ts` or `.spec.ts` suffix

### Import Organization
1. React and Next.js imports
2. Third-party libraries
3. Local components
4. Local utilities and types
5. Styles

### Path Aliases
- Use `@/` prefix for absolute imports from the root directory
- Example: `import { prisma } from '@/lib/prisma'`

## Project Structure

```
webresevation/
├── app/                      # Next.js App Router
│   ├── [locale]/            # Internationalized routes
│   │   ├── (auth)/          # Authentication pages (grouped route)
│   │   ├── admin/           # Admin dashboard
│   │   ├── sessions/        # Session pages
│   │   ├── my-sessions/     # User's sessions
│   │   ├── profile/         # User profile
│   │   ├── messages/        # Messages/chat
│   │   └── notifications/   # Notifications
│   ├── api/                 # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── sessions/        # Session CRUD
│   │   ├── conversations/   # Chat/messaging
│   │   ├── admin/           # Admin endpoints
│   │   └── users/           # User management
│   ├── components/          # React components (app-level)
│   │   ├── ui/              # Reusable UI components
│   │   ├── sessions/        # Session-specific components
│   │   ├── chat/            # Chat components
│   │   └── layout/          # Layout components
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom React hooks
│   └── providers/           # React providers
├── lib/                     # Utilities and configurations
│   ├── prisma.ts            # Prisma client
│   ├── supabase/            # Supabase utilities
│   ├── realtime/            # Supabase Realtime hooks
│   ├── env.ts               # Environment validation
│   └── utils.ts             # Helper functions
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration files
├── tests/                   # Unit test files
├── e2e/                     # E2E tests (Playwright)
└── types/                   # TypeScript type definitions
```

## Database & Prisma

### Working with Prisma
- Always run `npx prisma generate` after schema changes
- Use `npx prisma db push` for development
- Create migrations with `npx prisma migrate dev` for production
- Access Prisma client via `@/lib/prisma`

### Database Patterns
- Use Prisma's type-safe queries
- Implement proper error handling for database operations
- Use transactions for operations that modify multiple tables
- Follow Row-Level Security (RLS) patterns for Supabase

Example:
```typescript
import { prisma } from '@/lib/prisma';

const session = await prisma.session.create({
  data: {
    title: 'Basketball Session',
    sportCenterId: centerId,
    organizerId: userId,
  },
});
```

## Authentication & Authorization

### Supabase Auth
- Use server-side auth helpers from `@/lib/supabase/server`
- Use client-side auth helpers from `@/lib/supabase/client`
- Check user authentication with `createClient().auth.getUser()`
- Handle auth state changes in client components

### Role-Based Access Control
- **Admin**: Access to admin dashboard and management features
- **Organizer**: Can create and manage sessions
- **Player**: Can join sessions and participate

### Auth Patterns
```typescript
// Server Component
import { createClient } from '@/lib/supabase/server';

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

// Client Component
'use client';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

## API Routes

### Structure
- Use Next.js 15 App Router API route handlers
- Return proper HTTP status codes
- Implement error handling
- Use Zod for request validation
- Implement rate limiting for sensitive endpoints

### Example API Route
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await prisma.session.findMany({
      where: { organizerId: user.id },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Real-time Features

### Supabase Realtime
- Use for chat messages and notifications
- Implement proper cleanup in useEffect hooks
- Handle connection states (connecting, connected, disconnected)
- Use custom hooks from `@/lib/realtime/` for common patterns

### Real-time Patterns
```typescript
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

useEffect(() => {
  const channel = supabase
    .channel('session-messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'Message',
      filter: `sessionId=eq.${sessionId}`,
    }, (payload) => {
      // Handle new message
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [sessionId]);
```

## Internationalization (i18n)

- Support English (`en`) and Japanese (`ja`) locales
- Use `next-intl` for translations
- Store translations in `messages/` directory
- Use `useTranslations` hook in components
- Format dates with locale-aware functions from `date-fns`

### i18n Pattern
```typescript
import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations('Sessions');
  
  return <h1>{t('title')}</h1>;
}
```

## Testing

### Unit Tests (Vitest)
- Write tests for utility functions
- Test React components with React Testing Library
- Mock external dependencies (Prisma, Supabase)
- Aim for meaningful test coverage, not 100%

### E2E Tests (Playwright)
- Test critical user flows
- Use page object model pattern
- Run against chromium by default
- Store test data separately

### Running Tests
```bash
npm test                  # Run unit tests
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run E2E tests with UI
```

## Security Best Practices

### Environment Variables
- Never commit secrets to the repository
- Validate environment variables at startup (see `lib/env.ts`)
- Use `NEXT_PUBLIC_` prefix only for client-side variables
- Store sensitive keys in Vercel environment variables

### Input Validation
- Use Zod schemas for all user inputs
- Sanitize data before database operations
- Implement CSRF protection for state-changing operations
- Use rate limiting for API endpoints

### Authentication
- Always verify user authentication in API routes
- Check authorization before allowing access to resources
- Use Supabase's built-in security features
- Implement proper session management

## Common Patterns

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  console.error('Descriptive error message:', error);
  // Return user-friendly error
  return { error: 'User-friendly message' };
}
```

### Loading States
```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    // Operation
  } finally {
    setLoading(false);
  }
};
```

### Form Handling
- Use `react-hook-form` for complex forms
- Implement client-side and server-side validation
- Show appropriate error messages
- Disable submit buttons during submission

## Development Workflow

### Before Committing
1. Run linter: `npm run lint`
2. Run type check: `npx tsc --noEmit`
3. Run tests: `npm test`
4. Build locally: `npm run build`

### Git Commit Messages
- Use conventional commits format
- Examples:
  - `feat: add session booking feature`
  - `fix: resolve authentication issue`
  - `docs: update README`
  - `refactor: simplify session creation logic`
  - `test: add tests for session API`

### CI/CD
- All PRs run through CI pipeline (lint, test, build)
- Automatic deployment to Vercel on merge to main
- E2E tests run in CI environment

## Performance Considerations

- Use Next.js Image component for images
- Implement proper caching strategies
- Use React.memo for expensive components
- Debounce user inputs (use `use-debounce`)
- Implement pagination for large lists
- Use proper database indexes (defined in Prisma schema)

## Accessibility

- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain sufficient color contrast
- Provide alternative text for images

## Documentation

- Add JSDoc comments for complex functions
- Update README when adding new features
- Document API endpoints in OpenAPI format (see `lib/openapi.ts`)
- Keep environment variable examples up to date (`.env.example`)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## Questions or Issues?

- Check existing documentation in the repository
- Review similar implementations in the codebase
- Refer to the CI configuration for build/test commands
- Consult team members for architectural decisions
