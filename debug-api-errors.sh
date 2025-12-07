#!/bin/bash

# 🔍 Quick Debugging Script for API Errors
# Run this to check common issues with /api/users/me and /api/attendance

echo "🔍 Debugging Web Reservation Application"
echo "========================================"
echo ""

# Check if server is running
echo "1️⃣ Checking if dev server is running..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Server is running on port 3000"
else
    echo "❌ Server is NOT running. Start it with: npm run dev"
    exit 1
fi
echo ""

# Check environment variables
echo "2️⃣ Checking environment variables..."
if [ -f .env.local ]; then
    echo "✅ .env.local exists"
    
    # Check critical env vars (without showing values)
    if grep -q "DATABASE_URL" .env.local; then
        echo "✅ DATABASE_URL is set"
    else
        echo "❌ DATABASE_URL is missing"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_URL is set"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_URL is missing"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing"
    fi
else
    echo "❌ .env.local not found"
fi
echo ""

# Check Prisma schema
echo "3️⃣ Checking Prisma setup..."
if [ -f prisma/schema.prisma ]; then
    echo "✅ Prisma schema exists"
    
    # Check if Prisma client is generated
    if [ -d node_modules/.prisma/client ]; then
        echo "✅ Prisma client is generated"
    else
        echo "⚠️  Prisma client not generated. Run: npx prisma generate"
    fi
else
    echo "❌ Prisma schema not found"
fi
echo ""

# Test API endpoints
echo "4️⃣ Testing API endpoints..."
echo ""

echo "Testing /api/health..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ /api/health returns 200"
else
    echo "❌ /api/health returns $HEALTH_RESPONSE"
fi

echo "Testing /api/users/me (without auth)..."
ME_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users/me)
if [ "$ME_RESPONSE" = "401" ]; then
    echo "✅ /api/users/me returns 401 (expected without auth)"
elif [ "$ME_RESPONSE" = "404" ]; then
    echo "⚠️  /api/users/me returns 404 (route not found - check Next.js routing)"
else
    echo "⚠️  /api/users/me returns $ME_RESPONSE"
fi

echo "Testing /api/csrf..."
CSRF_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/csrf)
if [ "$CSRF_RESPONSE" = "200" ]; then
    echo "✅ /api/csrf returns 200"
else
    echo "❌ /api/csrf returns $CSRF_RESPONSE"
fi
echo ""

# Check database connection
echo "5️⃣ Checking database connection..."
echo "Running: npx prisma db pull --force --print"
if npx prisma db pull --force --print > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database"
    echo "   Check your DATABASE_URL in .env.local"
fi
echo ""

# Summary
echo "========================================"
echo "📊 Summary"
echo "========================================"
echo ""
echo "Next steps to debug API errors:"
echo ""
echo "1. Check server terminal for error logs"
echo "   Look for messages starting with:"
echo "   - [/api/users/me]"
echo "   - Error marking attendance:"
echo ""
echo "2. Open browser DevTools → Network tab"
echo "   - Filter for 'users/me' and 'attendance'"
echo "   - Check request headers and cookies"
echo "   - Look for authentication cookies"
echo ""
echo "3. Test authentication:"
echo "   - Try logging in again"
echo "   - Check if cookies are set"
echo "   - Verify Supabase auth is working"
echo ""
echo "4. Check Prisma Studio:"
echo "   npx prisma studio"
echo "   - Verify User table has data"
echo "   - Check Session table structure"
echo ""
echo "5. Enable debug logging:"
echo "   Add to .env.local:"
echo "   DEBUG=prisma:*"
echo ""
echo "========================================"
