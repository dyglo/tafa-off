@echo off
echo 🚀 Setting up TOff development environment...

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install root dependencies
    pause
    exit /b 1
)

REM Install shared dependencies
echo 📦 Installing shared package dependencies...
cd shared
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install shared dependencies
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build shared package
    pause
    exit /b 1
)
cd ..

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo 📄 Creating backend .env file...
    copy "env.example" ".env" >nul
    echo ⚠️  Please update the .env file with your configuration
)

cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ Development environment setup complete!
echo.
echo 📋 Next steps:
echo 1. Set up a PostgreSQL database
echo 2. Update backend/.env with your database URL and other configuration
echo 3. Run database migrations: cd backend ^&^& npx prisma migrate dev
echo 4. Start the development servers:
echo    - Backend: cd backend ^&^& npm run dev
echo    - Frontend: cd frontend ^&^& npm run dev
echo.
echo 🌐 The application will be available at:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:5000
echo.
echo 📚 See deployment/README.md for deployment instructions
pause
