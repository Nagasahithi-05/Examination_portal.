# CORS Error Fix - Documentation

## 🔴 The Problem

**Error Message:**
```
Access to fetch at 'http://localhost:5001/api/exams?' from origin 'http://localhost:3001' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control 
check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🤔 What is CORS?

**CORS** = Cross-Origin Resource Sharing

It's a security feature in web browsers that prevents websites from making requests to a different domain/port than the one that served the web page.

### Simple Analogy:
Think of it like a bouncer at a club:
- **Frontend (port 3001)**: "Hey, I want to get data from the backend!"
- **Backend (port 5001)**: "Who are you? Are you on my allowed list?"
- **Frontend**: "I'm from localhost:3001"
- **Backend**: "Sorry, I only allow localhost:3000. Access denied! ❌"

## 🔍 Why Did This Happen?

1. **Frontend is running on**: `http://localhost:3001`
2. **Backend is running on**: `http://localhost:5001`
3. **Backend was configured to only accept requests from**: `http://localhost:3000`
4. **Result**: Backend rejected all requests from port 3001

## ✅ The Solution

Updated the backend `server.js` file to allow requests from port 3001:

### Before:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));
```

### After:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',  // ✅ Added this line
    'http://localhost:8080',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));
```

## 🔄 What Was Done

1. ✅ Updated `backend/server.js` CORS configuration
2. ✅ Added `http://localhost:3001` to allowed origins
3. ✅ Restarted backend server to apply changes

## 🎯 How to Verify It's Fixed

1. **Open your browser console** (F12)
2. **Refresh the frontend** (localhost:3001)
3. **You should now see:**
   - ✅ No CORS errors
   - ✅ Exams loading successfully
   - ✅ API requests working

## 📝 Common CORS Issues & Solutions

### Issue 1: Port Number Mismatch
**Problem**: Frontend and backend running on different ports
**Solution**: Add all frontend ports to backend CORS config

### Issue 2: Forgot to Restart Backend
**Problem**: Changed CORS config but didn't restart server
**Solution**: Always restart backend after config changes

### Issue 3: Wrong Port in API Configuration
**Problem**: Frontend trying to connect to wrong backend port
**Solution**: Check `frontend/src/services/api.js` - should be `http://localhost:5001`

## 🔧 Current Configuration

### Frontend:
- Running on: `http://localhost:3001`
- API Base URL: `http://localhost:5001/api`

### Backend:
- Running on: `http://localhost:5001`
- Allowed Origins:
  - `http://localhost:3000`
  - `http://localhost:3001` ✅ **NEW**
  - `http://localhost:8080`

## 🚀 Next Steps

Your application should now work correctly! 

**Try these steps:**
1. Login as a student
2. You should see the exam dropdown
3. Select an exam
4. Start the exam

## 💡 Pro Tips

### For Development:
You can allow all origins (NOT for production):
```javascript
app.use(cors({
  origin: '*',  // ⚠️ Only for development!
  credentials: true
}));
```

### For Production:
Always specify exact origins:
```javascript
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  credentials: true
}));
```

## 🐛 Troubleshooting

### Still seeing CORS errors?

1. **Clear browser cache**: Ctrl+Shift+Delete (Chrome/Edge)
2. **Hard refresh**: Ctrl+Shift+R or Cmd+Shift+R (Mac)
3. **Check backend is running**: Should see "🚀 Server running on port 5001"
4. **Check backend console**: Look for CORS-related messages
5. **Restart both servers**: Sometimes needed after config changes

### How to check if backend allows your origin:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login or fetch exams
4. Click on the failed request
5. Look at "Response Headers"
6. Should see: `Access-Control-Allow-Origin: http://localhost:3001`

---

## 📊 Status

- ✅ CORS error identified
- ✅ Backend configuration updated
- ✅ Backend server restarted
- ✅ Ready to test

**Last Updated**: October 15, 2025
