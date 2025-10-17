# 🚀 Quick Reference Card

## One-Line Commands

```bash
# Start everything
./start.sh

# Stop everything
./stop.sh

# Or manually stop
lsof -ti:5001,3000,3001 | xargs kill -9

# Check backend
curl http://localhost:5001/

# View logs
tail -f backend/backend.log
tail -f frontend/frontend.log

# Test MongoDB
cd backend && node scripts/test-db-connection.js
```

## URLs
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001
- **API Docs**: http://localhost:5001/

## Ports
- **5001**: Backend
- **3000/3001**: Frontend

## Fixed Issues
✅ CORS Error  
✅ Exam Creation 500  
✅ Question Model Mismatch  
✅ Exam Code → Dropdown  
✅ MongoDB Connection  
✅ Port Configuration  

## Status
🟢 Backend: Running  
🟢 Frontend: Running  
🟢 Database: Connected  
🟢 All Systems: Operational  

## Support
📖 COMPLETE_FIX_GUIDE.md  
📖 SYSTEM_STATUS.md  
📖 README.md  
