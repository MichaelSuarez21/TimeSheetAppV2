#!/bin/bash

# Deployment Testing Script for TimeSheet App

echo "=== TimeSheet App Deployment Testing ==="
echo "This script will test if your app is ready for deployment."
echo ""

# Check Node.js version
echo "Checking Node.js version..."
node -v
if [ $? -ne 0 ]; then
  echo "❌ Node.js is not installed or not in PATH"
  exit 1
else
  echo "✅ Node.js is installed"
fi

# Check dependencies
echo ""
echo "Checking dependencies..."
npm ci
if [ $? -ne 0 ]; then
  echo "❌ Dependencies installation failed"
  exit 1
else
  echo "✅ Dependencies are correctly specified"
fi

# Check build
echo ""
echo "Attempting production build..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
else
  echo "✅ Build succeeded"
fi

# Check environment variables
echo ""
echo "Checking environment variables..."
if [ -f .env.local ]; then
  echo "✅ .env.local exists"
  
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    echo "✅ Supabase environment variables found"
  else
    echo "❌ Supabase environment variables missing"
  fi
else
  echo "❌ .env.local file missing"
  echo "Please create a .env.local file with the following variables:"
  echo "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key"
fi

# Summary
echo ""
echo "=== Deployment Readiness Summary ==="
echo ""
echo "Your TimeSheet app has been tested for deployment."
echo "If all checks passed, you're ready to deploy!"
echo ""
echo "Next steps:"
echo "1. Choose a deployment platform (Vercel, Netlify, etc.)"
echo "2. Set up your environment variables on the platform"
echo "3. Deploy your application"
echo "4. Test the deployed version"
echo ""
echo "See DEPLOYMENT.md for detailed instructions." 