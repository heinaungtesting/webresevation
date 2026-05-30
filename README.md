<div align="center">

# 🏀 SportsMatch Tokyo

**Find. Join. Play.**  
A real-time sports session platform connecting athletes across Tokyo.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_+_Realtime-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**English** | [**日本語**](./README.ja.md)

[**🚀 Live Demo**](https://sportsmatch-tokyo.vercel.app) &nbsp;·&nbsp; [**📖 Docs**](./docs) &nbsp;·&nbsp; [**🐛 Issues**](https://github.com/heinaungtesting/webresevation/issues)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [📄 Portfolio Description (for screening)](#-portfolio-description-for-screening)
  - [Project Name](#project-name)
  - [Development Period](#development-period)
  - [Purpose / Motivation](#purpose--motivation)
  - [My Responsibilities](#my-responsibilities)
  - [What I Focused On / Challenges](#what-i-focused-on--challenges)
  - [Future Improvements](#future-improvements)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

SportsMatch Tokyo is a modern full-stack web application that makes it effortless to **discover, organise, and join pickup sports sessions** in Tokyo. Players browse open sessions filtered by spor[...]

Key highlights:
- **Real-time** messaging and notifications via Supabase Realtime WebSockets
- **Bilingual** UI (🇺🇸 English / 🇯🇵 Japanese) with `next-intl` locale routing
- **Role-based access control** — Player / Organiser / Admin
- **Serverless-ready** — runs on Vercel with zero cold-start issues
- **Reliability scoring** — no-show tracking keeps the community accountable

---

## ✨ Features

| Role | Capabilities |
|---|---|
| 🏃 **Player** | Browse & filter sessions · Join / leave · Real-time group chat · Attendance history · Notifications |
| 👨‍💼 **Organiser** | Create & edit sessions · Manage participants · Waitlist · Mark attendance · Session chat |
| 🛡️ **Admin** | Dashboard analytics · User & centre management · Moderation · Reports |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (strict mode) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) · [Framer Motion](https://www.framer-motion.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **ORM** | [Prisma 6](https://www.prisma.io/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/) |
| **Auth** | [Supabase Auth](https://supabase.com/auth) (email/password, OAuth, magic links) |
| **Real-time** | [Supabase Realtime](https://supabase.com/realtime) (WebSockets, Postgres CDC) |
| **Caching** | [Upstash Redis](https://upstash.com/) with in-memory fallback |
| **Email** | [Resend](https://resend.com/) |
| **i18n** | [next-intl 4](https://next-intl-docs.vercel.app/) |
| **Forms** | [React Hook Form 7](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Monitoring** | [Sentry](https://sentry.io/) |
| **Testing** | [Vitest](https://vitest.dev/) · [Playwright](https://playwright.dev/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🏗 Architecture

### System Overview

```mermaid
graph TD
    subgraph Client["🌐 Browser"]
        RSC["React Server Components"]
        RCC["React Client Components"]
        RT["Realtime Hooks\n(useConversationMessages,\nuseNotifications)"]
    end

    subgraph NextJS["⚡ Next.js 16 (Vercel Serverless)"]
        MW["i18n Middleware\n(next-intl)"]
        APP["App Router\n/[locale]/..."]
        API["API Routes\n/api/sessions\n/api/conversations\n/api/users"]
        CSRF["CSRF Layer"]
        RL["Rate Limiter\n(Upstash Redis)"]
    end

    subgraph Supabase["🔷 Supabase"]
        AUTH["Auth\n(JWT / OAuth)"]
        DB["PostgreSQL\n(Prisma ORM)"]
        REALTIME["Realtime\n(WebSocket CDC)"]
        RLS["Row-Level\nSecurity"]
    end

    subgraph Infra["☁️ Infrastructure"]
        REDIS["Upstash Redis\n(Cache / Rate-limit)"]
        EMAIL["Resend\n(Transactional Email)"]
        SENTRY["Sentry\n(Errors / Tracing)"]
    end

    Browser -->|"HTTPS"| MW
    MW -->|"Locale detection\nlocale cookie"| APP
    APP --> RSC
    RSC --> API
    RCC -->|"fetch"| API
    RT -->|"WebSocket"| REALTIME
    API --> CSRF
    API --> RL
    RL --> REDIS
    API -->|"Prisma queries"| DB
    DB --> RLS
    AUTH -->|"JWT"| API
    API --> EMAIL
    NextJS --> SENTRY
```

### Data Flow: Sending a Chat Message

```mermaid
sequenceDiagram
    participant U as 👤 User (browser)
    participant API as API Route /api/conversations
    participant PG as PostgreSQL (Supabase)
    participant RT as Supabase Realtime
    participant P2 as 👥 Other Participants

    U->>API: POST /messages { text }
    API->>API: Verify JWT + CSRF token
    API->>PG: INSERT INTO Message (Prisma)
    PG-->>RT: CDC event (postgres_changes INSERT)
    RT-->>U: WebSocket push { new message }
    RT-->>P2: WebSocket push { new message }
    API-->>U: 201 Created
```

### i18n Routing

```mermaid
flowchart LR
    REQ["Incoming Request\nexample.com/sessions"]
    MW["next-intl Middleware"]
    DETECT{"Locale\ndetected?"}
    COOKIE["Read locale cookie\nor Accept-Language"]
    REDIRECT["Redirect to\n/en/sessions or /ja/sessions"]
    HANDLER["[locale] Route Handler"]
    MSGS["Load messages/en.json\nor messages/ja.json"]

    REQ --> MW --> DETECT
    DETECT -- No --> COOKIE --> REDIRECT --> HANDLER
    DETECT -- Yes --> HANDLER
    HANDLER --> MSGS
```

### Database Schema (core entities)

```mermaid
erDiagram
    User ||--o{ SessionParticipant : joins
    User ||--o{ Session : organises
    User ||--o{ Message : sends
    SportCenter ||--o{ Session : hosts
    Session ||--o{ SessionParticipant : has
    Session ||--o{ Message : has
    User ||--o{ Notification : receives
    User ||--o{ Conversation : participates

    User {
        uuid id PK
        string email
        string username
        string[] sport_preferences
        string language_preference
        bool is_admin
    }
    Session {
        uuid id PK
        string title
        string sport
        datetime start_time
        int max_participants
        SessionVibe vibe
    }
    Message {
        uuid id PK
        uuid sender_id FK
        uuid session_id FK
        text content
        datetime created_at
    }
```

---

## 📄 Portfolio Description (for screening)

### Project Name

SportsMatch Tokyo

### Development Period

Start: 2025-11-18  
End: 2026-04-22

### Purpose / Motivation

SportsMatch Tokyo is a web application built to help people in Tokyo who want to play sports find others to play with and discover sessions they can join.

While joining sports events and playing badminton myself, I felt that **finding teammates**, **coordinating schedules**, and **communicating with participants** can be surprisingly time-consuming. In particular, for foreigners living in Tokyo or people who don't yet have many sports connections, it can be difficult to find a place to join casually.

That motivated me to build a single service where users can handle the full flow: **searching for sessions**, **joining**, **chatting after joining**, **receiving notifications**, and **role-based management**.

Also, because I am aiming for an AI Engineer role, I wanted to develop not only AI-related skills but also the ability to design and implement a web service that solves real user problems end-to-end.

### My Responsibilities

This was an individual project. I handled planning, UI design, data modeling, implementation, testing, publishing on GitHub, and deploying a live demo.

During development I used AI tools for support, but I made the decisions myself—what to build, how to integrate code, how to fix errors, and finally verifying that everything works correctly.

### What I Focused On / Challenges

What I focused on most was not just building features, but making the project closer to a production-ready service.

At first I built core features like browsing sessions and joining. However, I wanted it to be more than a portfolio demo—I wanted it to be usable for real users. So I gradually added authentication, role management, real-time chat, notifications, multilingual support, and admin features.

During development I had to combine multiple technologies such as Next.js App Router, Supabase Auth, PostgreSQL, Prisma, Supabase Realtime, Row-Level Security, environment variables, and Vercel deployment. I repeatedly got stuck on issues like auth state handling, realtime communication, database permissions, API errors, and build errors.

When that happened, I carefully read error messages, checked official documentation, and debugged step-by-step to find the root cause. I also used AI tools, but I did not copy generated code blindly—I reviewed it, adjusted it to fit the current codebase, and verified the behavior myself.

What I kept in mind was not just “it works,” but “it’s readable for others and easy to maintain later.” Because of that, I paid attention to type safety, validation, authentication/authorization, error handling, the README, and deployment instructions.

### Future Improvements

Going forward, my goal is to have real users try the service.

First, I want to create a landing page that explains the service more clearly. Then I want to build a Discord community and recruit beta testers.

In beta testing, I want feedback on session search, the join flow, chat, notifications, and mobile usability. Based on that feedback, I want to improve the product into something more user-friendly.

From a technical perspective, I want to improve session search, stabilize notifications, improve the usability of attendance history screens, enhance the admin dashboard UX, and add more tests.

In the future, I also want to add AI features—for example, recommending sessions based on a user’s sports history and preferences, enabling natural-language session search, and adding an AI assistant for inquiries.

---

## 📸 Screenshots

> **Live Demo:** [https://sportsmatch-tokyo.vercel.app](https://sportsmatch-tokyo.vercel.app)

| Session Feed | Session Detail | Real-time Chat |
|:---:|:---:|:---:|
| ![Session feed showing sport filter cards and upcoming sessions](docs/screenshots/session-feed.png) | ![Session detail page with join button and participant list](docs/screenshots/session-detai[...]

| Admin Dashboard | User Profile | Mobile View |
|:---:|:---:|:---:|
| ![Admin analytics dashboard](docs/screenshots/admin-dashboard.png) | ![User profile with sport preferences](docs/screenshots/user-profile.png) | ![Responsive mobile layout](docs/screenshots/mob[...]

> 📷 Screenshots will appear here once placed in `docs/screenshots/`. See the [live demo](https://sportsmatch-tokyo.vercel.app) in the meantime.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- [Supabase](https://supabase.com/) project (free tier is fine)
- [Resend](https://resend.com/) API key (for emails)
- [Upstash Redis](https://upstash.com/) instance (optional — falls back to in-memory)

### 1. Clone

```bash
git clone https://github.com/heinaungtesting/webresevation.git
cd webresevation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Email (Resend)
RESEND_API_KEY="re_your_api_key"

# Cache (Upstash Redis — optional)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="your-random-secret-at-least-16-chars"
```

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) |

### 4. Database setup

```bash
npx prisma generate      # Generate Prisma client
npx prisma migrate deploy # Apply migrations
npx prisma db seed       # (Optional) seed sample data
```

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app will redirect to `/en/` automatically.

---

## 📁 Project Structure

```
webresevation/
├── app/
│   ├── [locale]/                # Locale-prefixed pages (en / ja)
│   │   ├── (auth)/              # Sign-in, sign-up, password reset
│   │   ├── admin/               # Admin dashboard
│   │   ├── sessions/            # Browse & detail pages
│   │   ├── my-sessions/         # User's joined/organised sessions
│   │   ├── messages/            # Direct messaging
│   │   ├── profile/             # User profile
│   │   └── notifications/       # Notification centre
│   ├── api/                     # Next.js Route Handlers
│   │   ├── sessions/            # CRUD + join/leave
│   │   ├── conversations/       # Messaging & chat
│   │   ├── users/               # User management
│   ���   ├── admin/               # Admin endpoints
│   │   └── auth/                # Supabase auth callback
│   └── components/
│       ├── ui/                  # Reusable design-system components
│       ├── sessions/            # Session-specific components
│       ├── chat/                # Chat UI & realtime hooks
│       └── layout/              # Navbar, footer, sidebar
├── lib/
│   ├── supabase/                # Server & client Supabase helpers
│   ├── realtime/                # Realtime React hooks
│   ├── prisma.ts                # Singleton Prisma client
│   ├── rate-limit.ts            # Redis-backed rate limiting
│   ├── cache.ts                 # Caching layer
│   ├── csrf.ts                  # CSRF double-submit cookie
│   ├── env.ts                   # Zod-validated env vars
│   └── validations.ts           # Shared Zod schemas
├── messages/
│   ├── en.json                  # English translations
│   └── ja.json                  # Japanese translations
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Migration history
├── docs/
│   ├── adr/                     # Architecture Decision Records
│   └── ARCHITECTURE.md          # System architecture overview
├── tests/                       # Vitest unit & integration tests
├── e2e/                        # Playwright E2E tests
├── types/                       # Shared TypeScript types
└── i18n.ts                      # next-intl configuration
```

---

## 🧪 Testing

```bash
# Unit & integration tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E (Playwright)
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

| Type | Tool | What is covered |
|---|---|---|
| Unit | Vitest | `lib/`, utility functions, components |
| Integration | Vitest + MSW | API route handlers |
| E2E | Playwright | Critical user flows (auth, join session, chat) |

---

## 🚢 Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repository at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local` in **Project Settings → Environment Variables**
4. Deploy — Vercel auto-detects Next.js

### Supabase post-deploy checklist

- [ ] Add `https://*.vercel.app/api/auth/callback` to **Authentication → URL Configuration**
- [ ] Enable Realtime replication for tables: `Message`, `Notification`, `UserSession`
- [ ] Apply Row-Level Security policies (see `docs/RLS_SECURITY.md`)

### Docker (self-hosted)

```bash
docker compose up --build
```

See [`DOCKER_SETUP.md`](./DOCKER_SETUP.md) for full instructions.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit with conventional commits: `git commit -m 'feat: add my feature'`
4. Push and open a Pull Request

Before submitting, run:

```bash
npm run lint          # ESLint
npx tsc --noEmit      # Type check
npm test              # Unit tests
npm run build         # Production build
```

---

## 📚 Additional Documentation

| Document | Description |
|---|---|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Full system architecture |
| [`docs/adr/ADR-001-realtime-engine.md`](./docs/adr/ADR-001-realtime-engine.md) | Why Supabase Realtime over alternatives |
| [`docs/adr/ADR-002-i18n-middleware.md`](./docs/adr/ADR-002-i18n-middleware.md) | i18n strategy with next-intl |
| [`docs/RLS_SECURITY.md`](./docs/RLS_SECURITY.md) | Row-Level Security policies |
| [`DOCKER_SETUP.md`](./DOCKER_SETUP.md) | Docker / self-hosted setup |
| [`SUPABASE_REALTIME_SETUP.md`](./SUPABASE_REALTIME_SETUP.md) | Realtime configuration guide |
| [`SETUP.md`](./SETUP.md) | Detailed environment setup guide |

---

## 📝 License

This project is licensed under the [MIT License](./LICENSE).

---

## 👤 Author

**Hein Aung** — [@heinaungtesting](https://github.com/heinaungtesting)

---

<div align="center">
Built with ❤️ in Tokyo 🗼
</div>
