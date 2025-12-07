# 🐳 Docker Setup Guide for Windows

This guide will help you run the SportsMatch Tokyo application on your Windows laptop using Docker.

---

## 📋 Prerequisites

### 1. Install Docker Desktop for Windows

1. Download Docker Desktop from [Docker's official website](https://www.docker.com/products/docker-desktop/)
2. Run the installer and follow the prompts
3. **Important**: Enable WSL 2 integration when prompted (recommended for best performance)
4. Restart your computer after installation
5. Open Docker Desktop and wait for it to start (you'll see the whale icon in the system tray)

### 2. Clone or Copy the Project

Make sure you have the project files on your Windows machine.

---

## 🔧 Configuration

### Step 1: Create Environment File

Create a `.env.local` file in the project root with your environment variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Required)
DATABASE_URL=postgresql://user:password@host:5432/database

# Email - Resend (Optional)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=SportsMatch Tokyo <noreply@sportsmatch.tokyo>

# Redis - Upstash (Optional for development)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Cron Jobs
CRON_SECRET=your-random-secret-for-cron-jobs

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_VERSION=1.0.0
```

---

## 🚀 Running the Application

### Option A: Development Mode (Recommended for development)

This mode enables **hot-reloading**, so your changes are reflected immediately.

```powershell
# Open PowerShell or Command Prompt in the project directory
docker compose up dev
```

Or build and run in detached mode:

```powershell
docker compose up dev --build -d
```

### Option B: Production Mode (Optimized build)

This mode creates an optimized production build.

```powershell
docker compose up prod --build
```

### Accessing the Application

Once running, open your browser and go to:
- **http://localhost:3000**

---

## 📝 Common Commands

### Start/Stop Commands

```powershell
# Start development server
docker compose up dev

# Start production server
docker compose up prod

# Start in background (detached mode)
docker compose up dev -d

# Stop all containers
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Build Commands

```powershell
# Rebuild containers (after package.json changes)
docker compose build dev
docker compose build prod

# Rebuild without cache
docker compose build --no-cache
```

### View Logs

```powershell
# View logs
docker compose logs -f dev

# View last 100 lines
docker compose logs --tail=100 dev
```

### Execute Commands Inside Container

```powershell
# Open bash shell in container
docker compose exec dev sh

# Run Prisma commands
docker compose exec dev npx prisma generate
docker compose exec dev npx prisma db push

# Run tests
docker compose exec dev npm run test
```

---

## 🔧 Troubleshooting

### Issue: "Port 3000 is already in use"

**Solution**: Stop other services using port 3000, or change the port in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Issue: Slow performance on Windows

**Solution**: Ensure you're using WSL 2 backend:

1. Open Docker Desktop Settings
2. Go to "General"
3. Enable "Use the WSL 2 based engine"
4. Apply & Restart

Also, make sure your project is stored in the WSL filesystem for best performance:

```powershell
# Move project to WSL filesystem
\\wsl$\Ubuntu\home\yourusername\projects\
```

### Issue: File changes not detected (hot-reload not working)

**Solution**: The `docker-compose.yml` already includes polling for Windows:

```yaml
environment:
  - WATCHPACK_POLLING=true
  - CHOKIDAR_USEPOLLING=true
```

If still not working, try:
```powershell
docker compose down
docker compose up dev --build
```

### Issue: "Cannot connect to database"

**Solution**: Ensure your Supabase credentials are correct in `.env.local` and that:
1. Your Supabase project is running
2. The connection string allows connections from Docker's IP

### Issue: Memory issues during build

**Solution**: Increase Docker's memory allocation:

1. Open Docker Desktop Settings
2. Go to "Resources"
3. Increase Memory to at least 4GB (8GB recommended)
4. Apply & Restart

---

## 🏗️ Project Structure for Docker

```
webresevation/
├── Dockerfile          # Production build
├── Dockerfile.dev      # Development build
├── docker-compose.yml  # Service orchestration
├── .dockerignore       # Files to exclude from build
├── .env.local          # Environment variables (create this)
└── ...
```

---

## 🔄 Updating the Application

After pulling new changes:

```powershell
# Rebuild and restart
docker compose down
docker compose up dev --build
```

---

## 🆘 Need Help?

If you encounter issues not covered here:

1. Check Docker Desktop logs
2. Run `docker compose logs dev` to see application logs
3. Ensure Docker Desktop is running (check system tray)
4. Try restarting Docker Desktop

---

## 📚 Additional Resources

- [Docker Desktop Documentation](https://docs.docker.com/desktop/windows/)
- [WSL 2 Installation Guide](https://docs.microsoft.com/en-us/windows/wsl/install)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
