#!/bin/bash

echo "🔍 Checking environment variables..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file does not exist!"
    echo "Run: ./setup-env.sh to create it"
    exit 1
fi

echo "✅ .env.local exists"
echo ""

# Check for placeholder values
echo "📋 Checking for placeholder values:"
echo ""

check_var() {
    local var_name=$1
    local value=$(grep "^${var_name}=" .env.local | cut -d'=' -f2- | tr -d '"')
    
    if [ -z "$value" ]; then
        echo "❌ $var_name: NOT SET"
        return 1
    elif [[ "$value" == *"YOUR-"* ]] || [[ "$value" == *"your-"* ]] || [[ "$value" == *"[YOUR"* ]]; then
        echo "⚠️  $var_name: PLACEHOLDER (needs real value)"
        return 1
    else
        echo "✅ $var_name: Set (${#value} characters)"
        return 0
    fi
}

# Required variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "RESEND_API_KEY"
    "CRON_SECRET"
)

all_good=true
for var in "${REQUIRED_VARS[@]}"; do
    if ! check_var "$var"; then
        all_good=false
    fi
done

echo ""
if [ "$all_good" = true ]; then
    echo "🎉 All required environment variables are set!"
else
    echo "⚠️  Some environment variables need to be configured."
    echo ""
    echo "Next steps:"
    echo "1. Open .env.local in your editor"
    echo "2. Replace placeholder values with real credentials from:"
    echo "   - Supabase Dashboard: https://supabase.com/dashboard"
    echo "   - Resend: https://resend.com/api-keys"
    echo "3. Save the file and restart your dev server"
fi
