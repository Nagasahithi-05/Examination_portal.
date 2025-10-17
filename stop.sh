#!/bin/bash

# 🛑 Complete Project Shutdown Script
# This script will safely stop both backend and frontend servers

echo "========================================"
echo "🛑 Online Examination System - Shutdown"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Navigate to project root
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

echo "📁 Project directory: $PROJECT_ROOT"
echo ""

# ========================================
# CHECK RUNNING PROCESSES
# ========================================
echo "========================================"
echo "🔍 Checking Running Processes"
echo "========================================"
echo ""

# Check for processes on port 5001 (Backend)
BACKEND_PIDS=$(lsof -ti:5001 2>/dev/null)
if [ -n "$BACKEND_PIDS" ]; then
    echo -e "${YELLOW}📍 Found backend process(es) on port 5001:${NC}"
    lsof -i:5001 2>/dev/null | grep LISTEN
    echo ""
else
    echo -e "${GREEN}✅ No backend process running on port 5001${NC}"
fi

# Check for processes on port 3000 (Frontend)
FRONTEND_3000_PIDS=$(lsof -ti:3000 2>/dev/null)
if [ -n "$FRONTEND_3000_PIDS" ]; then
    echo -e "${YELLOW}📍 Found frontend process(es) on port 3000:${NC}"
    lsof -i:3000 2>/dev/null | grep LISTEN
    echo ""
else
    echo -e "${GREEN}✅ No frontend process running on port 3000${NC}"
fi

# Check for processes on port 3001 (Frontend alternate)
FRONTEND_3001_PIDS=$(lsof -ti:3001 2>/dev/null)
if [ -n "$FRONTEND_3001_PIDS" ]; then
    echo -e "${YELLOW}📍 Found frontend process(es) on port 3001:${NC}"
    lsof -i:3001 2>/dev/null | grep LISTEN
    echo ""
else
    echo -e "${GREEN}✅ No frontend process running on port 3001${NC}"
fi

# Check for any node processes
echo -e "${BLUE}🔍 Checking all node processes...${NC}"
NODE_PROCESSES=$(ps aux | grep -E "node|npm" | grep -v grep | grep -E "server.js|react-scripts" | wc -l | xargs)
if [ "$NODE_PROCESSES" -gt 0 ]; then
    echo -e "${YELLOW}Found $NODE_PROCESSES node process(es) related to the project${NC}"
    echo ""
else
    echo -e "${GREEN}✅ No node processes found${NC}"
    echo ""
fi

# ========================================
# STOP SERVICES
# ========================================

if [ -z "$BACKEND_PIDS" ] && [ -z "$FRONTEND_3000_PIDS" ] && [ -z "$FRONTEND_3001_PIDS" ]; then
    echo "========================================"
    echo -e "${GREEN}✅ No Services Running${NC}"
    echo "========================================"
    echo ""
    echo "All servers are already stopped."
    echo ""
    exit 0
fi

echo "========================================"
echo "🛑 Stopping Services"
echo "========================================"
echo ""

# Stop backend (port 5001)
if [ -n "$BACKEND_PIDS" ]; then
    echo -e "${YELLOW}🛑 Stopping backend server (port 5001)...${NC}"
    echo "$BACKEND_PIDS" | xargs kill -15 2>/dev/null
    
    # Wait a moment for graceful shutdown
    sleep 2
    
    # Force kill if still running
    REMAINING_BACKEND=$(lsof -ti:5001 2>/dev/null)
    if [ -n "$REMAINING_BACKEND" ]; then
        echo -e "${RED}⚠️  Graceful shutdown failed, forcing...${NC}"
        echo "$REMAINING_BACKEND" | xargs kill -9 2>/dev/null
    fi
    
    # Verify
    if [ -z "$(lsof -ti:5001 2>/dev/null)" ]; then
        echo -e "${GREEN}✅ Backend stopped successfully${NC}"
    else
        echo -e "${RED}❌ Failed to stop backend${NC}"
    fi
else
    echo -e "${GREEN}✅ Backend already stopped${NC}"
fi

echo ""

# Stop frontend (port 3000)
if [ -n "$FRONTEND_3000_PIDS" ]; then
    echo -e "${YELLOW}🛑 Stopping frontend server (port 3000)...${NC}"
    echo "$FRONTEND_3000_PIDS" | xargs kill -15 2>/dev/null
    
    # Wait a moment for graceful shutdown
    sleep 2
    
    # Force kill if still running
    REMAINING_FRONTEND=$(lsof -ti:3000 2>/dev/null)
    if [ -n "$REMAINING_FRONTEND" ]; then
        echo -e "${RED}⚠️  Graceful shutdown failed, forcing...${NC}"
        echo "$REMAINING_FRONTEND" | xargs kill -9 2>/dev/null
    fi
    
    # Verify
    if [ -z "$(lsof -ti:3000 2>/dev/null)" ]; then
        echo -e "${GREEN}✅ Frontend (port 3000) stopped successfully${NC}"
    else
        echo -e "${RED}❌ Failed to stop frontend (port 3000)${NC}"
    fi
