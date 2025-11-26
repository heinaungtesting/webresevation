# 🏀 SportsMatch Tokyo

A modern web application for organizing and joining sports sessions in Tokyo. Connect with other sports enthusiasts, book sessions at local sports centers, and build your community!

---

## 🎯 Features

### 🏃 For Players
- **Browse Sessions** - Find sports sessions near you
- **Join Sessions** - Sign up for sessions with one click
- **Real-time Chat** - Communicate with other participants
- **Session Management** - Track your upcoming and past sessions
- **Notifications** - Get notified about session updates
- **Multi-language** - English and Japanese support

### 👨‍💼 For Organizers
- **Create Sessions** - Organize sports sessions at local centers
- **Manage Participants** - Track attendance and manage your sessions
- **Mark Attendance** - Record who showed up
- **Session Chat** - Dedicated chat room for each session

### 🔐 For Admins
- **Admin Dashboard** - Overview of platform statistics
- **User Management** - Manage users and permissions
- **Sport Centers** - Add and manage sports facilities
- **Analytics** - Track platform growth and engagement

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Beautiful icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Robust relational database (via Supabase)

### Authentication & Real-time
- **Supabase Auth** - User authentication and authorization
- **Supabase Realtime** - Real-time chat and notifications

### Infrastructure
- **Vercel** - Deployment and hosting
- **Supabase** - Database, auth, and real-time
- **Resend** - Transactional emails

---

## 📋 Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Supabase Account** (free tier works!)
- **Resend Account** (for emails)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/heinaungtesting/webresevation.git
cd webresevation
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Then fill in your actual values:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Email (Resend)
RESEND_API_KEY="re_your_api_key"

# Security
CRON_SECRET="your-random-secret-at-least-16-chars"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Where to get credentials:**
- **Supabase:** https://supabase.com/dashboard → Your Project → Settings
- **Resend:** https://resend.com/api-keys

### 4. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
webresevation/
├── app/                      # Next.js App Router
│   ├── [locale]/            # Internationalized routes
│   │   ├── (auth)/          # Authentication pages
│   │   ├── admin/           # Admin dashboard
│   │   ├── sessions/        # Session pages
│   │   └── my-sessions/     # User's sessions
│   ├── api/                 # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── sessions/        # Session CRUD
│   │   ├── messages/        # Chat messages
│   │   └── admin/           # Admin endpoints
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── sessions/        # Session-specific components
│   │   └── chat/            # Chat components
│   └── contexts/            # React contexts
├── lib/                     # Utilities and configurations
│   ├── prisma.ts            # Prisma client
│   ├── supabase/            # Supabase utilities
│   ├── realtime/            # Supabase Realtime hooks
│   ├── env.ts               # Environment validation
│   └── utils.ts             # Helper functions
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration files
├── public/                  # Static assets
└── types/                   # TypeScript type definitions
```

---

## 🔑 Key Features Explained

### Real-time Chat
Uses **Supabase Realtime** for instant messaging:
- Real-time message delivery
- Typing indicators
- Online/offline presence
- Works on Vercel (serverless)

### Authentication
Powered by **Supabase Auth**:
- Email/password login
- OAuth (Google, GitHub)
- Magic links
- Session management

### Database
**PostgreSQL** with **Prisma ORM**:
- Type-safe queries
- Automatic migrations
- Connection pooling
- Row-level security

### Internationalization
Multi-language support:
- English (en)
- Japanese (ja)
- Easy to add more languages

---

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# E2E tests (Playwright)
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**
   - Go to: Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - See `VERCEL_ENV_SETUP.md` for detailed guide

4. **Deploy**
   - Vercel will automatically deploy on every push
   - Production URL: `https://your-app.vercel.app`

### Important: Supabase Configuration

After deploying to Vercel:

1. **Add Redirect URLs in Supabase**
   - Go to: Supabase Dashboard → Authentication → URL Configuration
   - Add: `https://*.vercel.app/api/auth/callback`
   - Add: `http://localhost:3000/api/auth/callback`

2. **Enable Realtime**
   - Go to: Database → Replication
   - Enable for: `Message`, `Notification`, `UserSession`

---

## 📚 Documentation

- **Environment Setup:** `VERCEL_ENV_SETUP.md`
- **Admin Access:** `FIX_ADMIN_ACCESS.md`
- **OAuth Redirects:** `FIX_VERCEL_REDIRECT.md`
- **Supabase Realtime:** `SUPABASE_REALTIME_SETUP.md`
- **Usage Examples:** `SUPABASE_REALTIME_EXAMPLES.md`
- **Deployment Fixes:** `DEPLOYMENT_FIXES_SUMMARY.md`

---

## 🐛 Troubleshooting

### Common Issues

**1. Environment Variables Not Loading**
- Check `.env.local` exists and has correct values
- Restart dev server after changing env vars
- See: `ENV_FIX_GUIDE.md`

**2. Database Connection Errors**
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure IP is whitelisted (if using direct connection)

**3. OAuth Redirects to Localhost**
- Add Vercel URL to Supabase redirect URLs
- Set `NEXT_PUBLIC_APP_URL` in Vercel
- See: `FIX_VERCEL_REDIRECT.md`

**4. Admin Dashboard 403 Error**
- Set `is_admin = true` in database
- Check user exists in `User` table
- See: `FIX_ADMIN_ACCESS.md`

**5. Real-time Features Not Working**
- Enable replication in Supabase
- Check Supabase credentials are correct
- See: `SUPABASE_REALTIME_SETUP.md`

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **Hein Aung** - [@heinaungtesting](https://github.com/heinaungtesting)

---

## 🙏 Acknowledgments

- **Supabase** - For amazing backend infrastructure
- **Vercel** - For seamless deployment
- **Next.js** - For the powerful React framework
- **Prisma** - For type-safe database access

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/heinaungtesting/webresevation/issues)
- **Email:** support@sportsmatch.tokyo
- **Documentation:** See `/docs` folder

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Payment integration
- [ ] Session ratings and reviews
- [ ] Social features (friends, followers)
- [ ] Tournament organization
- [ ] Skill-based matchmaking
- [ ] Video highlights sharing

---

## 📊 Stats

- **Sports Supported:** Badminton, Basketball, Volleyball, Tennis, Soccer, Futsal, Table Tennis
- **Languages:** English, Japanese
- **Deployment:** Vercel (Serverless)
- **Database:** PostgreSQL (Supabase)
- **Real-time:** Supabase Realtime

---

**Built with ❤️ in Tokyo** 🗼

---

## 🔗 Links

- **Live Demo:** https://sportsmatch-tokyo.vercel.app
- **GitHub:** https://github.com/heinaungtesting/webresevation
- **Documentation:** [/docs](./docs)

---

**Happy Coding! 🚀**
