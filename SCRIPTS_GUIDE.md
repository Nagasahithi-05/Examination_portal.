# 🔧 Startup and Shutdown Scripts Guide

## Overview

Two powerful scripts to manage your Online Examination System servers with a single command.

---

## 🚀 start.sh - Automated Startup

### What It Does

The `start.sh` script automates the complete setup and launch process:

1. ✅ **Checks Dependencies** - Verifies Node.js is installed
2. ✅ **Environment Setup** - Creates `.env` from `.env.example` if needed
3. ✅ **Installs Packages** - Runs `npm install` for both backend and frontend
4. ✅ **Clears Ports** - Kills any processes occupying ports 5001, 3000, 3001
5. ✅ **Starts Backend** - Launches backend server on port 5001
6. ✅ **Starts Frontend** - Launches frontend server on port 3000/3001
7. ✅ **Opens Browser** - Automatically opens the application in your browser
8. ✅ **Creates Logs** - Generates log files for debugging

### Usage

```bash
# Make executable (first time only)
chmod +x start.sh

# Run the script
./start.sh
```

### Output

```
========================================
🔧 Online Examination System - Startup
========================================

✅ Node.js version: v24.7.0
📁 Project directory: /path/to/project

========================================
🔧 Setting up BACKEND
========================================
✅ .env file exists
✅ Backend dependencies already installed
🔍 Checking for processes on port 5001...
✅ Cleared port 5001

========================================
🔧 Setting up FRONTEND
========================================
✅ Frontend dependencies already installed
🔍 Checking for processes on ports 3000 and 3001...
✅ Cleared frontend ports

========================================
🚀 Starting Servers
========================================
🔄 Starting backend server on port 5001...
✅ Backend started (PID: 12345)
✅ Backend is running successfully

🔄 Starting frontend server...
✅ Frontend started (PID: 12346)

========================================
✅ SETUP COMPLETE!
========================================

🎉 All servers are running!

📊 Server Information:
   🔗 Backend:  http://localhost:5001
   🔗 Frontend: http://localhost:3000

📝 Process IDs:
   Backend PID:  12345
   Frontend PID: 12346

📋 Logs:
   Backend:  /path/to/project/backend/backend.log
   Frontend: /path/to/project/frontend/frontend.log

🛑 To stop servers:
   kill 12345 12346
   or use: ./stop.sh

🌐 Opening browser...

✨ Ready to use! Check the browser window.
```

### Features

- **Automatic Port Management**: Kills existing processes automatically
- **Dependency Checking**: Ensures all npm packages are installed
- **Environment Setup**: Creates `.env` if missing
- **Background Execution**: Servers run in background with log files
- **Browser Launch**: Opens the application automatically
- **Process Tracking**: Shows PIDs for easy management

### Log Files

- **Backend**: `backend/backend.log`
- **Frontend**: `frontend/frontend.log`

View logs in real-time:
```bash
tail -f backend/backend.log
tail -f frontend/frontend.log
```

---

## 🛑 stop.sh - Safe Shutdown

### What It Does

The `stop.sh` script safely shuts down all services:

1. ✅ **Identifies Processes** - Finds all running backend/frontend processes
2. ✅ **Graceful Shutdown** - Sends SIGTERM for clean exit
3. ✅ **Force Kill** - Uses SIGKILL if graceful shutdown fails
4. ✅ **Verifies Shutdown** - Checks all ports are cleared
5. ✅ **Archives Logs** - Saves logs with timestamps
6. ✅ **Cleans Up** - Truncates log files for next run
7. ✅ **Status Report** - Shows final system status

### Usage

```bash
# Make executable (first time only)
chmod +x stop.sh

# Run the script
./stop.sh
```

### Output

```
========================================
🛑 Online Examination System - Shutdown
========================================

📁 Project directory: /path/to/project

========================================
🔍 Checking Running Processes
========================================

📍 Found backend process(es) on port 5001:
node    12345 user   17u  IPv6 0x... TCP *:5001 (LISTEN)

📍 Found frontend process(es) on port 3000:
node    12346 user   17u  IPv6 0x... TCP *:3000 (LISTEN)

🔍 Checking all node processes...
Found 2 node process(es) related to the project

========================================
🛑 Stopping Services
========================================

🛑 Stopping backend server (port 5001)...
✅ Backend stopped successfully

🛑 Stopping frontend server (port 3000)...
✅ Frontend (port 3000) stopped successfully

✅ Frontend (port 3001) already stopped

========================================
🧹 Cleanup
========================================

📦 Archiving backend logs...
✅ Backend logs archived

📦 Archiving frontend logs...
✅ Frontend logs archived

========================================
📊 Final Status Check
========================================

✅ All ports cleared successfully!

Port Status:
   🔒 Port 5001 (Backend):    Free
   🔒 Port 3000 (Frontend):   Free
   🔒 Port 3001 (Frontend):   Free

========================================
✅ SHUTDOWN COMPLETE
========================================

📊 Summary:
   • Backend server:  Stopped
   • Frontend server: Stopped
   • Logs:           Archived
   • Ports:          Cleared

🔄 To restart the system, run:
   ./start.sh

📋 Archived logs location:
   /path/to/project/logs/archive/

✨ All systems shut down successfully!
```

### Features

- **Graceful Shutdown**: Tries SIGTERM first (allows cleanup)
- **Force Kill Backup**: Uses SIGKILL if graceful fails
- **Comprehensive Checking**: Identifies all related processes
- **Log Archival**: Saves logs with timestamps before cleanup
- **Port Verification**: Confirms all ports are free
- **Status Reporting**: Clear feedback on shutdown progress

### Shutdown Methods

1. **Graceful** (SIGTERM -15):
   - Allows processes to clean up
   - Closes connections properly
   - Saves state

