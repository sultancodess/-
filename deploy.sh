#!/bin/bash

# Parsona Deployment Script
# This script helps deploy Parsona to various platforms

set -e

echo "🚀 Parsona Deployment Script"
echo "=============================="

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found!"
    echo "Please copy backend/.env.example to backend/.env and configure your environment variables."
    exit 1
fi

# Function to deploy to Railway
deploy_railway() {
    echo "🚂 Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        echo "❌ Railway CLI not found. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    
    # Deploy backend
    echo "📦 Deploying backend..."
    cd backend
    railway login
    railway link
    railway up
    cd ..
    
    # Deploy frontend
    echo "🎨 Deploying frontend..."
    cd frontend
    npm run build
    # You can deploy the dist folder to Vercel, Netlify, or other static hosting
    echo "✅ Frontend built successfully. Deploy the 'dist' folder to your static hosting service."
    cd ..
    
    echo "✅ Railway deployment completed!"
}

# Function to deploy to Render
deploy_render() {
    echo "🎭 Deploying to Render..."
    echo "Please follow these steps:"
    echo "1. Connect your GitHub repository to Render"
    echo "2. Create a new Web Service for the backend"
    echo "3. Set the build command: cd backend && npm install"
    echo "4. Set the start command: cd backend && npm start"
    echo "5. Add your environment variables in Render dashboard"
    echo "6. Create a new Static Site for the frontend"
    echo "7. Set the build command: cd frontend && npm install && npm run build"
    echo "8. Set the publish directory: frontend/dist"
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "▲ Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo "❌ Vercel CLI not found. Please install it first:"
        echo "npm install -g vercel"
        exit 1
    fi
    
    # Deploy frontend
    echo "🎨 Deploying frontend to Vercel..."
    cd frontend
    npm run build
    vercel --prod
    cd ..
    
    echo "✅ Frontend deployed to Vercel!"
    echo "Note: Deploy your backend separately to Railway, Render, or another Node.js hosting service."
}

# Function to setup local development
setup_local() {
    echo "💻 Setting up local development environment..."
    
    # Install backend dependencies
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Install frontend dependencies
    echo "🎨 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    # Check if MongoDB is running
    if ! pgrep -x "mongod" > /dev/null; then
        echo "⚠️  MongoDB is not running. Please start MongoDB:"
        echo "   - On macOS: brew services start mongodb/brew/mongodb-community"
        echo "   - On Ubuntu: sudo systemctl start mongod"
        echo "   - On Windows: net start MongoDB"
    fi
    
    echo "✅ Local development setup completed!"
    echo ""
    echo "To start the application:"
    echo "1. Backend: cd backend && npm run dev"
    echo "2. Frontend: cd frontend && npm run dev"
}

# Function to run tests
run_tests() {
    echo "🧪 Running tests..."
    
    # Backend tests
    echo "📦 Running backend tests..."
    cd backend
    npm test
    cd ..
    
    # Frontend tests (if they exist)
    if [ -f "frontend/package.json" ] && grep -q "test" frontend/package.json; then
        echo "🎨 Running frontend tests..."
        cd frontend
        npm test
        cd ..
    fi
    
    echo "✅ All tests completed!"
}

# Function to build for production
build_production() {
    echo "🏗️  Building for production..."
    
    # Build frontend
    echo "🎨 Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
    
    # Install backend dependencies
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install --production
    cd ..
    
    echo "✅ Production build completed!"
}

# Function to check environment
check_environment() {
    echo "🔍 Checking environment..."
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        echo "✅ Node.js: $(node --version)"
    else
        echo "❌ Node.js not found!"
        exit 1
    fi
    
    # Check npm version
    if command -v npm &> /dev/null; then
        echo "✅ npm: $(npm --version)"
    else
        echo "❌ npm not found!"
        exit 1
    fi
    
    # Check MongoDB
    if command -v mongod &> /dev/null; then
        echo "✅ MongoDB: $(mongod --version | head -n 1)"
    else
        echo "⚠️  MongoDB not found in PATH"
    fi
    
    # Check environment variables
    if [ -f "backend/.env" ]; then
        echo "✅ Backend .env file exists"
        
        # Check critical environment variables
        source backend/.env
        
        if [ -z "$MONGODB_URI" ]; then
            echo "⚠️  MONGODB_URI not set"
        else
            echo "✅ MONGODB_URI configured"
        fi
        
        if [ -z "$JWT_SECRET" ]; then
            echo "⚠️  JWT_SECRET not set"
        else
            echo "✅ JWT_SECRET configured"
        fi
        
        if [ -z "$GEMINI_API_KEY" ]; then
            echo "⚠️  GEMINI_API_KEY not set"
        else
            echo "✅ GEMINI_API_KEY configured"
        fi
    else
        echo "❌ Backend .env file not found"
    fi
    
    echo "✅ Environment check completed!"
}

# Main menu
case "$1" in
    "railway")
        deploy_railway
        ;;
    "render")
        deploy_render
        ;;
    "vercel")
        deploy_vercel
        ;;
    "local")
        setup_local
        ;;
    "test")
        run_tests
        ;;
    "build")
        build_production
        ;;
    "check")
        check_environment
        ;;
    *)
        echo "Usage: $0 {railway|render|vercel|local|test|build|check}"
        echo ""
        echo "Commands:"
        echo "  railway  - Deploy to Railway"
        echo "  render   - Instructions for Render deployment"
        echo "  vercel   - Deploy frontend to Vercel"
        echo "  local    - Setup local development environment"
        echo "  test     - Run all tests"
        echo "  build    - Build for production"
        echo "  check    - Check environment and configuration"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh local    # Setup local development"
        echo "  ./deploy.sh check    # Check environment"
        echo "  ./deploy.sh build    # Build for production"
        echo "  ./deploy.sh railway  # Deploy to Railway"
        exit 1
        ;;
esac