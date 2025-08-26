#!/bin/bash

# TOff Development Setup Script
set -e

echo "🚀 Setting up TOff development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install shared dependencies
echo "📦 Installing shared package dependencies..."
cd shared
npm install
npm run build
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating backend .env file..."
    cp env.example .env
    echo "⚠️  Please update the .env file with your configuration"
fi

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up a PostgreSQL database"
echo "2. Update backend/.env with your database URL and other configuration"
echo "3. Run database migrations: cd backend && npx prisma migrate dev"
echo "4. Start the development servers:"
echo "   - Backend: cd backend && npm run dev"
echo "   - Frontend: cd frontend && npm run dev"
echo ""
echo "🌐 The application will be available at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo ""
echo "📚 See deployment/README.md for deployment instructions"
