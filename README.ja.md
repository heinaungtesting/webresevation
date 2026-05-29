<div align="center">

# 🏀 SportsMatch Tokyo

**見つける。参加する。プレイする。**  
東京のスポーツプレイヤーをつなぐ、リアルタイムのスポーツセッションプラットフォームです。

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_+_Realtime-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[**English**](./README.md) | **日本語**

[**🚀 Live Demo**](https://sportsmatch-tokyo.vercel.app) &nbsp;·&nbsp; [**📖 Docs**](./docs) &nbsp;·&nbsp; [**🐛 Issues**](https://github.com/heinaungtesting/webresevation/issues)

</div>

---

## 📌 目次

- [概要](#-概要)
- [機能](#-機能)
- [技術スタック](#-技術スタック)
- [アーキテクチャ](#-アーキテクチャ)
- [スクリーンショット](#-スクリーンショット)
- [セットアップ](#-セットアップ)
- [プロジェクト構成](#-プロジェクト構成)
- [テスト](#-テスト)
- [デプロイ](#-デプロイ)
- [コントリビューション](#-コントリビューション)
- [ライセンス](#-ライセンス)

---

## 🎯 概要

SportsMatch Tokyo は、東京で開催されるピックアップスポーツのセッションを、簡単に**探す・作る・参加する**ためのモダンなフルスタックWebアプリケーションです。プレイヤーはスポーツ、時間、場所でセッションを絞り込み、すぐに参加できます。主催者はセッション作成、参加者管理、リアルタイムでの連絡を行えます。

主な特徴:
- Supabase Realtime WebSockets による**リアルタイム**メッセージ・通知
- `next-intl` のロケールルーティングによる**日英バイリンガルUI**（🇺🇸 English / 🇯🇵 Japanese）
- **ロールベースアクセス制御** — Player / Organiser / Admin
- **サーバーレス対応** — Vercel 上で動作し、コールドスタート問題を抑えた構成
- **信頼性スコア** — 無断欠席の追跡により、コミュニティの信頼性を保つ

---

## ✨ 機能

| ロール | できること |
|---|---|
| 🏃 **Player** | セッション閲覧・絞り込み · 参加 / 退出 · リアルタイムグループチャット · 参加履歴 · 通知 |
| 👨‍💼 **Organiser** | セッション作成・編集 · 参加者管理 · ウェイトリスト · 出席確認 · セッションチャット |
| 🛡️ **Admin** | ダッシュボード分析 · ユーザー・施設管理 · モデレーション · レポート |

---

## 🛠 技術スタック

| レイヤー | 技術 |
|---|---|
| **フレームワーク** | [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) |
| **言語** | [TypeScript 5](https://www.typescriptlang.org/) (strict mode) |
| **スタイリング** | [Tailwind CSS 4](https://tailwindcss.com/) · [Framer Motion](https://www.framer-motion.com/) |
| **アイコン** | [Lucide React](https://lucide.dev/) |
| **ORM** | [Prisma 6](https://www.prisma.io/) |
| **データベース** | [Supabase](https://supabase.com/) 経由の [PostgreSQL](https://www.postgresql.org/) |
| **認証** | [Supabase Auth](https://supabase.com/auth)（メール/パスワード、OAuth、マジックリンク） |
| **リアルタイム** | [Supabase Realtime](https://supabase.com/realtime)（WebSockets、Postgres CDC） |
| **キャッシュ** | [Upstash Redis](https://upstash.com/) + インメモリフォールバック |
| **メール** | [Resend](https://resend.com/) |
| **i18n** | [next-intl 4](https://next-intl-docs.vercel.app/) |
| **フォーム** | [React Hook Form 7](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **監視** | [Sentry](https://sentry.io/) |
| **テスト** | [Vitest](https://vitest.dev/) · [Playwright](https://playwright.dev/) |
| **デプロイ** | [Vercel](https://vercel.com/) |

---

## 🏗 アーキテクチャ

### システム概要

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

### データフロー: チャットメッセージ送信

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

### i18n ルーティング

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

### データベーススキーマ（主要エンティティ）

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

## 📸 スクリーンショット

> **Live Demo:** [https://sportsmatch-tokyo.vercel.app](https://sportsmatch-tokyo.vercel.app)

| セッション一覧 | セッション詳細 | リアルタイムチャット |
|:---:|:---:|:---:|
| ![スポーツフィルターカードと今後のセッションを表示するセッション一覧](docs/screenshots/session-feed.png) | ![参加ボタンと参加者リストを表示するセッション詳細ページ](docs/screenshots/session-detail.png) | ![入力中表示付きのリアルタイムチャット画面](docs/screenshots/session-chat.png) |

| 管理者ダッシュボード | ユーザープロフィール | モバイル表示 |
|:---:|:---:|:---:|
| ![管理者分析ダッシュボード](docs/screenshots/admin-dashboard.png) | ![スポーツの好みを表示するユーザープロフィール](docs/screenshots/user-profile.png) | ![レスポンシブモバイルレイアウト](docs/screenshots/mobile-view.png) |

> 📷 スクリーンショットは `docs/screenshots/` に配置すると表示されます。それまでは [live demo](https://sportsmatch-tokyo.vercel.app) を確認してください。

---

## 🚀 セットアップ

### 前提条件

- **Node.js** 18+
- **npm** 9+
- [Supabase](https://supabase.com/) プロジェクト（無料プランで可）
- [Resend](https://resend.com/) APIキー（メール送信用）
- [Upstash Redis](https://upstash.com/) インスタンス（任意 — 未設定の場合はインメモリにフォールバック）

### 1. クローン

```bash
git clone https://github.com/heinaungtesting/webresevation.git
cd webresevation
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数

```bash
cp .env.example .env.local
```

`.env.local` に以下を設定します:

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

| 変数 | 取得場所 |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) |

### 4. データベースセットアップ

```bash
npx prisma generate      # Prisma client を生成
npx prisma migrate deploy # マイグレーションを適用
npx prisma db seed       # （任意）サンプルデータを投入
```

### 5. 開発サーバー起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開くと、アプリは自動的に `/en/` にリダイレクトされます。

---

## 📁 プロジェクト構成

```
webresevation/
├── app/
│   ├── [locale]/                # ロケール付きページ (en / ja)
│   │   ├── (auth)/              # サインイン、サインアップ、パスワードリセット
│   │   ├── admin/               # 管理者ダッシュボード
│   │   ├── sessions/            # セッション一覧・詳細ページ
│   │   ├── my-sessions/         # 自分が参加/主催しているセッション
│   │   ├── messages/            # ダイレクトメッセージ
│   │   ├── profile/             # ユーザープロフィール
│   │   └── notifications/       # 通知センター
│   ├── api/                     # Next.js Route Handlers
│   │   ├── sessions/            # CRUD + 参加/退出
│   │   ├── conversations/       # メッセージ・チャット
│   │   ├── users/               # ユーザー管理
│   │   ├── admin/               # 管理者用エンドポイント
│   │   └── auth/                # Supabase auth callback
│   └── components/
│       ├── ui/                  # 再利用可能なデザインシステムコンポーネント
│       ├── sessions/            # セッション専用コンポーネント
│       ├── chat/                # チャットUI・リアルタイムhooks
│       └── layout/              # Navbar、footer、sidebar
├── lib/
│   ├── supabase/                # サーバー/クライアント用Supabaseヘルパー
│   ├── realtime/                # リアルタイムReact hooks
│   ├── prisma.ts                # Singleton Prisma client
│   ├── rate-limit.ts            # Redisベースのレート制限
│   ├── cache.ts                 # キャッシュレイヤー
│   ├── csrf.ts                  # CSRF double-submit cookie
│   ├── env.ts                   # Zodで検証する環境変数
│   └── validations.ts           # 共通Zodスキーマ
├── messages/
│   ├── en.json                  # 英語翻訳
│   └── ja.json                  # 日本語翻訳
├── prisma/
│   ├── schema.prisma            # データベーススキーマ
│   └── migrations/              # マイグレーション履歴
├── docs/
│   ├── adr/                     # Architecture Decision Records
│   └── ARCHITECTURE.md          # システムアーキテクチャ概要
├── tests/                       # Vitest unit & integration tests
├── e2e/                         # Playwright E2E tests
├── types/                       # 共通TypeScript型
└── i18n.ts                      # next-intl 設定
```

---

## 🧪 テスト

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

| 種類 | ツール | 対象 |
|---|---|---|
| Unit | Vitest | `lib/`、ユーティリティ関数、コンポーネント |
| Integration | Vitest + MSW | API route handlers |
| E2E | Playwright | 重要なユーザーフロー（認証、セッション参加、チャット） |

---

## 🚢 デプロイ

### Vercel（推奨）

1. GitHub に push
2. [vercel.com/new](https://vercel.com/new) でリポジトリをインポート
3. **Project Settings → Environment Variables** に `.env.local` の全環境変数を追加
4. デプロイ — Vercel が Next.js を自動検出します

### Supabase デプロイ後チェックリスト

- [ ] `https://*.vercel.app/api/auth/callback` を **Authentication → URL Configuration** に追加
- [ ] `Message`、`Notification`、`UserSession` テーブルの Realtime replication を有効化
- [ ] Row-Level Security ポリシーを適用（`docs/RLS_SECURITY.md` を参照）

### Docker（セルフホスト）

```bash
docker compose up --build
```

詳しい手順は [`DOCKER_SETUP.md`](./DOCKER_SETUP.md) を確認してください。

---

## 🤝 コントリビューション

コントリビューションを歓迎します！

1. リポジトリを fork
2. feature ブランチを作成: `git checkout -b feat/my-feature`
3. conventional commits でコミット: `git commit -m 'feat: add my feature'`
4. push して Pull Request を作成

提出前に以下を実行してください:

```bash
npm run lint          # ESLint
npx tsc --noEmit      # Type check
npm test              # Unit tests
npm run build         # Production build
```

---

## 📚 追加ドキュメント

| ドキュメント | 説明 |
|---|---|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | システムアーキテクチャ全体 |
| [`docs/adr/ADR-001-realtime-engine.md`](./docs/adr/ADR-001-realtime-engine.md) | Supabase Realtime を選んだ理由 |
| [`docs/adr/ADR-002-i18n-middleware.md`](./docs/adr/ADR-002-i18n-middleware.md) | next-intl による i18n 戦略 |
| [`docs/RLS_SECURITY.md`](./docs/RLS_SECURITY.md) | Row-Level Security ポリシー |
| [`DOCKER_SETUP.md`](./DOCKER_SETUP.md) | Docker / セルフホストのセットアップ |
| [`SUPABASE_REALTIME_SETUP.md`](./SUPABASE_REALTIME_SETUP.md) | Realtime 設定ガイド |
| [`SETUP.md`](./SETUP.md) | 詳細な環境構築ガイド |

---

## 📝 ライセンス

このプロジェクトは [MIT License](./LICENSE) のもとで公開されています。

---

## 👤 作者

**Hein Aung** — [@heinaungtesting](https://github.com/heinaungtesting)

---

<div align="center">
東京で ❤️ を込めて開発 🗼
</div>