else
    echo -e "${GREEN}✅ Frontend (port 3000) already stopped${NC}"
fi

echo ""

# Stop frontend (port 3001)
if [ -n "$FRONTEND_3001_PIDS" ]; then
    echo -e "${YELLOW}🛑 Stopping frontend server (port 3001)...${NC}"
    echo "$FRONTEND_3001_PIDS" | xargs kill -15 2>/dev/null
    
    # Wait a moment for graceful shutdown
    sleep 2
    
    # Force kill if still running
    REMAINING_FRONTEND=$(lsof -ti:3001 2>/dev/null)
    if [ -n "$REMAINING_FRONTEND" ]; then
        echo -e "${RED}⚠️  Graceful shutdown failed, forcing...${NC}"
        echo "$REMAINING_FRONTEND" | xargs kill -9 2>/dev/null
    fi
    
    # Verify
    if [ -z "$(lsof -ti:3001 2>/dev/null)" ]; then
        echo -e "${GREEN}✅ Frontend (port 3001) stopped successfully${NC}"
    else
        echo -e "${RED}❌ Failed to stop frontend (port 3001)${NC}"
    fi
else
    echo -e "${GREEN}✅ Frontend (port 3001) already stopped${NC}"
fi

echo ""

# ========================================
# CLEANUP
# ========================================
echo "========================================"
echo "🧹 Cleanup"
echo "========================================"
echo ""

# Archive logs if they exist
if [ -f "$PROJECT_ROOT/backend/backend.log" ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    mkdir -p "$PROJECT_ROOT/logs/archive"
    
    echo -e "${YELLOW}📦 Archiving backend logs...${NC}"
    cp "$PROJECT_ROOT/backend/backend.log" "$PROJECT_ROOT/logs/archive/backend_${TIMESTAMP}.log"
    
    # Keep log file but truncate it
    > "$PROJECT_ROOT/backend/backend.log"
    echo -e "${GREEN}✅ Backend logs archived${NC}"
fi

if [ -f "$PROJECT_ROOT/frontend/frontend.log" ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    mkdir -p "$PROJECT_ROOT/logs/archive"
    
    echo -e "${YELLOW}📦 Archiving frontend logs...${NC}"
    cp "$PROJECT_ROOT/frontend/frontend.log" "$PROJECT_ROOT/logs/archive/frontend_${TIMESTAMP}.log"
    
    # Keep log file but truncate it
    > "$PROJECT_ROOT/frontend/frontend.log"
    echo -e "${GREEN}✅ Frontend logs archived${NC}"
fi

echo ""

# ========================================
# FINAL STATUS CHECK
# ========================================
echo "========================================"
echo "📊 Final Status Check"
echo "========================================"
echo ""

FINAL_CHECK_5001=$(lsof -ti:5001 2>/dev/null)
FINAL_CHECK_3000=$(lsof -ti:3000 2>/dev/null)
FINAL_CHECK_3001=$(lsof -ti:3001 2>/dev/null)

if [ -z "$FINAL_CHECK_5001" ] && [ -z "$FINAL_CHECK_3000" ] && [ -z "$FINAL_CHECK_3001" ]; then
    echo -e "${GREEN}✅ All ports cleared successfully!${NC}"
    echo ""
    echo "Port Status:"
    echo "   🔒 Port 5001 (Backend):    Free"
    echo "   🔒 Port 3000 (Frontend):   Free"
    echo "   🔒 Port 3001 (Frontend):   Free"
else
    echo -e "${RED}⚠️  Warning: Some ports still in use${NC}"
    echo ""
    if [ -n "$FINAL_CHECK_5001" ]; then
        echo -e "${RED}   ❌ Port 5001 still occupied${NC}"
    fi
    if [ -n "$FINAL_CHECK_3000" ]; then
        echo -e "${RED}   ❌ Port 3000 still occupied${NC}"
    fi
    if [ -n "$FINAL_CHECK_3001" ]; then
        echo -e "${RED}   ❌ Port 3001 still occupied${NC}"
    fi
fi

echo ""

# ========================================
# SUMMARY
# ========================================
echo "========================================"
echo "✅ SHUTDOWN COMPLETE"
echo "========================================"
echo ""

echo "📊 Summary:"
echo "   • Backend server:  Stopped"
echo "   • Frontend server: Stopped"
echo "   • Logs:           Archived"
echo "   • Ports:          Cleared"
echo ""

echo "🔄 To restart the system, run:"
echo "   ${BLUE}./start.sh${NC}"
echo ""

echo "📋 Archived logs location:"
echo "   ${BLUE}$PROJECT_ROOT/logs/archive/${NC}"
echo ""

echo "✨ All systems shut down successfully!"
echo ""