2. **Force** (SIGKILL -9):
   - Immediate termination
   - Used if graceful fails
   - No cleanup possible

### Archived Logs

Logs are automatically archived to:
```
logs/archive/backend_YYYYMMDD_HHMMSS.log
logs/archive/frontend_YYYYMMDD_HHMMSS.log
```

View archived logs:
```bash
ls -lh logs/archive/
cat logs/archive/backend_20251015_072530.log
```

---

## 🔄 Complete Workflow

### Starting the System

```bash
# First time setup
chmod +x start.sh stop.sh

# Start all services
./start.sh

# Browser opens automatically
# Backend: http://localhost:5001
# Frontend: http://localhost:3000
```

### Working with the System

```bash
# Check backend status
curl http://localhost:5001/

# View real-time logs
tail -f backend/backend.log    # Backend logs
tail -f frontend/frontend.log  # Frontend logs

# Check running processes
lsof -i:5001,3000,3001

# Check process IDs
ps aux | grep node | grep -E "server.js|react-scripts"
```

### Stopping the System

```bash
# Safe shutdown (recommended)
./stop.sh

# Manual shutdown (if script fails)
lsof -ti:5001,3000,3001 | xargs kill -9
```

### Restarting

```bash
# Quick restart
./stop.sh && ./start.sh

# Or create restart.sh
./stop.sh && sleep 2 && ./start.sh
```

---

## 🐛 Troubleshooting

### start.sh Issues

#### "Node.js is not installed"
```bash
# Install Node.js
brew install node  # macOS
# or download from https://nodejs.org/
```

#### "Permission denied"
```bash
# Make executable
chmod +x start.sh
```

#### "Port already in use"
- Script automatically handles this
- If issues persist, run `./stop.sh` first

#### "npm install failed"
```bash
# Manual installation
cd backend && npm install
cd frontend && npm install
```

### stop.sh Issues

#### "Failed to stop services"
```bash
# Force kill all
lsof -ti:5001,3000,3001 | xargs kill -9

# Kill all node processes (nuclear option)
pkill -9 node
```

#### "Permission denied"
```bash
# Make executable
chmod +x stop.sh
```

#### "Ports still occupied"
```bash
# Identify processes
lsof -i:5001
lsof -i:3000
lsof -i:3001

# Manual kill
kill -9 <PID>
```

---

## 📊 Script Comparison

| Feature | start.sh | stop.sh |
|---------|----------|---------|
| Checks dependencies | ✅ | ❌ |
| Installs packages | ✅ | ❌ |
| Clears ports | ✅ | ✅ |
| Starts services | ✅ | ❌ |
| Stops services | ❌ | ✅ |
| Creates logs | ✅ | ❌ |
| Archives logs | ❌ | ✅ |
| Opens browser | ✅ | ❌ |
| Status check | ✅ | ✅ |
| Graceful shutdown | ❌ | ✅ |
| Force kill | ✅ | ✅ |

---

## 🎯 Best Practices

### Development Workflow

```bash
# Morning: Start system
./start.sh

# Work on your code
# Changes auto-reload

# Evening: Stop system
./stop.sh
```

### Testing Workflow

```bash
# Start system
./start.sh

# Test features
# Check logs if issues

# Stop system
./stop.sh

# Review archived logs
ls logs/archive/
```

### Debugging Workflow

```bash
# Start with live logs
./start.sh
tail -f backend/backend.log &
tail -f frontend/frontend.log &

# Reproduce issue
# Check logs

# Stop when done
./stop.sh
```

---

## 💡 Advanced Usage

### Custom Start Script

Create `start-dev.sh`:
```bash
#!/bin/bash
export NODE_ENV=development
export DEBUG=true
./start.sh
```

### Custom Stop Script

Create `stop-clean.sh`:
```bash
#!/bin/bash
./stop.sh
rm -rf backend/node_modules
rm -rf frontend/node_modules
```

### Restart Script

Create `restart.sh`:
```bash
#!/bin/bash
echo "🔄 Restarting system..."
./stop.sh
sleep 3
./start.sh
echo "✅ Restart complete!"
```

Make executable:
```bash
chmod +x start-dev.sh stop-clean.sh restart.sh
```

---

## 📝 Environment Variables

Both scripts respect these environment variables:

```bash
# Backend port (default: 5001)
export PORT=5001

# Frontend port (default: 3000)
export REACT_APP_PORT=3000

# Node environment
export NODE_ENV=development

# Enable debug mode
export DEBUG=true
```

---

## 🚀 Quick Commands Summary

```bash
# Essential Commands
./start.sh                           # Start everything
./stop.sh                            # Stop everything
tail -f backend/backend.log          # View backend logs
tail -f frontend/frontend.log        # View frontend logs

# Status Checks
curl http://localhost:5001/          # Test backend
lsof -i:5001,3000,3001              # Check ports
ps aux | grep node                   # Check processes

# Manual Operations
lsof -ti:5001,3000,3001 | xargs kill -9  # Force kill all
pkill -9 node                        # Kill all node processes
```

---

## ✅ Checklist

### Before Starting
- [ ] Node.js installed
- [ ] Scripts are executable (`chmod +x`)
- [ ] `.env` file exists or will be created
- [ ] Ports 5001, 3000, 3001 are free

### After Starting
- [ ] Backend responds: `curl http://localhost:5001/`
- [ ] Frontend opens in browser
- [ ] No errors in logs
- [ ] MongoDB connected (check backend log)

### Before Stopping
- [ ] Save any work in progress
- [ ] Close browser tabs (optional)
- [ ] Note PIDs if needed

### After Stopping
- [ ] All ports cleared
- [ ] Logs archived
- [ ] No node processes running

---

**Created**: October 15, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
