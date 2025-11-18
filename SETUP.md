# SportsMatch Tokyo - Setup Guide

This guide will help you set up the full application with database and authentication.

## Phase 2 Complete! 🎉

The backend integration is complete. To run the app, you need to:

1. **Create a Supabase Project**
2. **Configure Environment Variables**
3. **Run Database Migrations**
4. **Start the Development Server**

---

## Step 1: Create Supabase Project

### 1.1 Sign up for Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email

### 1.2 Create New Project

1. Click "New Project"
2. Fill in:
   - **Project Name**: `sportsmatch-tokyo`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to Tokyo (e.g., Northeast Asia)
3. Click "Create new project"
4. Wait 2-3 minutes for setup to complete

### 1.3 Get Your Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

3. Go to **Project Settings** → **Database**
4. Scroll down to **Connection string** → **URI**
5. Copy the connection string
6. Click "Show" to reveal the password placeholder
7. Replace `[YOUR-PASSWORD]` with your database password

---

## Step 2: Configure Environment Variables

### 2.1 Update .env.local

Open `.env.local` and replace the placeholder values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database URL (from Supabase → Settings → Database → Connection string)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Direct connection URL (same as above but with pgbouncer parameter)
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.2 Verify Configuration

Make sure:
- ✅ All values are filled in
- ✅ No placeholder text remains
- ✅ Database password is correct
- ✅ URLs match your Supabase project

---

## Step 3: Run Database Migrations

### 3.1 Generate Prisma Client

```bash
npm run db:generate
```

### 3.2 Push Database Schema

```bash
npm run db:push
```

This will create all the tables in your Supabase database:
- `User`
- `SportCenter`
- `Session`
- `UserSession`

### 3.3 Seed Database (Optional)

```bash
npm run db:seed
```

This will populate your database with 5 sport centers in Tokyo.

---

## Step 4: Configure Supabase Auth

### 4.1 Enable Email Auth

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Make sure **Email** is enabled
3. Scroll to **Email Templates**
4. Customize the verification email (optional)

### 4.2 Set Redirect URL

1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   ```

### 4.3 Disable Email Confirmation (for testing)

For easier testing, you can disable email confirmation:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **Confirm email** to OFF
3. Click "Save"

**Note**: Re-enable this before production!

---

## Step 5: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Testing the Application

### 1. Sign Up

1. Go to `/signup`
2. Enter email and password
3. Choose language preference
4. Click "Sign Up"
5. If email confirmation is enabled, check your inbox
6. Click verification link (or skip if disabled)

### 2. Log In

1. Go to `/login`
2. Enter your credentials
3. You should be redirected to home
4. Your email should appear in the navigation bar

### 3. Browse Sessions

1. Go to `/sessions`
2. Use search and filters
3. Click on a session to view details

### 4. Mark Attendance

1. Log in first
2. Go to any session detail page
3. Click "I'm Going!"
4. You should see attendance confirmation

---

## Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:seed          # Seed database with sample data
npm run db:studio        # Open Prisma Studio (database GUI)

# Build
npm run build            # Build for production
npm run start            # Start production server
```

---

## Troubleshooting

### Database Connection Error

**Error**: `Error: P1001: Can't reach database server`

**Solution**:
- Check your `DATABASE_URL` in `.env.local`
- Verify your database password is correct
- Make sure your Supabase project is active

### Prisma Client Not Generated

**Error**: `@prisma/client did not initialize`

**Solution**:
```bash
npm run db:generate
```

### Authentication Not Working

**Solutions**:
1. Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Verify redirect URL is configured in Supabase
3. Clear browser cookies and try again

### Build Errors

**Solution**:
```bash
# Clean and rebuild
rm -rf .next
npm run db:generate
npm run build
```

---

## What's Implemented (Phase 2)

### ✅ Authentication System
- Supabase Auth integration
- Email/password signup and login
- Email verification flow
- Protected routes with middleware
- User state management (AuthContext)
- Logout functionality

### ✅ Database Schema
- Users table with email/phone verification
- Sport Centers table
- Sessions table with relationships
- User Sessions (attendance tracking)
- Full TypeScript types

### ✅ API Routes
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/callback` - Email verification callback
- `GET /api/sessions` - List sessions with filters
- `POST /api/sessions` - Create new session
- `GET /api/sessions/[id]` - Get session details
- `POST /api/attendance` - Mark attendance
- `DELETE /api/attendance` - Cancel attendance

### ✅ UI Updates
- Authentication pages connected to API
- Navigation shows user state (logged in/out)
- User dropdown menu with logout
- Email verification page
- Protected route redirects

---

## What's Next (Phase 3)

### 🔜 Internationalization
- Configure next-intl
- Add English/Japanese translations
- Language switcher in navigation

### 🔜 Enhanced Features
- Phone number verification
- User profile page
- My Sessions page (user's attended sessions)
- Session creation form
- Chat system (future)
- Google Maps integration (future)

---

## Deployment to Vercel

When you're ready to deploy:

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables from `.env.local`
5. Update Supabase redirect URL to your Vercel domain
6. Deploy!

---

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review the PRD in the repo
3. Check Supabase documentation: https://supabase.com/docs
4. Check Prisma documentation: https://www.prisma.io/docs

---

**Happy Coding! 🚀**
