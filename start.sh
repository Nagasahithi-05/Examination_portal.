#!/bin/bash

# 🚀 Complete Project Startup and Fix Script
# This script will check, fix, and start both backend and frontend servers

echo "========================================"
echo "🔧 Online Examination System - Startup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
echo ""

# Navigate to project root
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

echo "📁 Project directory: $PROJECT_ROOT"
echo ""

# ========================================
# BACKEND SETUP
# ========================================
echo "========================================"
echo "🔧 Setting up BACKEND"
echo "========================================"

cd "$PROJECT_ROOT/backend"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ .env file created${NC}"
    else
        echo -e "${RED}❌ .env.example not found!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

# Kill any process using port 5001
echo -e "${YELLOW}🔍 Checking for processes on port 5001...${NC}"
lsof -ti:5001 | xargs kill -9 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cleared port 5001${NC}"
fi

echo ""

# ========================================
# FRONTEND SETUP
# ========================================
echo "========================================"
echo "🔧 Setting up FRONTEND"
echo "========================================"

cd "$PROJECT_ROOT/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

# Kill any process using port 3000 or 3001
echo -e "${YELLOW}🔍 Checking for processes on ports 3000 and 3001...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cleared frontend ports${NC}"
fi

echo ""

# ========================================
# START SERVERS
# ========================================
echo "========================================"
echo "🚀 Starting Servers"
echo "========================================"

# Start backend in background
echo -e "${YELLOW}🔄 Starting backend server on port 5001...${NC}"
cd "$PROJECT_ROOT/backend"
npm start > backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to start
sleep 3

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Backend is running successfully${NC}"
else
    echo -e "${RED}❌ Backend failed to start. Check backend.log${NC}"
    exit 1
fi

echo ""

# Start frontend in background
echo -e "${YELLOW}🔄 Starting frontend server...${NC}"
cd "$PROJECT_ROOT/frontend"
BROWSER=none npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait for frontend to start
sleep 5

echo ""
echo "========================================"
echo "✅ SETUP COMPLETE!"
echo "========================================"
echo ""
echo -e "${GREEN}🎉 All servers are running!${NC}"
echo ""
echo "📊 Server Information:"
echo "   🔗 Backend:  http://localhost:5001"
echo "   🔗 Frontend: http://localhost:3000 or http://localhost:3001"
echo ""
echo "📝 Process IDs:"
echo "   Backend PID:  $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "📋 Logs:"
echo "   Backend:  $PROJECT_ROOT/backend/backend.log"
echo "   Frontend: $PROJECT_ROOT/frontend/frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or use: lsof -ti:5001,3000,3001 | xargs kill -9"
echo ""
echo "🌐 Opening browser..."
sleep 2

# Open browser (macOS)
open http://localhost:3000 2>/dev/null || open http://localhost:3001 2>/dev/null

echo ""
echo "✨ Ready to use! Check the browser window."
echo ""
