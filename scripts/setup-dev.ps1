# TOff Development Setup Script for Windows PowerShell
param(
    [switch]$Force = $false
)

Write-Host "🚀 Setting up TOff development environment..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
    
    # Check Node.js version
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Host "❌ Node.js version 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ and try again." -ForegroundColor Red
    exit 1
}

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}

# Install shared dependencies
Write-Host "📦 Installing shared package dependencies..." -ForegroundColor Yellow
Set-Location shared
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install shared dependencies" -ForegroundColor Red
    exit 1
}

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build shared package" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Copy environment file if it doesn't exist
if (-not (Test-Path ".env") -or $Force) {
    Write-Host "📄 Creating backend .env file..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "⚠️  Please update the .env file with your configuration" -ForegroundColor Yellow
}

Set-Location ..

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host ""
Write-Host "✅ Development environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Set up a PostgreSQL database"
Write-Host "2. Update backend/.env with your database URL and other configuration"
Write-Host "3. Run database migrations: cd backend && npx prisma migrate dev"
Write-Host "4. Start the development servers:"
Write-Host "   - Backend: cd backend && npm run dev"
Write-Host "   - Frontend: cd frontend && npm run dev"
Write-Host ""
Write-Host "🌐 The application will be available at:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3000"
Write-Host "   - Backend API: http://localhost:5000"
Write-Host ""
Write-Host "📚 See deployment/README.md for deployment instructions"
